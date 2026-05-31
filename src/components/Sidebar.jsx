import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  Calendar,
  Wrench,
  MapPin,
  Receipt,
  Bell,
  LifeBuoy,
  Star,
  HelpCircle,
} from 'lucide-react';

const Sidebar = ({ onTabChange, activeTab }) => {

  const menuItems = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard size={18} />,
      label: 'DASHBOARD'
    },
    {
      id: 'properties',
      icon: <Building2 size={18} />,
      label: 'PROPERTIES'
    },
    {
      id: 'maintenance',
      icon: <Wrench size={18} />,
      label: 'MAINTENANCE'
    },
    {
      id: 'visits',
      icon: <Calendar size={18} />,
      label: 'VISITS'
    },
    {
      id: 'agents',
      icon: <Users size={18} />,
      label: 'AGENTS'
    },
    {
      id: 'users',
      icon: <UserCog size={18} />,
      label: 'USERS'
    },
    {
      id: 'neighborhoods',
      icon: <MapPin size={18} />,
      label: 'NEIGHBOURHOODS'
    },
    {
      id: 'expenses',
      icon: <Receipt size={18} />,
      label: 'EXPENSES'
    },
    {
      id: 'notifications',
      icon: <Bell size={18} />,
      label: 'NOTIFICATIONS'
    },
    {
      id: 'support',
      icon: <LifeBuoy size={18} />,
      label: 'SUPPORT'
    },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-[#050505] border-r border-white/5 shadow-2xl">

      <div className="p-8">
        <h1 className="text-white font-black text-xl tracking-tighter flex items-center gap-2">
          FIND HOME
          <span className="text-white/30">|</span>
        </h1>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-4">

          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all ${
                  activeTab === item.id
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}

        </ul>
      </nav>

    </div>
  );
};

export default Sidebar;