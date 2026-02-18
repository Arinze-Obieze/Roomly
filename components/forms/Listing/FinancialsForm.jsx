import { MdEuro, MdAttachMoney, MdCreditCard, MdGroup, MdPaid, MdAccountBalanceWallet, MdAdd, MdDelete } from 'react-icons/md';
import { PAYMENT_METHODS } from '@/data/listingOptions';

export default function FinancialsForm({ formData, handleChange }) {
  
  const togglePaymentMethod = (method) => {
    const current = formData.payment_methods || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    handleChange('payment_methods', updated);
  };

  const addBill = () => {
    const current = formData.custom_bills || [];
    handleChange('custom_bills', [...current, { name: '', amount: '' }]);
  };

  const removeBill = (index) => {
    const current = formData.custom_bills || [];
    const updated = current.filter((_, i) => i !== index);
    handleChange('custom_bills', updated);
  };

  const updateBill = (index, field, value) => {
    const current = [...(formData.custom_bills || [])];
    current[index] = { ...current[index], [field]: value };
    handleChange('custom_bills', current);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Rent & Deposit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Monthly Rent</label>
          <div className="relative">
            <MdEuro className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
            <input
              type="number"
              value={formData.price_per_month}
              onChange={(e) => handleChange('price_per_month', e.target.value)}
              placeholder="1000"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans placeholder-navy-400"
            />
          </div>
          <input
            type="range"
            min="100"
            max="5000"
            step="50"
            value={formData.price_per_month || 1000}
            onChange={(e) => handleChange('price_per_month', e.target.value)}
            className="w-full mt-3 accent-terracotta-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Security Deposit</label>
          <div className="relative">
            <MdEuro className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
            <input
              type="number"
              value={formData.deposit}
              onChange={(e) => handleChange('deposit', e.target.value)}
              placeholder="1000"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans placeholder-navy-400"
            />
          </div>
        </div>
      </div>

      {/* Bills Section */}
      <div className="space-y-4">
        <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-3">Are bills included?</label>
            <div className="grid grid-cols-3 gap-3">
            {['box', 'some', 'none'].map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange('bills_option', opt)}
                    className={`p-3 rounded-xl border-2 transition-all capitalize font-sans ${
                    formData.bills_option === opt
                        ? 'border-terracotta-500 bg-terracotta-50 font-bold text-terracotta-700'
                        : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
                    }`}
                >
                    {opt === 'box' ? 'Yes, All' : opt === 'some' ? 'Partially' : 'No'}
                </button>
            ))}
            </div>
        </div>

        {/* Dynamic Bill List */}
        {formData.bills_option !== 'box' && (
            <div className="bg-navy-50 rounded-xl p-4 border border-navy-200 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-heading font-bold text-navy-950">Estimated Bill Costs</label>
                    <button 
                        type="button" 
                        onClick={addBill}
                        className="text-xs font-heading font-bold text-terracotta-600 flex items-center gap-1 hover:text-terracotta-700"
                    >
                        <MdAdd size={16} />
                        Add Bill
                    </button>
                </div>
                
                {(formData.custom_bills || []).length === 0 && (
                    <p className="text-sm text-navy-500 italic font-sans">No estimated bills added.</p>
                )}

                {(formData.custom_bills || []).map((bill, index) => (
                    <div key={index} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. Electricity"
                            value={bill.name}
                            onChange={(e) => updateBill(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border border-navy-200 text-sm focus:ring-2 focus:ring-terracotta-500 outline-none font-sans placeholder-navy-400"
                        />
                        <div className="relative w-28">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-navy-400 text-xs">€</span>
                             <input
                                type="number"
                                placeholder="0.00"
                                value={bill.amount}
                                onChange={(e) => updateBill(index, 'amount', e.target.value)}
                                className="w-full pl-6 pr-3 py-2 rounded-lg border border-navy-200 text-sm focus:ring-2 focus:ring-terracotta-500 outline-none font-sans placeholder-navy-400"
                            />
                        </div>
                        <button 
                            type="button"
                            onClick={() => removeBill(index)}
                            className="p-2 text-navy-400 hover:text-terracotta-500 transition-colors"
                        >
                            <MdDelete size={18} />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>


       {/* Couples Allowed Toggle */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                    <MdGroup size={20} />
                 </div>
                 <div>
                    <div className="font-heading font-bold text-navy-950">Couples Allowed?</div>
                    <div className="text-xs text-navy-500 font-sans">Is the room suitable for two people?</div>
                 </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.couples_allowed}
                    onChange={(e) => handleChange('couples_allowed', e.target.checked)}
                />
                <div className="w-11 h-6 bg-navy-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
       </div>

      {/* Payment Methods */}
      <div>
        <label className="block text-sm font-heading font-bold text-navy-950 mb-3">Preferred Payment Methods</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PAYMENT_METHODS.map(method => (
                <button
                    key={method.value}
                    type="button"
                    onClick={() => togglePaymentMethod(method.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${
                        (formData.payment_methods || []).includes(method.value)
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-navy-200 bg-white hover:border-navy-300'
                    }`}
                >
                    <div className={`p-1.5 rounded-full ${
                         (formData.payment_methods || []).includes(method.value) ? 'bg-teal-100 text-teal-700' : 'bg-navy-100 text-navy-500'
                    }`}>
                        {method.value === 'cash' ? <MdPaid size={16} /> : <MdAccountBalanceWallet size={16} />}
                    </div>
                    <span className={`text-xs font-heading font-medium ${
                      (formData.payment_methods || []).includes(method.value) ? 'text-teal-900' : 'text-navy-600'
                    }`}>
                        {method.label}
                    </span>
                </button>
            ))}
        </div>
      </div>
      
    </div>
  );
}