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
    <div className="form-group">
      <label 
        htmlFor={name} 
        className={`form-label ${required ? 'form-label-required' : ''}`}
      >
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
          aria-required={required}
          aria-invalid={false}
          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
        />
        {/* Success Indicator */}
        {hasValue && !isFocused && type !== "password" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-600 animate-in fade-in zoom-in duration-200">
            <FaCheck size={18} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}