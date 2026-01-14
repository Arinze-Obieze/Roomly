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
    <div className="form-group">
      <label 
        htmlFor={name} 
        className={`form-label ${required ? 'form-label-required' : ''} ${isFocused ? 'text-cyan-600' : ''}`}
      >
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
          aria-required={required}
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 pr-12"
        />
        <button
          type="button"
          onClick={togglePassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${isFocused ? 'text-cyan-600 bg-cyan-50' : 'text-slate-400 hover:text-cyan-600'}`}
        >
          {showPassword ? <FaEyeSlash size={18} aria-hidden="true" /> : <FaEye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}