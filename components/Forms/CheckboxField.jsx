'use client';

export default function CheckboxField({ 
  id, 
  name, 
  checked, 
  onChange, 
  label, 
  links = [] 
}) {
  return (
    <div className="flex items-start pt-2">
      <div className="flex items-center h-6">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500 focus:ring-2 cursor-pointer"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-secondary cursor-pointer">
          {label}
          {links.map((link, index) => (
            <span key={index}>
              {' '}
              <a href={link.href} className="text-cyan-600 hover:text-cyan-700 font-semibold hover:underline">
                {link.text}
              </a>
              {index < links.length - 1 ? ' and ' : ''}
            </span>
          ))}
        </label>
      </div>
    </div>
  );
}