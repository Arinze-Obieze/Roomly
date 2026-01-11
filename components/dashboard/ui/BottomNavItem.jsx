export const BottomNavItem = ({ icon: Icon, label, active, badge, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center p-2 min-w-[60px] ${active ? 'text-cyan-600' : 'text-slate-500'}`}
    >
      <div className="relative">
        <Icon size={22} />
        {badge && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
};