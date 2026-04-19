import React from 'react';

import { LayoutDashboard, Building2, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ onTabChange, activeTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'DASHBOARD' },
    { id: 'properties', icon: <Building2 size={18} />, label: 'PRONAT' },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-[#050505] border-r border-white/5 shadow-2xl">
      
      
      <div className="p-8">
        <h1 className="text-white font-black text-xl tracking-tighter flex items-center gap-2">
          FIND HOME<span className="text-white/30">|</span>
        </h1>
      </div>

     
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button 
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] transition-all ${
                  activeTab === item.id ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon} {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

    
      <div className="p-6 border-t border-white/5 space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-white/40 hover:text-white transition-all">
          <Settings size={18} /> CILËSIMET
        </button>
        <button className="w-full flex items-center gap-4 px-4 py-3 text-[10px] font-bold tracking-[0.2em] text-red-500/60 hover:text-red-500 transition-all">
          <LogOut size={18} /> DIL
        </button>
      </div>
    </div>
  );
};


export default Sidebar;