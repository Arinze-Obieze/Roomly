import InputField from './InputField';
import { MdEuro, MdCalendarToday, MdOutlineBed, MdBathtub, MdSquareFoot, MdCheckCircle } from 'react-icons/md';
import { AMENITIES } from '@/data/amenities';

export default function DetailsForm({ formData, focusedField, setFocusedField, handleChange, toggleAmenity }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Tell us about your property
        </h2>
        <p className="text-slate-600">
          Provide key details that renters want to know
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <InputField
          label="Listing Title"
          name="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Cozy room in Dublin city center"
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <div>
          <label className="field-label mb-3">Listing Privacy</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <button
                  type="button"
                  onClick={() => handleChange('privacy_setting', 'public')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.privacy_setting === 'public' 
                      ? 'border-cyan-600 bg-cyan-50/50' 
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
              >
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.privacy_setting === 'public' ? 'bg-cyan-600' : 'bg-slate-300'}`} />
                      Public Listing
                  </div>
                  <p className="text-xs text-slate-500">Visible to everyone. Best for maximum exposure.</p>
              </button>
              <button
                  type="button"
                  onClick={() => handleChange('privacy_setting', 'private')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.privacy_setting === 'private' 
                      ? 'border-cyan-600 bg-cyan-50/50' 
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
              >
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.privacy_setting === 'private' ? 'bg-cyan-600' : 'bg-slate-300'}`} />
                      Private Listing
                  </div>
                  <p className="text-xs text-slate-500">Hide exact address. Seekers must show interest first.</p>
              </button>
          </div>
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onFocus={() => setFocusedField('description')}
            onBlur={() => setFocusedField(null)}
            placeholder="Describe your property, neighborhood, and what makes it special..."
            rows={4}
            className={`w-full px-4 py-3.5 rounded-xl border text-gray-900 placeholder-gray-400 bg-white transition-all duration-200 ease-in-out outline-none resize-none ${
              focusedField === 'description'
                ? 'border-emerald-500 bg-white'
                : 'border-gray-200 hover:border-gray-300 hover:bg-white'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="field-label flex items-center gap-2">
              <MdEuro className="text-emerald-600" />
              Monthly Rent
            </label>
            <input
              type="number"
              value={formData.price_per_month}
              onChange={(e) => handleChange('price_per_month', e.target.value)}
              onFocus={() => setFocusedField('price')}
              onBlur={() => setFocusedField(null)}
              placeholder="1200"
              required
              className={`w-full px-4 py-3.5 rounded-xl border text-gray-900 placeholder-gray-400 bg-white transition-all duration-200 ease-in-out outline-none ${
                focusedField === 'price'
                  ? 'border-emerald-500 bg-white'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            />
          </div>

          <div>
            <label className="field-label flex items-center gap-2">
              <MdCalendarToday className="text-emerald-600" />
              Available From
            </label>
            <input
              type="date"
              value={formData.available_from}
              onChange={(e) => handleChange('available_from', e.target.value)}
              onFocus={() => setFocusedField('date')}
              onBlur={() => setFocusedField(null)}
              required
              className={`w-full px-4 py-3.5 rounded-xl border text-gray-900 bg-white transition-all duration-200 ease-in-out outline-none ${
                focusedField === 'date'
                  ? 'border-emerald-500 bg-white'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-white'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="field-label flex items-center gap-2">
              <MdOutlineBed className="text-emerald-600" />
              Bedrooms
            </label>
            <input
              type="number"
              min="0"
              value={formData.bedrooms}
              onChange={(e) => handleChange('bedrooms', parseInt(e.target.value))}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-white text-gray-900 transition-all duration-200 outline-none"
            />
          </div>

          <div>
            <label className="field-label flex items-center gap-2">
              <MdBathtub className="text-emerald-600" />
              Bathrooms
            </label>
            <input
              type="number"
              min="1"
              step="0.5"
              value={formData.bathrooms}
              onChange={(e) => handleChange('bathrooms', parseFloat(e.target.value))}
              required
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-white text-gray-900 transition-all duration-200 outline-none"
            />
          </div>

          <div>
            <label className="field-label flex items-center gap-2">
              <MdSquareFoot className="text-emerald-600" />
              Sqm <span className="text-slate-400 text-sm font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              value={formData.square_meters}
              onChange={(e) => handleChange('square_meters', e.target.value)}
              placeholder="50"
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-white text-gray-900 transition-all duration-200 outline-none"
            />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="field-label mb-4">Amenities</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity.value}
                type="button"
                onClick={() => toggleAmenity(amenity.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                  formData.amenities.includes(amenity.value)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <amenity.icon
                  className={
                    formData.amenities.includes(amenity.value)
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }
                  size={18}
                />
                <span className="text-sm font-medium text-slate-900">
                  {amenity.label}
                </span>
                {formData.amenities.includes(amenity.value) && (
                  <MdCheckCircle className="ml-auto text-emerald-600" size={18} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
