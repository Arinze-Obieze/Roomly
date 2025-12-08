'use client';
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function PasswordField({ 
  label, 
  name, 
  value, 
  onChange, 
  showPassword, 
  togglePassword, 
  placeholder, 
  focusedField, 
  setFocusedField,
  required = true 
}) {
  const isFocused = focusedField === name;

  return (
    <div className="relative group">
      <label htmlFor={name} className={`field-label ${isFocused ? 'text-emerald-600' : ''}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocusedField(name)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3.5 rounded-xl border text-gray-900 placeholder-gray-400 bg-gray-50 transition-all duration-200 ease-in-out pr-12 ${isFocused ? 'border-emerald-500 bg-white' : 'border-gray-200 hover:border-gray-300 hover:bg-white'}`}
        />
        <button
          type="button"
          onClick={togglePassword}
          className={`
            absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors duration-200 ${isFocused ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
        </button>
      </div>
    </div>
  );
}