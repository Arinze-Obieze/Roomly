"use client";

import { useRouter } from "next/navigation";
import { useAuthContext } from "@/core/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { MdLogout, MdArrowBack, MdMenu } from "react-icons/md";

const Logo = () => (
  <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
    <Image width={40} height={40} alt="RoomFind" src="/logo/logo.svg" />
    <span className="font-bold text-xl text-white font-spaceGrotesk hidden sm:block">RoomFind Admin</span>
  </Link>
);

export default function SuperAdminHeader({ onMenuClick }) {
  const router = useRouter();
  const { signOut } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a] border-b border-[#1e293b]">
      <div className="flex items-center justify-between px-4 lg:px-8 h-[73px] max-w-[1920px] mx-auto">
        <div className="flex items-center gap-4 lg:gap-6">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <MdMenu size={24} />
          </button>
          <Logo />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#1e293b] rounded-lg transition-colors"
          >
            <MdArrowBack size={18} />
            <span className="hidden sm:inline">Back to App</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <MdLogout size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
