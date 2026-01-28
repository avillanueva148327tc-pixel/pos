
import React, { useState } from 'react';

interface UserGuideModalProps {
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'pos' | 'inventory' | 'customers'>('basics');

  const tabs = [
    { id: 'basics', label: 'Basics', icon: '🏠' },
    { id: 'pos', label: 'Point of Sale', icon: '💸' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'customers', label: 'Suki Mgmt', icon: '👥' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-white/10">
        
        {/* Sidebar / Tabs */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-[#0f172a] p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 flex flex-col">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">User Guide</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">System Manual v3.0</p>
          
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
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
                    <li><b>Admin (Default: 1234):</b> Full access to settings, editing stock, and deleting records.</li>
                    <li><b>Cashier (Default: 0000):</b> Access to POS and viewing records only.</li>
                  </ul>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/5">
                  <h4 className="font-black text-sm uppercase dark:text-white mb-2">💾 Auto-Save</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Data is saved automatically to your device's browser storage every time you make a change. Always ensure you see the "Saved" indicator before closing.
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
                        Go to the <b>Terminal</b> tab. Click products from the catalog or use the Camera/Barcode Scanner button to add items to the basket.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">2</div>
                    <div>
                      <h4 className="font-bold dark:text-white">Selecting a Customer</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        By default, transactions are for "Walk-in". Click "Member" to search for a registered Suki. You can check their current credit limit here.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black shrink-0">3</div>
                    <div>
                      <h4 className="font-bold dark:text-white">Checkout</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        <b>Pay Cash:</b> Completes the sale immediately.<br/>
                        <b>Charge to Debt:</b> Adds the total to the customer's ledger. Requires Admin PIN if credit limit is exceeded.
                      </p>
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
                <p className="text-slate-500 text-sm mb-6">Navigate to the <b>Inventory</b> tab to manage stock.</p>

                <div className="grid grid-cols-1 gap-4">
                   <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <h5 className="font-black text-xs uppercase mb-1 dark:text-white">Adding Stock</h5>
                      <p className="text-xs text-slate-500">Click "Add Item". You can scan a barcode to auto-fill the code field. Supports Units (pc, kg, L) and Packs.</p>
                   </div>
                   <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <h5 className="font-black text-xs uppercase mb-1 dark:text-white">Pack/Bulk Units</h5>
                      <p className="text-xs text-slate-500">When adding an item, select "Pack" as unit. Define "Items per Pack". The system automatically calculates total pieces for you.</p>
                   </div>
                   <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <h5 className="font-black text-xs uppercase mb-1 dark:text-white">Restocking</h5>
                      <p className="text-xs text-slate-500">Click the "Stock" button on any item card to perform a quick incremental add (+12, +24) or a full manual override.</p>
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
                   <p className="text-sm text-slate-500">
                     <b>Registering:</b> Go to Customers tab > New Suki. Set a credit limit to control how much they can owe.
                   </p>
                   <p className="text-sm text-slate-500">
                     <b>QR IDs:</b> Click the <span className="inline-block px-1 bg-slate-200 rounded text-[10px]">🪪</span> icon on a customer card to generate a unique QR/Barcode ID. Save this image and send it to them. They can show this image to the camera scanner at checkout for instant identification.
                   </p>
                   <p className="text-sm text-slate-500">
                     <b>Payments:</b> Go to the Debt (Terminal) tab. Click an active debt record. Click "Partial Pay" or "Settle Full Balance" to record a payment.
                   </p>
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
