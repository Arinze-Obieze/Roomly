import InputField from './InputField';
import { MdLocationOn } from 'react-icons/md';

export default function LocationForm({ formData, focusedField, setFocusedField, handleChange }) {
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <InputField
            label="State"
            name="state"
            type="text"
            value={formData.state}
            onChange={e => handleChange('state', e.target.value)}
            placeholder="e.g., Lagos"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
          />
          <InputField
            label="City"
            name="city"
            type="text"
            value={formData.city}
            onChange={e => handleChange('city', e.target.value)}
            placeholder="e.g., Ikeja"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
          />
          <InputField
            label="Street"
            name="street"
            type="text"
            value={formData.street}
            onChange={e => handleChange('street', e.target.value)}
            placeholder="e.g., Allen Avenue"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
          />
        </div>
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
