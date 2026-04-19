import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const PropertyTable = ({ properties, onDelete, onEdit }) => {
  
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Sold':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Rented':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Mortgage':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  
  const translateStatus = (status) => {
    const translations = {
      'Available': 'E Lirë',
      'Sold': 'E Shitur',
      'Rented': 'Me Qira',
      'Mortgage': 'Hipotekë'
    };
    return translations[status] || status;
  };

  return (
    <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            <th className="p-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-sans">Prona</th>
            <th className="p-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-sans">Çmimi</th>
            <th className="p-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-sans">Statusi</th>
            <th className="p-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase font-sans text-right">Veprimet</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {properties.map((property) => (
            <tr key={property.id} className="hover:bg-white/[0.01] transition-all group">
              <td className="p-6">
                <div className="text-white font-bold text-sm tracking-tight mb-1">{property.title}</div>
                <div className="text-white/30 text-[10px] font-medium tracking-widest uppercase">{property.location}</div>
              </td>
              <td className="p-6">
                <span className="text-white font-mono text-sm font-medium tracking-tighter">
                  {Number(property.price).toLocaleString()}€
                </span>
              </td>
              <td className="p-6">
               
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-[0.15em] uppercase border ${getStatusStyle(property.status)}`}>
                  {translateStatus(property.status)}
                </span>
              </td>
              <td className="p-6 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => onEdit(property)} 
                    className="p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    title="Edito"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(property.id)} 
                    className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Fshij"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PropertyTable;