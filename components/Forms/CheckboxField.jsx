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
          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-gray-700">
          {label}
          {links.map((link, index) => (
            <span key={index}>
              {' '}
              <a href={link.href} className="text-emerald-600 hover:text-emerald-500 hover:underline">
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