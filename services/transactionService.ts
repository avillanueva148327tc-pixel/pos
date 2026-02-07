import { InventoryItem, UtangRecord, UtangItem, Customer, AppSettings } from '../types';

export interface TransactionResult {
  success: boolean;
  updatedInventory: InventoryItem[];
  updatedRecords: UtangRecord[];
  newRecord?: UtangRecord;
  error?: string;
  shouldPrint?: boolean;
}

export const TransactionService = {
  /**
   * "Stored Procedure" for Order Processing
   * Centralizes validation, stock deduction, and ledger updates.
   */
  processTransaction: (
    data: any, 
    inventory: InventoryItem[],
    records: UtangRecord[],
    customers: Customer[],
    settings: AppSettings
  ): TransactionResult => {
    
    // 1. Validation Phase
    const validItems = data.items.every((item: UtangItem) => 
        !item.productId || inventory.some(i => i.id === item.productId)
    );
    
    if (!validItems) {
        return { success: false, updatedInventory: inventory, updatedRecords: records, error: "Invalid product reference detected." };
    }

    const newInventory = [...inventory];
    
    // 2. Execution Phase: Stock Deduction
    data.items.forEach((item: UtangItem) => {
        if (item.productId) {
            const idx = newInventory.findIndex(i => i.id === item.productId);
            if (idx >= 0) {
                newInventory[idx] = {
                    ...newInventory[idx],
                    stock: Math.max(0, newInventory[idx].stock - item.quantity)
                };
            }
        }
    });

    // 3. Execution Phase: Record Management
    if (!data.isPaid && !data.forceNew && data.customerName !== 'Walk-in Customer') {
        const existingRecordIndex = records.findIndex(r => r.customerName === data.customerName && !r.isPaid);
        if (existingRecordIndex >= 0) {
            const existingRecord = records[existingRecordIndex];
            
            const updatedItems = [...existingRecord.items, ...data.items];
            const updatedTotal = existingRecord.totalAmount + data.totalAmount; 
            const updatedQuantity = existingRecord.quantity + data.quantity;
            
            const existingProducts = existingRecord.product.split(', ').filter(Boolean);
            const newProducts = data.product.split(', ').filter(Boolean);
            const mergedProducts = Array.from(new Set([...existingProducts, ...newProducts])).join(', ');

            const mergedRecord = {
                ...existingRecord,
                items: updatedItems,
                totalAmount: updatedTotal,
                quantity: updatedQuantity,
                product: mergedProducts
            };

            const updatedRecords = [...records];
            updatedRecords[existingRecordIndex] = mergedRecord;

            return {
                success: true,
                updatedInventory: newInventory,
                updatedRecords: updatedRecords,
                newRecord: mergedRecord,
                shouldPrint: !!data.shouldPrint
            };
        }
    }

    // Insert New Record
    const newRecord = {
        ...data,
        id: crypto.randomUUID(),
        date: new Date().toLocaleString(),
        branchId: 'default'
    };

    return {
        success: true,
        updatedInventory: newInventory,
        updatedRecords: [newRecord, ...records],
        newRecord: newRecord,
        shouldPrint: !!data.shouldPrint
    };
  },

  deleteTransaction: (
    recordId: string,
    inventory: InventoryItem[],
    records: UtangRecord[]
  ): TransactionResult => {
    const recordToDelete = records.find(r => r.id === recordId);
    if (!recordToDelete) {
        return { success: false, updatedInventory: inventory, updatedRecords: records, error: "Record not found" };
    }

    const newInventory = [...inventory];

    recordToDelete.items.forEach(item => {
        if (item.productId) {
            const idx = newInventory.findIndex(i => i.id === item.productId);
            if (idx >= 0) {
                newInventory[idx] = {
                    ...newInventory[idx],
                    stock: newInventory[idx].stock + item.quantity
                };
            }
        }
    });

    const updatedRecords = records.filter(r => r.id !== recordId);

    return {
        success: true,
        updatedInventory: newInventory,
        updatedRecords: updatedRecords
    };
  }
};