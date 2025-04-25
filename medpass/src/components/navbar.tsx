'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {  
  Home,
  LineChart,
  User,
  Calendar, 
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

const NavItem = ({ icon, label, href, onClick }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = href ? pathname === href : false;

  return (
    href ? (
      <Link
        href={href}
        className={`w-full h-12 flex items-center justify-center 
          hover:bg-gray-800/40 rounded-lg transition-colors duration-200`}
        title={label}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: `w-5 h-5 text-gray-400 hover:text-white`
        })}
      </Link>
    ) : (
      <button
        onClick={onClick}
        className="w-full h-12 flex items-center justify-center 
          hover:bg-gray-800/40 rounded-lg transition-colors duration-200"
        title={label}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: `w-5 h-5 text-gray-400 hover:text-white`
        })}
      </button>
    )
  );
};

const Sidebar = () => (
  <div className="fixed inset-y-0 left-0 w-[72px] bg-gray-900 border-r border-gray-800 flex flex-col">
    {/* Logo */}
    <div className="h-[72px] flex items-center justify-center border-b border-gray-800">
      <img src="/medpass_white.png" alt="Logo" className="w-12 h-12" />
    </div>

    {/* Main Navigation */}
    <div className="flex-1 flex flex-col items-center gap-2 px-3 py-3">
      <NavItem icon={<Home />}    label="Dashboard" href="/dashboard" />
      <NavItem icon={<LineChart />} label="Analytics" href="/dashboard/analytics" />
      <NavItem icon={<User />}    label="Student"   href="/dashboard/block" />
      <NavItem icon={<Calendar />} label="Calendar"  href="/dashboard/calendar" />
      <NavItem icon={<Settings />} label="Settings"  href="/dashboard/settings" />
    </div>

    {/* Logout */}
    <div className="px-3 py-4">
      <NavItem
        icon={<LogOut />}
        label="Logout"
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
      />
    </div>
  </div>
);

export default Sidebar;
