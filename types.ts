
export type UserRole = 'admin' | 'cashier';

export interface User {
  role: UserRole;
  name: string;
}

export interface BranchConfig {
  name: string;
  address: string;
  contact: string;
  logoUrl?: string;
}

export type ReceiptLayout = 'classic' | 'modern' | 'compact';
export type ReceiptFont = 'JetBrains Mono' | 'Inter' | 'Courier New' | 'Roboto' | 'Poppins';

export interface ReceiptTemplate {
  logoUrl?: string;
  headerSubtitle?: string;
  showBranchAddress: boolean;
  showBranchContact: boolean;
  showCustomerId: boolean;
  showItemSize: boolean;
  showDateTime: boolean;
  footerText: string;
  brandingText: string;
  headerAlignment: 'left' | 'center' | 'right';
  paperWidth: '58mm' | '80mm' | 'A4' | 'Letter' | 'A4-6' | 'full';
  fontFamily: ReceiptFont;
  fontSize: number;
  headerFontSize?: number;
  itemFontSize?: number;
  layout: ReceiptLayout;
  accentColor: string;
}

export type AppLanguage = 'en' | 'tl' | 'bis';
export type AppTheme = 'light' | 'dark';

export interface AuthConfig {
  adminPin: string;
  cashierPin: string;
}

export interface AppSettings {
  categories: string[];
  expiryThresholdDays: number;
  lowStockThreshold: number;
  language: AppLanguage;
  theme: AppTheme;
  dailySalesTarget: number;
  autoPrintReceipt: boolean;
  requireAdminApproval: boolean;
  showFinancialPulseOnDashboard: boolean;
  auth: AuthConfig;
  receiptTemplate: ReceiptTemplate;
  uiCustomization: {
    fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Lora' | 'JetBrains Mono';
    fontSize: 'sm' | 'base' | 'lg' | 'xl';
    compactMode: boolean;
    deviceMode: 'mobile' | 'tablet' | 'desktop';
  };
}

export interface Customer {
  id: string;
  name: string;
  nickname?: string;
  department?: string;
  contact?: string;
  address?: string;
  creditLimit?: number;
  createdAt: string;
  barcode?: string;
}

export type MeasurementUnit = 'pc' | 'ml' | 'L' | 'g' | 'kg' | 'pack';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  originalPrice: number;
  reorderLevel: number;
  itemsPerPack?: number;
  expiryDate?: string;
  barcode?: string;
  volume?: string;
  unit: MeasurementUnit;
  measurementValue?: number;
  imageUrl?: string;
}

export interface UtangItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  volume?: string;
  unit?: MeasurementUnit;
  measurementValue?: number;
  date: string;
}

export type ReminderFrequency = 'none' | 'daily' | 'weekly' | 'monthly';

export interface UtangRecord {
  id: string;
  customerName: string;
  product: string;
  items: UtangItem[];
  quantity: number;
  totalAmount: number;
  paidAmount: number;
  date: string;
  isPaid: boolean;
  branchId?: string;
  reminderFrequency?: ReminderFrequency;
  nextReminderDate?: string;
  reminderNote?: string;
}

export interface BatchRecord {
  id: string;
  date: string;
  note: string;
  totalCost: number;
  items: {
    productId?: string;
    name: string;
    quantity: number;
    costPerUnit: number;
  }[];
}

export interface Stats {
  totalCount: number;
  totalAmount: number;
  unpaidTotal: number;
  activeDebtors: number;
  lowStockCount: number;
  totalInventoryValue: number;
  totalInvestmentValue: number;
  potentialProfit: number;
  dailySales: number;
  monthlySales: number;
  monthlyExpenses: number;
  monthlyNetProfit: number;
}

export interface BackupData {
  metadata: {
    version: string;
    date: string;
    type: string;
    encrypted: boolean;
  };
  data: {
    inventory?: InventoryItem[];
    customers?: Customer[];
    records?: UtangRecord[];
    batches?: BatchRecord[];
    settings?: AppSettings;
    branch?: BranchConfig;
  };
}
