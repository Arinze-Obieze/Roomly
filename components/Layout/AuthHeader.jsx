'use client';
import Image from "next/image";

export default function AuthHeader({ title, subtitle, showLogo = true }) {
  return (
    <>
      {showLogo && (
        <div className="mb-10 lg:mb-12 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
            <Image width={50} height={50} alt="logo" src="/logo.jpg" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Roomly</span>
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

