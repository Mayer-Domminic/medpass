import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Microscope, 
  Calendar, 
  Clock, 
  Settings,
  LayoutGrid,
  LogOut
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <div className={`w-full rounded-lg bg-gray-800/20 ${active ? 'bg-gray-800/50' : 'hover:bg-gray-800/40'}`}>
    <Button
      variant="ghost"
      className="w-full h-10 p-0 hover:bg-transparent"
      onClick={onClick}
    >
      <div className="flex items-center justify-center w-full">
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: `w-5 h-5 stroke-[1.5] 
            ${active ? 'stroke-white' : 'stroke-white group-hover:stroke-gray-900'}`
        })}
      </div>
    </Button>
  </div>
);

const Sidebar = () => {
  return (
    <div className="fixed top-0 left-0 h-screen w-[72px] bg-gray-900/95 border-r border-gray-800 flex flex-col z-50">
      <div className="p-4 border-b border-gray-800">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Microscope className="w-6 h-6 text-blue-500" />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-3">
        <NavItem icon={<LayoutGrid />} label="Dashboard" active />
        <NavItem icon={<Calendar />} label="Calendar" />
        <NavItem icon={<Clock />} label="History" />
        <NavItem icon={<Settings />} label="Settings" />
      </div>

      <div className="p-3 border-t border-gray-800">
        <NavItem icon={<LogOut />} label="Logout" />
      </div>
    </div>
  );
};

export default Sidebar;