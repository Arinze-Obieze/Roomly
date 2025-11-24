'use client';
import Image from "next/image";

export default function AuthHeader({ title, subtitle, showLogo = true }) {
  return (
    <>
      {showLogo && (
        <div className="mb-10 lg:mb-12 flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Image width={50} height={50} alt="logo" src="/logo.jpg" size={24} />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">Roomly</span>
        </div>
      )} 
      
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-gray-500 text-lg">
          {subtitle}
        </p>
      </div>
    </>
  );
}