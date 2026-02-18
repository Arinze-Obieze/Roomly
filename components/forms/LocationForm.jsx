import { useState, useRef, useEffect } from 'react';
import InputField from './InputField';
import { MdLocationOn, MdKeyboardArrowDown, MdSearch } from 'react-icons/md';
import { COUNTIES, CITIES_TOWNS } from '@/data/locations';

export default function LocationForm({ formData, focusedField, setFocusedField, handleChange }) {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityWrapperRef = useRef(null);

  // Filter cities based on search
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Where is your property located?
        </h2>
        <p className="text-slate-600">
          Help renters find your place easily
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* County Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">County</label>
            <div className="relative">
              <select
                name="state"
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none appearance-none cursor-pointer"
                required
              >
                <option value="">Select County</option>
                {COUNTIES.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              <MdKeyboardArrowDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
          </div>

          {/* Searchable City Dropdown */}
          <div className="space-y-2 relative" ref={cityWrapperRef}>
            <label className="text-sm font-medium text-slate-700">City / Town</label>
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
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
              />
              <MdSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
            
            {showCityDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleCitySelect(city)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-sm transition-colors border-b border-slate-50 last:border-none"
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    No cities found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <InputField
          label="Street Address"
          name="street"
          type="text"
          value={formData.street}
          onChange={e => handleChange('street', e.target.value)}
          placeholder="e.g., 123 Main Street"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        {/* Map placeholder */}
        <div className="bg-slate-100 rounded-xl h-64 flex items-center justify-center border border-slate-200">
          <div className="text-center">
            <MdLocationOn size={48} className="text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500">Map integration coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
