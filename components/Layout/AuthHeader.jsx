'use client';
import Image from "next/image";

export default function AuthHeader({ title, subtitle, showLogo = true }) {
  return (
    <>
      {showLogo && (
        <div className="mb-10 lg:mb-12 flex items-center gap-3">
          <Image alt="logo" src={'/logo/logo.svg'} width={40} height={40} />
          <span className="text-xl font-bold tracking-tight text-slate-900 pt-2">RoomFind</span>
        </div>
      )} 
      
      <div className="mb-10">
        <h1 className="auth-header-title mb-3">
          {title}
        </h1>
        <p className="auth-header-subtitle text-lg">
          {subtitle}
        </p>
      </div>
    </>
  );
}

