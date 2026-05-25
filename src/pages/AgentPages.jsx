import React from 'react';

const AgentPages = ({ onBack }) => {
  // Këto janë të dhënat statike (të shkruara direkt këtu)
  const agent = {
    firstName: "Agjent",
    lastName: "Model",
    licenseId: "LIC-123456789",
    email: "agjent@realestate.com",
    phone: "+383 44 123 456",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
  };

  const properties = [
    { id: 1, title: "Apartament Modern", price: "150,000", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=400" },
    { id: 2, title: "Shtëpi në Prishtinë", price: "280,000", image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=400" },
    { id: 3, title: "Lokal në Qendër", price: "450,000", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-20">
      <button onClick={onBack} className="mb-10 text-white/50 hover:text-white">← Go Back</button>
      
      {/* Headeri i Profilit */}
      <div className="flex items-start gap-12 mb-20 border-b border-white/10 pb-12">
        <div className="w-48 h-48 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <img src={agent.photo} alt={agent.firstName} className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1">
          <h1 className="text-6xl font-black uppercase">{agent.firstName} {agent.lastName}</h1>
          <p className="text-white/40 mt-2">License: {agent.licenseId}</p>
          
          <div className="flex gap-4 mt-8">
            <a href={`mailto:${agent.email}`} className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase hover:bg-neutral-200">
              EMAIL: {agent.email}
            </a>
            <a href={`tel:${agent.phone}`} className="border border-white/20 px-6 py-3 rounded-full font-bold text-xs uppercase hover:bg-white/10">
              PHONE: {agent.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Pronat */}
      <h2 className="text-3xl font-bold uppercase mb-10">Listed Properties ({properties.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {properties.map(property => (
          <div key={property.id} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-white/30 transition-all">
            <img src={property.image} alt={property.title} className="w-full h-40 object-cover rounded mb-4" />
            <h3 className="text-lg font-bold">{property.title}</h3>
            <p className="text-white/50">{property.price} €</p>
            <button className="mt-4 w-full py-2 border border-white/10 rounded text-xs uppercase font-bold hover:bg-white hover:text-black">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentPages;