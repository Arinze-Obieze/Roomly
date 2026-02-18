import { useState, useRef, useEffect } from 'react';
import { MdLocationOn, MdSearch, MdTrain, MdDirectionsBus, MdTranslate } from 'react-icons/md';
import { COUNTIES, CITIES_TOWNS } from '@/data/locations';
import { TRANSPORT_OPTIONS } from '@/data/listingOptions';

export default function LocationForm({ formData, handleChange }) {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityWrapperRef = useRef(null);

  const filteredCities = CITIES_TOWNS.filter(city => 
    city.toLowerCase().includes((citySearch || formData.city || '').toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (cityWrapperRef.current && !cityWrapperRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (city) => {
    handleChange('city', city);
    setCitySearch('');
    setShowCityDropdown(false);
  };

  const toggleTransport = (value) => {
    const current = formData.transport_options || [];
    const updated = current.includes(value) 
      ? current.filter(t => t !== value)
      : [...current, value];
    handleChange('transport_options', updated);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Address Form */}
      <div className="space-y-4">
        {/* County & City Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                 <label className="block text-sm font-heading font-bold text-navy-950 mb-2">County</label>
                 <select
                    value={formData.state || ''}
                    onChange={e => handleChange('state', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-white focus:ring-2 focus:ring-terracotta-500 outline-none font-sans"
                  >
                    <option value="">Select County</option>
                    {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
            </div>
            <div ref={cityWrapperRef} className="relative">
                <label className="block text-sm font-heading font-bold text-navy-950 mb-2">City / Town</label>
                 <div className="relative">
                    <input
                        type="text"
                        placeholder="Search city..."
                        value={showCityDropdown ? citySearch : formData.city}
                        onChange={(e) => {
                          setCitySearch(e.target.value);
                          if (!showCityDropdown) setShowCityDropdown(true);
                        }}
                        onFocus={() => {
                          setCitySearch('');
                          setShowCityDropdown(true);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans placeholder-navy-400"
                    />
                    <MdSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" size={20} />
                </div>
                {showCityDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-navy-200 rounded-xl shadow-xl shadow-navy-950/5 max-h-60 overflow-y-auto">
                        {filteredCities.map(city => (
                            <button
                                key={city}
                                type="button"
                                onClick={() => handleCitySelect(city)}
                                className="w-full text-left px-4 py-2 hover:bg-navy-50 text-sm font-sans text-navy-700"
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div>
            <label className="block text-sm font-heading font-bold text-navy-950 mb-2">Address</label>
            <div className="relative">
                <MdLocationOn className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" size={20} />
                <input 
                    type="text"
                    value={formData.street}
                    onChange={e => handleChange('street', e.target.value)}
                    placeholder="Start typing an address..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-terracotta-500 outline-none font-sans placeholder-navy-400"
                />
            </div>
        </div>
      </div>

      {/* Transport Options */}
      <div>
         <label className="block text-sm font-heading font-bold text-navy-950 mb-3">Nearest Transport</label>
         <div className="flex flex-wrap gap-2">
            {TRANSPORT_OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleTransport(opt.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-sans ${
                         (formData.transport_options || []).includes(opt.value)
                         ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700 font-medium'
                         : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
                    }`}
                >
                    <opt.icon size={16} />
                    {opt.label}
                </button>
            ))}
         </div>
      </div>

       {/* Gaeltacht Toggle */}
       <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-terracotta-100 text-terracotta-700 rounded-lg">
                    <MdTranslate size={20} />
                 </div>
                 <div>
                    <div className="font-heading font-bold text-navy-950">Gaeltacht Area?</div>
                    <div className="text-xs text-navy-500 font-sans">Is this property in an Irish speaking area?</div>
                 </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.is_gaeltacht}
                    onChange={(e) => handleChange('is_gaeltacht', e.target.checked)}
                />
                <div className="w-11 h-6 bg-navy-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terracotta-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta-500"></div>
            </label>
       </div>
       
    </div>
  );
}