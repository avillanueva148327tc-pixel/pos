
import React, { useState } from 'react';

interface UserGuideModalProps {
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'pos' | 'inventory' | 'customers' | 'insights' | 'advanced'>('basics');

  const tabs = [
    { id: 'basics', label: 'Basics', icon: '🏠' },
    { id: 'pos', label: 'Point of Sale', icon: '💸' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'customers', label: 'Suki Mgmt', icon: '👥' },
    { id: 'insights', label: 'Reports', icon: '📊' },
    { id: 'advanced', label: 'Adv. Tools', icon: '🛠️' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-white/10">
        
        {/* Sidebar / Tabs */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-[#0f172a] p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 flex flex-col">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">User Guide</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">System Manual v3.6</p>
          
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all text-left min-w-[140px] md:min-w-0 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs font-black uppercase tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <button onClick={onClose} className="mt-auto hidden md:block py-4 bg-slate-200 dark:bg-slate-800 rounded-2xl text-slate-500 font-black uppercase text-xs hover:bg-rose-500 hover:text-white transition">
            Close Guide
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white dark:bg-slate-900">
          
          {activeTab === 'basics' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <section>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl mb-4">👋</div>
                <h3 className="text-2xl font-black dark:text-white mb-4">Welcome to Sari-Sari Debt Pro</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                  This system is designed to help you manage your store's inventory, track customer debts (utang), and monitor your daily sales performance. It works offline and saves data securely on this device.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/5">
                  <h4 className="font-black text-sm uppercase dark:text-white mb-2">🔐 Security PINs</h4>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
                    <li><b>Admin (Default: 1234):</b> Full access to settings, editing stock, backups, and deleting records.</li>
                    <li><b>Cashier (Default: 0000):</b> Access to POS and viewing records only.</li>
                  </ul>
                  <p className="text-[10px] mt-3 text-slate-400 italic">You can change these in Advanced Settings.</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/5">
                  <h4 className="font-black text-sm uppercase dark:text-white mb-2">💾 Data Storage</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Data is saved automatically to your browser. 
                    <br/><br/>
                    <b>Important:</b> If you clear your browser history/cache, you might lose data. Use the <b>Backup & Restore</b> feature regularly to save your files safely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pos' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <section>
                <h3 className="text-2xl font-black dark:text-white mb-6">Using the Terminal</h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">1</div>
                    <div>
                      <h4 className="font-bold dark:text-white">Adding Items</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Go to <b>New Transaction</b>.
                      </p>
                      <ul className="list-disc pl-4 text-xs text-slate-500 mt-2 space-y-1">
                        <li><b>Scan / Inventory:</b> Search your registered products or use the Camera Scanner.</li>
                        <li><b>Manual Entry:</b> Switch to this tab to quickly type a name and price for items not in your inventory (e.g., "Ice", "Service Fee").</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">2</div>
                    <div>
                      <h4 className="font-bold dark:text-white">Customer Identification</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Select "Walk-in" for quick sales or "Member" to track debt. You can search Suki by name or scan their <b>Suki ID QR Code</b>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">3</div>
                    <div>
                      <h4 className="font-bold dark:text-white">Checkout Modes</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        <b>Pay Cash:</b> Records a paid sale immediately.<br/>
                        <b>Charge Debt:</b> Adds to the customer's balance. Requires Admin PIN if their Credit Limit is exceeded.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shrink-0">4</div>
                    <div>
                      <h4 className="font-bold dark:text-white">⚡ Rapid "Scan-and-Go" Switching</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        For fast checkouts, if you scan a new member's ID while another member's transaction is active, the system will:
                      </p>
                      <ul className="list-disc pl-4 text-xs text-slate-500 mt-2 space-y-1">
                        <li><b>Automatically complete</b> the current transaction as a cash sale.</li>
                        <li>Instantly <b>start a new transaction</b> for the newly scanned member.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <section>
                <h3 className="text-2xl font-black dark:text-white mb-6">Inventory Management</h3>
                <p className="text-slate-500 text-sm mb-6">Manage stock levels, costs, and product details.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800">
                      <h5 className="font-black text-xs uppercase mb-1 dark:text-white">New Items</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Click "Add Stock". Fill in Name, Price, and Initial Stock. You can select "Pack" units to automatically handle bulk items (e.g., 1 Case = 24 pcs).
                      </p>
                   </div>
                   <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800">
                      <h5 className="font-black text-xs uppercase mb-1 dark:text-white">Restocking (Batch)</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Use "Stock In" to add multiple items at once from a purchase receipt. This tracks your expenses and updates inventory counts in one go.
                      </p>
                   </div>
                   <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800">
                      <h5 className="font-black text-xs uppercase mb-1 dark:text-white">Quick Adjust</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        On the Inventory tab, click "Adjust Stock" on any item to quickly add (+1, +10) or remove stock, or set a specific physical count.
                      </p>
                   </div>
                   <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800">
                      <h5 className="font-black text-xs uppercase mb-1 dark:text-white">Low Stock</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Items below their reorder level appear in the "Low Stock" filter. You can set the reorder level per item.
                      </p>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <section>
                <h3 className="text-2xl font-black dark:text-white mb-6">Suki & Debt Management</h3>
                
                <div className="space-y-4">
                   <div className="flex gap-3 items-start">
                      <span className="text-xl">👥</span>
                      <div>
                        <p className="font-bold text-sm dark:text-white">Registration</p>
                        <p className="text-xs text-slate-500 mt-1">Go to Customers tab &gt; Add Suki. Set a <b>Credit Limit</b> to control max debt.</p>
                      </div>
                   </div>
                   
                   <div className="flex gap-3 items-start">
                      <span className="text-xl">🪪</span>
                      <div>
                        <p className="font-bold text-sm dark:text-white">Digital IDs</p>
                        <p className="text-xs text-slate-500 mt-1">Click the ID icon on a customer card to generate a QR code. Save and send this image to them. They can present it at the terminal for instant checkout.</p>
                      </div>
                   </div>

                   <div className="flex gap-3 items-start">
                      <span className="text-xl">💰</span>
                      <div>
                        <p className="font-bold text-sm dark:text-white">Collecting Payments</p>
                        <p className="text-xs text-slate-500 mt-1">Go to the Debts tab. Click a record. Select "Settle Full Balance" or "Partial Pay" to deduct from their debt. You can also print a Statement of Account.</p>
                      </div>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <section>
                <h3 className="text-2xl font-black dark:text-white mb-6">Reports & Analytics</h3>
                <p className="text-slate-500 text-sm mb-6">Understand your store's performance in the <b>Insights</b> tab.</p>

                <div className="grid grid-cols-1 gap-4">
                   <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-500/20">
                      <h5 className="font-black text-xs uppercase mb-2 dark:text-white">Financial Pulse</h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        The Dashboard and Insights tab show real-time cards for <b>Sales Today</b>, <b>Unpaid Debt</b>, and <b>Inventory Value</b>. Use the "Eye" icon to hide values for privacy.
                      </p>
                   </div>
                   
                   <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <h5 className="font-black text-xs uppercase mb-2 dark:text-white">Charts</h5>
                      <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                         <li><b>Sales vs. Debt Trend:</b> See how much cash you collected vs how much credit you gave over the last 7 days.</li>
                         <li><b>Inventory Distribution:</b> See which categories (e.g., Canned Goods, Snacks) hold the most value in your stock.</li>
                      </ul>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <section>
                <h3 className="text-2xl font-black dark:text-white mb-6">Advanced Tools</h3>
                
                <div className="space-y-6">
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-xl">📂</span>
                         <h4 className="font-bold text-sm dark:text-white">Backup & Restore</h4>
                      </div>
                      <p className="text-xs text-slate-500 ml-8 leading-relaxed">
                         <b>Archive:</b> Download your full data as a JSON file.<br/>
                         <b>Import:</b> Drag and drop your JSON or CSV file to restore. The system now provides a <b>Preview</b> showing new vs updated items before you confirm.
                      </p>
                   </div>

                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-xl">🔄</span>
                         <h4 className="font-bold text-sm dark:text-white">Device Sync</h4>
                      </div>
                      <p className="text-xs text-slate-500 ml-8 leading-relaxed">
                         Transfer all your data to another device (e.g., from Phone to Laptop). 
                         Open "Sync Devices" on both. One sets to "Send" (Host), the other "Receive" (Scan QR). 
                         Requires internet connection.
                      </p>
                   </div>

                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-xl">🖨️</span>
                         <h4 className="font-bold text-sm dark:text-white">Hardware Settings</h4>
                      </div>
                      <p className="text-xs text-slate-500 ml-8 leading-relaxed">
                         Connect a <b>Bluetooth</b> or <b>USB Thermal Printer</b> for physical receipts.
                         Customize the receipt layout in "Settings" &gt; "Receipt Template".
                         <br/><br/>
                         <b>Windows USB Issues?</b> If you see "Driver Conflict", follow the on-screen link to download <b>Zadig</b> and replace the driver with <b>WinUSB</b>.
                      </p>
                   </div>
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Mobile Close Button */}
        <div className="p-4 md:hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-white/5">
           <button onClick={onClose} className="w-full py-4 bg-slate-200 dark:bg-slate-800 rounded-2xl text-slate-500 font-black uppercase text-xs hover:bg-rose-500 hover:text-white transition">Close</button>
        </div>

      </div>
    </div>
  );
};

export default UserGuideModal;
