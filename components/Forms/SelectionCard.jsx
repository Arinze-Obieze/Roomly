import { MdCheckCircle } from 'react-icons/md';

export default function SelectionCard({ 
  selected, 
  onClick, 
  children,
  className = '' 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden group hover:border-slate-300 ${
        selected
          ? 'border-terracotta-600 bg-terracotta-50/50'
          : 'border-slate-100 bg-white'
      } ${className}`}
    >
      {children}
      
      {selected && (
        <div className="absolute top-2 right-2 text-terracotta-600">
            <MdCheckCircle size={20} />
        </div>
      )}
      
      {/* Decorative gradient for selected state */}
      {selected && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-terracotta-600/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
      )}
    </button>
  );
}
