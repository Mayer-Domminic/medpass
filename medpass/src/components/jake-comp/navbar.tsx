import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Microscope, 
  LayoutGrid, 
  Calendar, 
  Clock, 
  Settings,
} from "lucide-react";
import LogoutButton from "@/components/auth/Logout";
import Profile from "@/components/auth/Profile";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <Button
    variant="ghost"
    className={`w-full h-12 p-0 ${active ? 'bg-gray-800/50' : 'hover:bg-gray-800/40'} rounded-lg`}
    onClick={onClick}
    title={label}
  >
    {React.cloneElement(icon as React.ReactElement<any>, {
      className: `w-5 h-5 ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`
    })}
  </Button>
);

const Sidebar = () => {
  return (
    <div className="fixed inset-y-0 left-0 w-[72px] bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="h-[72px] flex items-center justify-center border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Microscope className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-2 p-3">
        <NavItem icon={<LayoutGrid />} label="Dashboard" active />
        <NavItem icon={<Calendar />} label="Calendar" />
        <NavItem icon={<Clock />} label="History" />
        <NavItem icon={<Settings />} label="Settings" />
      </div>

      {/* Profile and Logout */}
      <div className="p-3 mt-auto border-t border-gray-800 space-y-2">
        <Profile />
        <LogoutButton />
      </div>
    </div>
  );
};

export default Sidebar;