'use client';
import Image from "next/image";

export default function AuthHeader({ title, subtitle, showLogo = true }) {
  return (
    <>
      {showLogo && (
        <div className="mb-10 lg:mb-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-tr from-cyan-500 to-indigo-500 text-white font-bold">
            HS
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">HomeShareIE</span>
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

