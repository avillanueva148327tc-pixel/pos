
import { UtangRecord, InventoryItem } from "../types";

// Service disabled by user request.
export async function getStoreReport(records: UtangRecord[], inventory: InventoryItem[]): Promise<any> {
  console.warn("AI Service is disabled.");
  return {
    summary: "AI Service Disabled",
    shoppingList: [],
    profitGrowthTips: [],
    businessHealthScore: 0
  };
}
