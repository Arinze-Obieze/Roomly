'use client';
import { FaCheck, FaExclamationCircle } from "react-icons/fa";

export default function InputField({ 
  label, 
  name, 
  type = "text", 
  placeholder, 
  error,
  register,
  required = true,
  ...props
}) {
  return (
    <div className="form-group mb-1">
      <label 
        htmlFor={name} 
        className={`form-label ${required ? 'form-label-required' : ''} ${error ? 'text-red-600' : ''}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          {...(register ? register(name) : {})}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full px-4 py-3.5 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:ring-2 
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20'
            }`}
          {...props}
        />
        
        {/* Error Icon */}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-in fade-in zoom-in duration-200">
            <FaExclamationCircle size={18} aria-hidden="true" />
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p 
          id={`${name}-error`} 
          role="alert" 
          className="mt-1.5 text-sm text-red-600 font-medium animate-in slide-in-from-top-1 fade-in duration-200"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}