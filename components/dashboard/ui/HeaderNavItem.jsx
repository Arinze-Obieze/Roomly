export const HeaderNavItem = ({ icon: Icon, label, active, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all relative group ${
        active 
          ? 'bg-white text-[#020617] shadow-sm ring-1 ring-[#BCCCDC]' 
          : 'text-[#627D98] hover:bg-white/60 hover:text-[#020617]'
      }`}
    >
      <div className={`transition-colors ${active ? 'text-primary' : 'text-[#627D98] group-hover:text-primary'}`}>
        <Icon size={20} />
      </div>
      <span className={`text-sm font-medium`}>{label}</span>
      {badge && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#4ECDC4] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
};