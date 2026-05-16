"use client";
import React from "react";
import { useRouter } from "next/navigation";

const Header = ({ title }) => {
  const router = useRouter();

  const navigateToEditProfile = () => {
    router.push("/editInformation");
  };

  return (
    <header className="border-b-2 border-slate-950 bg-white shadow-lg p-6 flex justify-center items-center">
      <div className="text-3xl font-bold text-slate-900">🌤️ {title} 🌤️</div>
    </header>
  );
};

export default Header;
