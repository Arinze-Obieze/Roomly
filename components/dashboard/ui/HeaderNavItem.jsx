export const HeaderNavItem = ({ icon: Icon, label, active, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all relative ${
        active 
          ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
          : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
};