import { InventoryItem, UtangRecord, UtangItem, Customer, AppSettings } from '../types';

export interface TransactionResult {
  success: boolean;
  updatedInventory: InventoryItem[];
  updatedRecords: UtangRecord[];
  newRecord?: UtangRecord;
  error?: string;
}

/**
 * Precision Financial Engine
 * Uses Number.EPSILON to prevent common floating point errors in JavaScript (e.g., 0.1 + 0.2)
 */
export const currency = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

const generateRefId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; 
  const letters = Array.from({length: 3}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const numbers = Math.floor(100 + Math.random() * 900);
  return `${letters}-${numbers}`;
};

export const TransactionService = {
  /**
   * Processes a POS transaction with atomic inventory deduction
   */
  processTransaction: (
    data: any, 
    inventory: InventoryItem[],
    records: UtangRecord[],
    customers: Customer[],
    settings: AppSettings
  ): TransactionResult => {
    
    const newInventory = [...inventory];
    
    // 1. Inventory Integrity Check & Deduction
    for (const item of data.items) {
        if (item.productId) {
            const idx = newInventory.findIndex(i => i.id === item.productId);
            if (idx >= 0) {
                const currentItem = newInventory[idx];
                const updatedStock = currency(currentItem.stock - item.quantity);
                
                // Track cost at time of sale for accurate profit analytics
                item.cost = currentItem.originalPrice || 0;
                
                newInventory[idx] = { ...currentItem, stock: Math.max(0, updatedStock) };
            }
        }
    }

    // 2. Debt Merge Strategy (Optimization for level-1 accounts)
    if (!data.isPaid && !data.forceNew && data.customerName !== 'Walk-in Customer') {
        const existingRecordIndex = records.findIndex(r => r.customerName === data.customerName && !r.isPaid);
        if (existingRecordIndex >= 0) {
            const existingRecord = records[existingRecordIndex];
            const updatedItems = [...existingRecord.items, ...data.items];
            
            // Rebuild the product string summary
            const mergedProducts = Array.from(new Set(updatedItems.map(i => i.name))).join(', ');

            const mergedRecord: UtangRecord = {
                ...existingRecord,
                items: updatedItems,
                totalAmount: currency(existingRecord.totalAmount + data.totalAmount),
                paidAmount: currency(existingRecord.paidAmount + (data.paidAmount || 0)),
                quantity: existingRecord.quantity + data.quantity,
                product: mergedProducts,
                date: new Date().toISOString() // Update timestamp to latest activity
            };

            const updatedRecords = [...records];
            updatedRecords[existingRecordIndex] = mergedRecord;

            return { success: true, updatedInventory: newInventory, updatedRecords: updatedRecords, newRecord: mergedRecord };
        }
    }

    // 3. New Transaction Creation
    const newRecord: UtangRecord = {
        id: crypto.randomUUID(),
        refId: generateRefId(),
        customerName: data.customerName,
        product: data.items.map((i: any) => i.name).join(', '),
        items: data.items,
        quantity: data.items.reduce((s: number, i: any) => s + i.quantity, 0),
        totalAmount: currency(data.totalAmount),
        paidAmount: currency(data.paidAmount || 0),
        date: new Date().toISOString(),
        isPaid: data.isPaid
    };

    return { 
        success: true, 
        updatedInventory: newInventory, 
        updatedRecords: [newRecord, ...records], 
        newRecord 
    };
  },

  /**
   * Calculates actual cash profit vs potential
   */
  calculateMargin: (item: UtangItem) => {
    if (!item.cost) return 0;
    const profit = item.price - item.cost;
    return currency((profit / item.price) * 100);
  },

  /**
   * Handles payment towards a debt record
   */
  settleDebt: (record: UtangRecord, amount: number, records: UtangRecord[]): UtangRecord[] => {
    return records.map(r => {
      if (r.id === record.id) {
        const newPaidAmount = currency(r.paidAmount + amount);
        const isFullyPaid = newPaidAmount >= currency(r.totalAmount);
        return {
          ...r,
          paidAmount: Math.min(newPaidAmount, r.totalAmount),
          isPaid: isFullyPaid
        };
      }
      return r;
    });
  }
};
