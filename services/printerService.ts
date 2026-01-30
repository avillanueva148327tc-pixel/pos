
import { UtangRecord, BranchConfig, ReceiptTemplate } from '../types';

/**
 * PrinterService handles Bluetooth (BLE) and USB communication for ESC/POS thermal printers.
 * Provides direct-to-hardware printing, bypassing standard OS print dialogs.
 */
export class PrinterService {
  private static btDevice: any = null;
  private static btCharacteristic: any = null;
  
  private static usbDevice: any = null;
  private static usbEndpointNumber: number | null = null;

  private static ESC = 0x1B;
  private static GS = 0x1D;

  static get isBluetoothSupported(): boolean {
    return 'bluetooth' in (navigator as any);
  }

  static get isUsbSupported(): boolean {
    return 'usb' in navigator;
  }

  // --- BLUETOOTH CONNECTION ---

  static async connectBluetooth(): Promise<boolean> {
    try {
      if (!this.isBluetoothSupported) throw new Error("Bluetooth not supported");

      // Use acceptAllDevices to ensure we can see ALL printers, regardless of their advertised name
      // We list all common printer service UUIDs in optionalServices so we can access them if found
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard BLE
          0x18f0,
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Star Micronics
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Generic / Transparent UART
          '0000ae00-0000-1000-8000-00805f9b34fb', // Some Chinese clones
          0xae00,
          '0000ff00-0000-1000-8000-00805f9b34fb', // Default proprietary
          0xff00
        ]
      });

      const server = await device.gatt?.connect();
      const services = await server?.getPrimaryServices();
      
      if (!services || services.length === 0) throw new Error("No BLE services found");

      // Iterate services to find a writable characteristic
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.btDevice = device;
            this.btCharacteristic = char;
            
            // Disconnect USB if BT connects to avoid conflict
            this.disconnectUsb(); 
            
            // Add listener for disconnection
            device.addEventListener('gattserverdisconnected', () => {
              this.btDevice = null;
              this.btCharacteristic = null;
            });

            return true;
          }
        }
      }
      throw new Error("No writable characteristic found on device.");
    } catch (error: any) {
      const errStr = error ? String(error).toLowerCase() : '';
      // Gracefully handle common errors to avoid console noise
      if (
        error.name === 'NotFoundError' || 
        error.name === 'SecurityError' ||
        errStr.includes('cancelled') || 
        errStr.includes('canceled') ||
        errStr.includes('user') ||
        errStr.includes('permissions policy') // Blocked by browser/iframe policy
      ) {
        return false;
      }
      console.error("BT Connection Failed:", error);
      throw error; // Re-throw to show error message in UI
    }
  }

  // --- USB CONNECTION ---

  static async connectUsb(): Promise<boolean> {
    try {
      if (!this.isUsbSupported) throw new Error("WebUSB not supported");

      // 1. Request device - Allow class 7 (Printer) and class 0 (Interface-specific)
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ classCode: 7 }, { classCode: 0 }] 
      });

      // 2. Open device session
      await device.open();
      
      // 3. Select configuration (if not already selected)
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      const config = device.configuration;
      if (!config) throw new Error("Device configuration unavailable.");

      // 4. Find the correct Interface and Bulk Out Endpoint
      let targetInterface = null;
      let targetEndpoint = null;

      // Strategy A: Look for explicit Printer Class (7) with a Bulk Out endpoint
      for (const intf of config.interfaces) {
        const alt = intf.alternates[0];
        // Check for Printer Class (7)
        if (alt.interfaceClass === 7) {
           const ep = alt.endpoints.find((e: any) => e.direction === 'out' && e.type === 'bulk');
           if (ep) {
             targetInterface = intf;
             targetEndpoint = ep;
             break;
           }
        }
      }

      // Strategy B: Fallback - Look for ANY interface with a Bulk Out endpoint (for non-standard cheap printers)
      if (!targetInterface) {
         for (const intf of config.interfaces) {
            const alt = intf.alternates[0];
            // Skip HID (3) or Hub (9) classes just in case
            if (alt.interfaceClass !== 3 && alt.interfaceClass !== 9) {
                const ep = alt.endpoints.find((e: any) => e.direction === 'out' && e.type === 'bulk');
                if (ep) {
                   targetInterface = intf;
                   targetEndpoint = ep;
                   break;
                }
            }
         }
      }

      if (!targetInterface || !targetEndpoint) {
        throw new Error("No compatible bulk-write interface found on this device.");
      }

      // 5. Claim the interface
      try {
        await device.claimInterface(targetInterface.interfaceNumber);
      } catch (e: any) {
        // Handle "Unable to claim interface" error specifically
        if (e.message && e.message.includes('Unable to claim interface')) {
           // This usually happens on Windows if a driver (like 'usbprint') has locked the device.
           // We throw a specific error text that the UI can recognize to show help.
           throw new Error("DRIVER_LOCKED"); 
        }
        throw e;
      }

      this.usbDevice = device;
      this.usbEndpointNumber = targetEndpoint.endpointNumber;
      
      // Disconnect BT if USB connects
      this.disconnectBluetooth();

      return true;
    } catch (error: any) {
      const errStr = error ? String(error).toLowerCase() : '';
      if (
        error.name === 'NotFoundError' || 
        error.name === 'SecurityError' ||
        errStr.includes('cancelled') || 
        errStr.includes('canceled') ||
        errStr.includes('permissions policy')
      ) {
        return false;
      }
      // Re-throw specific errors for the UI to handle
      throw error;
    }
  }

  // --- STATUS & DISCONNECT ---

  static isConnected(): boolean {
    const btConnected = !!(this.btDevice && this.btDevice.gatt?.connected);
    const usbConnected = !!(this.usbDevice && this.usbDevice.opened);
    return btConnected || usbConnected;
  }

  static getConnectionType(): 'bluetooth' | 'usb' | 'none' {
    if (this.btDevice && this.btDevice.gatt?.connected) return 'bluetooth';
    if (this.usbDevice && this.usbDevice.opened) return 'usb';
    return 'none';
  }

  static async disconnectBluetooth() {
    if (this.btDevice?.gatt?.connected) {
      await this.btDevice.gatt.disconnect();
    }
    this.btDevice = null;
    this.btCharacteristic = null;
  }

  static async disconnectUsb() {
    if (this.usbDevice?.opened) {
      await this.usbDevice.close();
    }
    this.usbDevice = null;
    this.usbEndpointNumber = null;
  }

  // --- SENDING DATA ---

  private static async sendData(data: Uint8Array) {
    // USB Send
    if (this.usbDevice && this.usbDevice.opened && this.usbEndpointNumber !== null) {
      await this.usbDevice.transferOut(this.usbEndpointNumber, data);
      return;
    }

    // Bluetooth Send
    if (this.btCharacteristic) {
      // FIX: Smaller chunks (50 bytes) for stability on cheap BLE chips
      const CHUNK_SIZE = 50; 
      
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        
        // FIX: Prefer writeWithoutResponse if available for speed and to avoid GATT busy errors
        if (this.btCharacteristic.properties.writeWithoutResponse) {
           await this.btCharacteristic.writeValueWithoutResponse(chunk);
        } else {
           await this.btCharacteristic.writeValue(chunk);
        }
        
        // FIX: Increase delay slightly to prevent buffer overflow (25ms)
        await new Promise(r => setTimeout(r, 25)); 
      }
      return;
    }
    
    throw new Error("No device connected");
  }

  static async printReceipt(transaction: UtangRecord, branch: BranchConfig, template: ReceiptTemplate, cashierName?: string) {
    if (!this.isConnected()) throw new Error("Printer disconnected");

    const encoder = new TextEncoder();
    const init = [this.ESC, 0x40];
    const center = [this.ESC, 0x61, 1];
    const left = [this.ESC, 0x61, 0];
    const right = [this.ESC, 0x61, 2];
    const boldOn = [this.ESC, 0x45, 1];
    const boldOff = [this.ESC, 0x45, 0];
    const lf = [0x0A];
    const cut = [this.GS, 0x56, 0];
    const doubleWidth = [this.GS, 0x21, 0x11]; // Double height & width
    const normalWidth = [this.GS, 0x21, 0x00];

    const data: number[] = [];
    
    // Config based on paper size (approximate chars per line)
    // 58mm ~ 32 chars, 80mm ~ 48 chars
    const is80mm = template.paperWidth === '80mm';
    const lineWidth = is80mm ? 48 : 32;
    const divider = "-".repeat(lineWidth) + "\n";
    const doubleDivider = "=".repeat(lineWidth) + "\n";

    // Header
    data.push(...init, ...center, ...boldOn);
    
    // Branch Name (Double Size for 80mm or standard for 58mm)
    if (is80mm) data.push(...doubleWidth);
    data.push(...encoder.encode(branch.name.toUpperCase() + "\n"));
    if (is80mm) data.push(...normalWidth);
    
    data.push(...boldOff);
    if (template.headerSubtitle) data.push(...encoder.encode(template.headerSubtitle + "\n"));
    if (template.showBranchAddress) data.push(...encoder.encode(branch.address + "\n"));
    if (template.showBranchContact) data.push(...encoder.encode(branch.contact + "\n"));
    data.push(...encoder.encode(divider));

    // Transaction Details
    data.push(...left);
    data.push(...encoder.encode(`SUKI: ${transaction.customerName.toUpperCase()}\n`));
    if (template.showDateTime) data.push(...encoder.encode(`DATE: ${transaction.date}\n`));
    data.push(...encoder.encode(`REF:  #${transaction.id.slice(0, 8).toUpperCase()}\n`));
    if (cashierName) data.push(...encoder.encode(`CASHIER: ${cashierName.toUpperCase()}\n`));
    data.push(...encoder.encode(doubleDivider));

    // Itemized List Header
    // Item .............. Qty . Price
    if (is80mm) {
      data.push(...boldOn);
      data.push(...encoder.encode("ITEM".padEnd(24) + "QTY".padEnd(8) + "TOTAL".padStart(16) + "\n"));
      data.push(...boldOff);
    }

    // Items
    transaction.items.forEach(item => {
        data.push(...boldOn);
        data.push(...encoder.encode(item.name.toUpperCase() + "\n"));
        data.push(...boldOff);
        
        const qtyStr = `${item.quantity} x ${item.price.toFixed(2)}`;
        const totalStr = `${(item.quantity * item.price).toFixed(2)}`;
        
        // Dynamic Spacing
        const spaceNeeded = lineWidth - qtyStr.length - totalStr.length;
        const space = spaceNeeded > 0 ? " ".repeat(spaceNeeded) : " ";
        
        data.push(...encoder.encode(qtyStr + space + totalStr + "\n"));
    });
    
    data.push(...encoder.encode(divider));

    // Financials
    const formatRow = (label: string, value: string, bold: boolean = false) => {
        if (bold) data.push(...boldOn);
        const spaceNeeded = lineWidth - label.length - value.length;
        const space = spaceNeeded > 0 ? " ".repeat(spaceNeeded) : " ";
        data.push(...encoder.encode(label + space + value + "\n"));
        if (bold) data.push(...boldOff);
    };

    data.push(...right); 
    data.push(...left);

    if (is80mm) data.push(...doubleWidth);
    formatRow("TOTAL", `P${transaction.totalAmount.toFixed(2)}`, true);
    if (is80mm) data.push(...normalWidth);

    formatRow("PAID", `P${transaction.paidAmount.toFixed(2)}`);
    
    const bal = transaction.totalAmount - transaction.paidAmount;
    if (bal > 0) {
      formatRow("BALANCE", `P${bal.toFixed(2)}`, true);
    }

    data.push(...lf);

    // Footer
    data.push(...center);
    if (template.footerText) data.push(...encoder.encode(template.footerText + "\n"));
    data.push(...encoder.encode(template.brandingText + "\n"));
    
    // Feed and Cut
    data.push(...lf, ...lf, ...lf, ...lf, ...cut);

    await this.sendData(new Uint8Array(data));
  }

  static async printTestPage() {
    if (!this.isConnected()) return;
    const encoder = new TextEncoder();
    const type = this.getConnectionType().toUpperCase();
    const data = [
      0x1B, 0x40, 0x1B, 0x61, 1,
      ...encoder.encode("SARI-SARI POS\n"),
      ...encoder.encode(`${type} PRINTER TEST SUCCESS\n`),
      ...encoder.encode("--------------------------------\n"),
      ...encoder.encode("Hardware connection is active.\nReady to print receipts.\n"),
      0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0
    ];
    await this.sendData(new Uint8Array(data));
  }
}
