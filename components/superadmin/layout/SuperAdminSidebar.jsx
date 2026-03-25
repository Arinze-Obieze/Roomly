"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/core/contexts/AuthContext";
import { 
  MdDashboard, 
  MdPeople, 
  MdHomeWork, 
  MdReportProblem,
  MdReceiptLong,
  MdChatBubbleOutline,
  MdBuild,
  MdClose
} from "react-icons/md";

const NAV_ITEMS = [
  { icon: MdDashboard, label: "Overview", path: "/superadmin" },
  { icon: MdPeople, label: "Users", path: "/superadmin/users" },
  { icon: MdHomeWork, label: "Properties", path: "/superadmin/properties" },
  { icon: MdReportProblem, label: "Reports", path: "/superadmin/reports" },
  { icon: MdChatBubbleOutline, label: "Support", path: "/superadmin/support" },
  { icon: MdBuild, label: "Operations", path: "/superadmin/operations" },
  { icon: MdReceiptLong, label: "System Logs", path: "/superadmin/system-logs" },
];

export default function SuperAdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext();

  const isActive = (path) => {
    if (path === "/superadmin") {
      return pathname === "/superadmin";
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0f172a] text-slate-300 border-r border-[#1e293b] flex flex-col transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:h-[calc(100vh-73px)] lg:sticky lg:top-[73px] lg:z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="py-6 px-6 font-spaceGrotesk text-sm font-bold tracking-wider text-slate-500 uppercase flex items-center justify-between mt-2 lg:mt-0">
          <span>Superadmin</span>
          <button onClick={onClose} className="lg:hidden p-1 -mr-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg">
            <MdClose size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={() => {
                router.push(item.path);
                onClose?.();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left relative group ${
                active 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:bg-[#1e293b] hover:text-white"
              }`}
            >
              <Icon size={22} className={active ? "text-white" : "text-slate-500 group-hover:text-slate-300"} />
              <span className="flex-1 font-sans">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[#1e293b] m-4 rounded-xl bg-[#1e293b]">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-white truncate">{user?.email}</p>
               <p className="text-xs text-slate-400 truncate">Super Admin</p>
            </div>
         </div>
      </div>
    </aside>
    </>
  );
}
