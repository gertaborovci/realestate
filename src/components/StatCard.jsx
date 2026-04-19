import React from 'react';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[32px] hover:bg-white/10 transition-all duration-300 group">
      <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">{title}</p>
        <h3 className="text-white text-4xl font-bold tracking-tighter">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;