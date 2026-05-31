import React, { useState } from 'react';
import { User, Building2 } from 'lucide-react';
import { setCurrentUser } from '../lib/auth';
import NotificationBell from './NotificationBell';

const Navbar = ({ onNavigate, isScrolled, currentView, onSignOut, currentUser }) => {
  const user = currentUser;
  const [unreadCount, setUnreadCount] = useState(0);

  const navLinks = [
    { name: 'HOME',           view: 'hero'          },
    { name: 'BUY',            view: 'properties'    },
    { name: 'RENT',           view: 'properties'    },
    { name: 'SELL',           view: 'hero'          },
    { name: 'AGENTS',         view: 'agents'        },
    { name: 'NEIGHBOURHOODS', view: 'neighborhoods' },
  ];

  const handleUserClick = () => {
    if (!user) { onNavigate('signin'); return; }
    if (user.role === 'admin') onNavigate('dashboard');
    else if (user.role === 'agent') onNavigate('agent-dashboard');
    else onNavigate('user-dashboard');
  };

  const handleSignOut = () => {
    if (onSignOut) onSignOut();
    onNavigate('hero');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full flex items-center justify-between px-12 z-[100] transition-all duration-500 ${
      isScrolled
        ? 'bg-black/80 backdrop-blur-md border-b border-white/10 py-4 shadow-2xl'
        : 'bg-transparent py-8'
    }`}>

      {/* Logo */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onNavigate('hero')}
      >
        <Building2 size={32} className="text-white group-hover:opacity-70 transition-opacity" />
        <div className="flex flex-col">
          <span className="text-white font-black text-2xl tracking-tighter uppercase italic leading-none group-hover:opacity-70 transition-opacity">KosovaNest</span>
          <span className="text-white/80 text-[10px] font-bold tracking-[0.3em] uppercase leading-none mt-1">Real Estate Group</span>
        </div>
      </div>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((item) => (
          <button
            key={item.name}
            onClick={() => onNavigate(item.view)}
            className={`text-[10px] font-bold tracking-widest uppercase transition-all ${
              currentView === item.view
                ? 'text-white opacity-100 border-b border-white pb-1'
                : 'text-white opacity-60 hover:opacity-100'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Right: bell (logged-in only) + user icon + sign out or login */}
      <div className="flex items-center gap-4">
        {user && (
          <NotificationBell userId={user.id} onNavigate={onNavigate} onUnreadChange={setUnreadCount} />
        )}
        {/* User icon — shows red dot when there are unread notifications */}
        <div
          className="relative p-2 cursor-pointer hover:bg-white/10 rounded-full transition"
          onClick={handleUserClick}
          title={user ? (user.username || 'My Profile') : 'Sign in'}
        >
          <User size={20} className="text-white" />
          {user && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-black" />
          )}
        </div>
        {user ? (
          <button
            onClick={handleSignOut}
            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase"
          >
            Sign Out
          </button>
        ) : (
          <button
            onClick={() => onNavigate('signin')}
            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-6 py-2.5 rounded-full transition font-bold uppercase"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
