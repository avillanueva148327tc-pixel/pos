
import { UtangRecord, InventoryItem } from '../types';

export const AnalyticsService = {
  /**
   * "Stored Procedure" for Sales Analytics
   * Calculates daily sales and debt for the last 7 days.
   */
  getSalesVsDebtStats: (records: UtangRecord[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    return last7Days.map(date => {
        // Robust Date Matching (Handles various locale formats by comparing day/month/year)
        const dayRecords = records.filter(r => {
            const rDate = new Date(r.date);
            return rDate.getDate() === date.getDate() &&
                   rDate.getMonth() === date.getMonth() &&
                   rDate.getFullYear() === date.getFullYear();
        });

        const daySales = dayRecords.filter(r => r.isPaid).reduce((s, r) => s + r.totalAmount, 0);
        const dayDebt = dayRecords.filter(r => !r.isPaid).reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);
        
        // Return formatted date (e.g., "Oct 25")
        const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        return { date: dateLabel, sales: daySales, debt: dayDebt };
    });
  },

  /**
   * "Stored Procedure" for Inventory Value Analysis
   */
  getCategoryPerformance: (inventory: InventoryItem[]) => {
    const cats: Record<string, number> = {};
    inventory.forEach(item => {
      cats[item.category] = (cats[item.category] || 0) + (item.stock * item.price);
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Order by highest value
  }
};
