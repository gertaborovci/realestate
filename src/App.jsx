import React from 'react';
import { Search, User, Menu } from 'lucide-react';

const RealEstateHero = () => {
  return (
    <div className="relative min-h-screen w-full bg-black font-sans overflow-hidden p-4">
      <div 
        className="absolute inset-4 rounded-[40px] bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')" }}
      >
        <div className="absolute inset-0 bg-black/30"></div>

        <nav className="absolute top-6 left-1/2 -translate-x-1/2 w-[95%] flex items-center justify-between z-50">
          
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full px-4">
            <div className="p-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition">
              <User size={18} className="text-white" />
            </div>
            {['BUYERS', 'SELLERS', 'ABOUT US', 'CONTACT US'].map((item) => (
              <button key={item} className="text-white text-[10px] font-bold tracking-widest px-3 hover:opacity-70">
                {item}
              </button>
            ))}
          </div>

          <div className="bg-white px-8 py-3 rounded-b-2xl shadow-lg -mt-2">
            <div className="flex flex-col items-center">
              <span className="text-black font-extrabold text-xl tracking-tighter">Find Home</span>
              <div className="h-1 w-6 bg-black rounded-full mt-1"></div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full pl-6 pr-2">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Search by Address, City, or Neighborhood" 
                className="bg-transparent border-none outline-none text-white text-xs w-64 placeholder:text-gray-300"
              />
              <Search size={16} className="text-white opacity-70" />
            </div>
            <button className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs px-5 py-2 rounded-full transition">
              Login
            </button>
            <div className="p-2 cursor-pointer text-white">
              <Menu size={20} />
            </div>
          </div>
        </nav>

        <div className="absolute bottom-16 left-12 max-w-2xl">
          <h1 className="text-white text-8xl font-bold tracking-tighter leading-none mb-6">
            DREAM HOME
          </h1>
          <p className="text-gray-200 text-sm max-w-md leading-relaxed opacity-80">
            Constant is a global branding agency and venture studio specialised in designing and 
            growing modern consumer brands. We call that platforms for growth.
          </p>
        </div>

      </div>
    </div>
  );
};

export default RealEstateHero;