import React, { useState } from 'react';
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
  Landmark,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { id: 'dashboard',     icon: <LayoutDashboard size={18} />, label: 'DASHBOARD' },
  { id: 'properties',    icon: <Building2 size={18} />,       label: 'PROPERTIES' },
  { id: 'maintenance',   icon: <Wrench size={18} />,          label: 'MAINTENANCE' },
  { id: 'visits',        icon: <Calendar size={18} />,        label: 'VISITS' },
  { id: 'agents',        icon: <Users size={18} />,           label: 'AGENTS' },
  { id: 'users',         icon: <UserCog size={18} />,         label: 'USERS' },
  { id: 'neighborhoods', icon: <MapPin size={18} />,          label: 'NEIGHBOURHOODS' },
  { id: 'expenses',      icon: <Receipt size={18} />,         label: 'EXPENSES' },
  { id: 'notifications', icon: <Bell size={18} />,            label: 'NOTIFICATIONS' },
  { id: 'support',       icon: <LifeBuoy size={18} />,        label: 'SUPPORT' },
  { id: 'offices',       icon: <Landmark size={18} />,        label: 'OFFICES' },
];

const Sidebar = ({ onTabChange, activeTab }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id) => {
    onTabChange(id);
    setMobileOpen(false); // close drawer on mobile after selection
  };

  const navContent = (
    <>
      <div className="p-6 md:p-8 flex items-center justify-between">
        <h1 className="text-white font-black text-xl tracking-tighter flex items-center gap-2">
          FIND HOME
          <span className="text-white/30">|</span>
        </h1>
        {/* Close button inside drawer on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-white/40 hover:text-white transition"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNav(item.id)}
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
    </>
  );

  return (
    <>
      {/* ── Hamburger button — visible only on mobile ─────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#111] border border-white/10 text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile overlay ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ────────────────────────────────────────────── */}
      {/* Mobile: slides in as overlay; Desktop: always visible */}
      <div
        className={`
          flex flex-col bg-[#050505] border-r border-white/5 shadow-2xl
          h-screen
          fixed md:static top-0 left-0 z-50
          w-64
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {navContent}
      </div>
    </>
  );
};

export default Sidebar;
