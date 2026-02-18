import { motion } from 'framer-motion';

export const BottomNavItem = ({ icon: Icon, label, active, badge, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative flex-1 flex flex-col items-center justify-center py-2 group"
    >
      {/* Brand dot – appears only when active */}
      {active && (
        <motion.div
          layoutId="activeDot"
          className="absolute -top-1 w-1.5 h-1.5 bg-[#FF6B6B] rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      <div className="relative">
        <Icon
          size={24}
          className={`transition-colors duration-200 ${
            active ? 'text-[#FF6B6B]' : 'text-[#627D98] group-hover:text-[#020617]'
          }`}
        />

        {/* Badge – uses brand teal for success/messages */}
        {badge && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-[#4ECDC4] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm px-1"
          >
            {badge > 9 ? '9+' : badge}
          </motion.span>
        )}
      </div>

      <span
        className={`text-[11px] mt-1 font-medium transition-colors duration-200 ${
          active ? 'text-[#FF6B6B] font-bold' : 'text-[#627D98] group-hover:text-[#020617]'
        }`}
      >
        {label}
      </span>
    </button>
  );
};