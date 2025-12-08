'use client';
import { FaCheck } from "react-icons/fa";

export default function InputField({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  focusedField, 
  setFocusedField,
  required = true 
}) {
  const isFocused = focusedField === name;
  const hasValue = value.length > 0;

  return (
    <div className="relative group">
      <label htmlFor={name} className={`field-label ${isFocused ? 'text-emerald-600' : ''}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3.5 rounded-xl border text-gray-900 placeholder-gray-400 bg-gray-50 transition-all duration-200 ease-in-out outline-none ${isFocused ? 'border-emerald-500 bg-white' : 'border-gray-200 hover:border-gray-300 hover:bg-white'}`}
        />
        {/* Success Indicator */}
        {hasValue && !isFocused && type !== "password" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-in fade-in zoom-in">
            <FaCheck size={18} />
          </div>
        )}
      </div>
    </div>
  );
}