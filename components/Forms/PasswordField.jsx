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
        className={`form-label ${required ? 'form-label-required' : ''} ${isFocused ? 'text-primary' : ''}`}
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
          className="pr-12"
        />
        <button
          type="button"
          onClick={togglePassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${isFocused ? 'text-primary hover:bg-primary-light' : 'text-muted hover:text-primary'}`}
        >
          {showPassword ? <FaEyeSlash size={20} aria-hidden="true" /> : <FaEye size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}