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
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const NavItem = ({ icon, label, href }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`w-full h-12 flex items-center justify-center
        ${isActive ? 'hover:bg-gray-800/40' : 'hover:bg-gray-800/40'} 
        rounded-lg transition-colors duration-200`}
      title={label}
    >
      {React.cloneElement(icon as React.ReactElement<any>, {
        className: `w-5 h-5 ${isActive ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-white'}`
      })}
    </Link>
  );
};

const Sidebar = () => {
  return (
    <div className="fixed inset-y-0 left-0 w-[72px] bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="h-[72px] flex items-center justify-center border-b border-gray-800">
        <img src="/medpass_white.png" alt="Logo" className="w-12 h-12" />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col items-center gap-2 px-3 py-3">
        <NavItem 
          icon={<Home />} 
          label="Dashboard" 
          href="/dashboard" 
        />
        <NavItem 
          icon={<LineChart />} 
          label="Analytics" 
          href="/dashboard/analytics" 
        />
        <NavItem 
          icon={<User />} 
          label="Student" 
          href="/dashboard/block" 
        />
        <NavItem 
          icon={<Calendar />} 
          label="Calendar" 
          href="/dev" 
        />
        <NavItem 
          icon={<Settings />} 
          label="Settings" 
          href="/dashboard/settings" 
        />
      </div>
    </div>
  );
};

export default Sidebar;