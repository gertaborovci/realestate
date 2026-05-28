import React, { useState, useEffect } from 'react';
import { API_BASE, apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

const AgentPages = ({ onBack, agentId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    visit_date: '',
    visit_time: '10:00',
    property_id: '',
  });
  const [agent, setAgent] = useState({
    firstName: "Model",
    lastName: "Agent",
    licenseId: "LIC-123456789",
    email: "agjent@realestate.com",
    phone: "+383 44 123 456",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
  });
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [agents, props] = await Promise.all([
          apiFetch('/api/agents'),
          apiFetch('/api/properties'),
        ]);
        const a = agentId
          ? agents.find((ag) => ag.id === Number(agentId)) || agents[0]
          : agents[0];
        if (a) {
          const nameParts = (a.username || 'Model Agent').split(' ');
          setAgent({
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || 'Agent',
            licenseId: a.license_number,
            email: a.email,
            phone: "+383 44 123 456",
            photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400"
          });
        }
        setProperties(props.map((p) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price).toLocaleString(),
          image: p.image?.startsWith('http') ? p.image : `${API_BASE}${p.image || ''}`,
        })));
      } catch (error) {
        console.error('Failed to load agent page data:', error);
      }
    };
    loadData();
  }, [agentId]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 1,
          client_name: formData.name,
          client_email: formData.email,
          message: formData.message,
        }),
      });
      alert('Message sent successfully!');
      setFormData({
        name: '',
        email: '',
        message: '',
        visit_date: '',
        visit_time: '10:00',
        property_id: '',
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user?.id) {
      alert('Please sign in to schedule a visit.');
      return;
    }
    if (!formData.property_id || !formData.visit_date || !formData.visit_time) {
      alert('Please select a property, date, and time.');
      return;
    }
    try {
      await apiFetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: Number(formData.property_id),
          user_id: user.id,
          visit_date: formData.visit_date,
          visit_time: formData.visit_time,
          status: 'PENDING',
        }),
      });
      alert('Visit scheduled successfully! The admin will review your request.');
      setFormData((prev) => ({
        ...prev,
        visit_date: '',
        visit_time: '10:00',
        property_id: '',
      }));
    } catch (err) {
      alert(err.message || 'Failed to schedule visit.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-20">
      <button onClick={onBack} className="mb-10 text-white/50 hover:text-white transition-all">← Go Back</button>
      
      {/* Headeri i Profilit */}
      <div className="flex items-start gap-12 mb-20 border-b border-white/10 pb-12">
        <div className="w-48 h-48 bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          <img src={agent.photo} alt={agent.firstName} className="w-full h-full object-cover" />
        </div>
        
        <div className="flex-1">
          <h1 className="text-6xl font-black uppercase">{agent.firstName} {agent.lastName}</h1>
          <p className="text-white/40 mt-2 font-mono uppercase tracking-widest text-sm">License: {agent.licenseId}</p>
          
          <div className="flex gap-4 mt-8">
            <a href={`mailto:${agent.email}`} className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase hover:bg-neutral-200 transition-all">
              EMAIL: {agent.email}
            </a>
            <a href={`tel:${agent.phone}`} className="border border-white/20 px-6 py-3 rounded-full font-bold text-xs uppercase hover:bg-white/10 transition-all">
              PHONE: {agent.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Seksioni i Pronave */}
      <h2 className="text-3xl font-bold uppercase tracking-widest mb-10">Listed Properties ({properties.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {properties.map(property => (
          <div key={property.id} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-white/30 transition-all group">
            <img src={property.image} alt={property.title} className="w-full h-40 object-cover rounded mb-4" />
            <h3 className="text-lg font-bold">{property.title}</h3>
            <p className="text-white/50 mt-1 font-semibold">{property.price} €</p>
            <button className="mt-4 w-full py-2 border border-white/10 rounded text-xs uppercase font-bold hover:bg-white hover:text-black transition-all">
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Seksioni i Kontaktit dhe Vizitave - I ndarë në dy pjesë */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Forma për Kontakt */}
        <div className="bg-white/5 p-10 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold uppercase mb-6">Send a Message</h2>
          <form className="space-y-4" onSubmit={handleContactSubmit}>
            <input type="text" placeholder="Your Name" className="bg-black border border-white/20 p-4 rounded-lg w-full text-white" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input type="email" placeholder="Your Email" className="bg-black border border-white/20 p-4 rounded-lg w-full text-white" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <textarea placeholder="Your Message" className="bg-black border border-white/20 p-4 rounded-lg w-full text-white" rows="4" onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
            <button className="w-full bg-white text-black py-4 rounded-lg font-bold uppercase hover:bg-neutral-200 transition-all">
              Send Message
            </button>
          </form>
        </div>

        {/* Forma për Caktim të Vizitës */}
        <div className="bg-white/5 p-10 rounded-2xl border border-white/10">
          <h2 className="text-2xl font-bold uppercase mb-6">Schedule a Visit</h2>
          <form className="space-y-4" onSubmit={handleVisitSubmit}>
            <input
              type="date"
              required
              className="bg-black border border-white/20 p-4 rounded-lg w-full text-white"
              value={formData.visit_date}
              onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
            />
            <input
              type="time"
              required
              className="bg-black border border-white/20 p-4 rounded-lg w-full text-white"
              value={formData.visit_time}
              onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
            />
            <select
              required
              className="bg-black border border-white/20 p-4 rounded-lg w-full text-white"
              value={formData.property_id}
              onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <p className="text-white/50 text-sm mt-4 italic">Choose a date and the property you would like to visit, and the agent will confirm your request.</p>
            <button className="w-full bg-white text-black py-4 rounded-lg font-bold uppercase hover:bg-neutral-200 transition-all mt-4">
              Book Appointment
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AgentPages;