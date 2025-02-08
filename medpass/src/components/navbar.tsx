import React from 'react';
import { 
  Microscope, 
  Home,
  LineChart,
  User,
  Calendar, 
  Clock, 
  Settings,
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button
    className={`w-full h-12 flex items-center justify-center
      ${active ? 'hover:bg-gray-800/40' : 'hover:bg-gray-800/40'} 
      rounded-lg transition-colors duration-200`}
    onClick={onClick}
    title={label}
  >
    {React.cloneElement(icon as React.ReactElement<any>, {
      className: `w-5 h-5 ${active ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-white'}`
    })}
  </button>
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
      <div className="flex-1 flex flex-col items-center gap-2 px-3 py-3">
        <NavItem icon={<Home />} label="Dashboard" active />
        <NavItem icon={<LineChart />} label="Analytics" />
        <NavItem icon={<User />} label="Student" />
        <NavItem icon={<Calendar />} label="Calendar" />
        <NavItem icon={<Settings />} label="Settings" />
      </div>
    </div>
  );
};

export default Sidebar;