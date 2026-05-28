import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, Shield, Calendar, Bell, X, User, Star, MessageSquare, AlertCircle, Plus, Search, MapPin } from 'lucide-react';
import { apiFetch } from '../lib/api';

import UserProfile from '../components/UserProfile';
import UserFavorites from '../components/UserFavorites';
import UserStories from '../components/UserStories';
import UserRating from '../components/UserRating';

export default function UserDashboard({ onBack }) {
  // --- MENU STATE ---
  const [activeSection, setActiveSection] = useState("profile");

  // --- FAVORITES STATE ---
  const [favorites, setFavorites] = useState([
    { id: 1, title: "Vilë Moderne me Pishinë", price: "250,000", location: "Prishtinë", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80" },
    { id: 2, title: "Apartament Luksoz në Qendër", price: "120,000", location: "Pejë", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80" },
    { id: 3, title: "Shtëpi Private me Kopsht", price: "180,000", location: "Prizren", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80" },
  ]);

  // --- MODAL & SEARCH STATES ---
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // --- NOTIFICATION & RATING STATES ---
  const [showNotification, setShowNotification] = useState(false);
  const [removedNotification, setRemovedNotification] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingName, setRatingName] = useState("");
  const [agentName, setAgentName] = useState(""); 

  // --- MERGED ALERT & STORY STATES ---
  const [alertData, setAlertData] = useState({ city: '', maxPrice: '' });
  const [newStory, setNewStory] = useState({ text: '', client: '', isAnonymous: false });
  const [testimonials, setTestimonials] = useState([]);

  // Fetch from DB on load
  useEffect(() => {
    apiFetch('/api/testimonials')
      .then((data) => setTestimonials(data.map((t) => ({
        id: t.id,
        text: t.teksti,
        client: t.klienti_emri,
      }))))
      .catch(console.error);
  }, []);

  // --- DATA & LOGIC ---
  const allLocations = ["Prishtinë", "Prizren", "Pejë", "Gjakovë", "Mitrovicë", "Ferizaj", "Gjilan", "Podujevë"];
  const filteredLocations = allLocations.filter(loc => loc.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const onlyLetters = (value) => value.replace(/[^a-zA-ZçÇëË\s]/g, '');

  // --- HANDLERS ---
  const handleRemoveFavorite = (id) => {
    setFavorites(favorites.filter((item) => item.id !== id));
    setRemovedNotification(true);
    setTimeout(() => { setRemovedNotification(false); }, 3000);
  };

  const handleSubmitRating = (e) => {
    e.preventDefault();

    if (!agentName.trim()) {
      alert("Ju lutem plotësoni emrin e agjentit!");
      return;
    }

    if (rating === 0 && comment.trim() === "") {
      alert("Ju lutem vlerësoni me yje ose shkruani një koment!");
      return;
    }

    // Backend Connection
    apiFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: 1,
        client_id: 1,
        vleresimi: rating,
        komenti: comment,
      }),
    })
      .then(() => alert("Faleminderit! Vlerësimi për " + agentName + " u dërgua me sukses."))
      .catch((err) => alert(err.message));

    setRating(0);
    setComment("");
    setRatingName("");
    setAgentName("");
  };

  const handleSaveAlert = () => {
    if (!alertData.city.trim() && !alertData.maxPrice.trim()) {
      alert("Ju lutemi plotësoni qytetin ose çmimin maksimal!");
      return;
    }

    // Backend Connection
    apiFetch('/api/search-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 1,
        qyteti: alertData.city,
        cmimi_max: alertData.maxPrice || null,
      }),
    })
      .then(() => {
        alert("Alarmi u ruajt me sukses!");
        setIsAlertModalOpen(false);
        setAlertData({ city: '', maxPrice: '' });
      })
      .catch((err) => alert(err.message));
  };

  const handleSaveStory = () => {
    if (!newStory.text.trim()) {
      alert("Shkruaj tekstin e historisë!");
      return;
    }

    const finalName = newStory.isAnonymous ? "Anonim" : (newStory.client || "Përdorues");

    // Backend Connection
    apiFetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ klienti_emri: finalName, teksti: newStory.text }),
    })
      .then((created) => {
        setTestimonials([
          ...testimonials,
          { id: created.id, text: newStory.text, client: finalName },
        ]);
        setIsStoryModalOpen(false);
        setNewStory({ text: '', client: '', isAnonymous: false });
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-zinc-100 font-sans">
      
      {/* --- MODAL ALERT --- */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">
            <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Krijo Alarm</h3><button onClick={() => setIsAlertModalOpen(false)}><X /></button></div>
            <input placeholder="Qyteti..." className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700" value={alertData.city} onChange={(e) => setAlertData({ ...alertData, city: onlyLetters(e.target.value) })} />
            <input placeholder="Çmimi maksimal..." type="number" className="w-full bg-black p-3 rounded-lg mb-4 border border-zinc-700" value={alertData.maxPrice} onChange={(e) => setAlertData({ ...alertData, maxPrice: e.target.value })} />
            <button className="w-full bg-white text-black py-3 rounded-lg font-bold" onClick={handleSaveAlert}>Ruaj Alarmin</button>
          </div>
        </div>
      )}

      {/* --- MODAL STORY --- */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">
            <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">Shto Historinë</h3><button onClick={() => setIsStoryModalOpen(false)}><X /></button></div>
            <textarea placeholder="Shkruaj historinë..." className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 h-32" onChange={(e) => setNewStory({ ...newStory, text: e.target.value })} />
            <input placeholder="Emri yt..." disabled={newStory.isAnonymous} className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 disabled:opacity-30" value={newStory.client} onChange={(e) => setNewStory({ ...newStory, client: onlyLetters(e.target.value) })} />
            <label className="flex items-center gap-2 mb-4 text-sm"><input type="checkbox" onChange={(e) => setNewStory({ ...newStory, isAnonymous: e.target.checked })} /> Dërgoje si Anonim</label>
            <button className="w-full bg-white text-black py-2 rounded-lg font-bold" onClick={handleSaveStory}>Publiko</button>
          </div>
        </div>
      )}

      {/* --- MODAL SHTO PRONË (ME SEARCH) --- */}
      {isAddPropertyModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm border border-zinc-800">
            <div className="flex justify-between mb-4">
                <h3 className="font-bold text-lg">Zgjidh Lokacionin</h3>
                <button onClick={() => setIsAddPropertyModalOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="relative mb-4">
                <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input 
                    placeholder="Kërko qytetin..." 
                    className="w-full bg-black border border-zinc-700 p-3 pl-10 rounded-xl text-white outline-none focus:border-zinc-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="max-h-60 overflow-y-auto border border-zinc-800 rounded-xl mb-4">
                {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => (
                        <div 
                            key={loc} 
                            onClick={() => setSelectedLocation(loc)}
                            className={`p-3 cursor-pointer hover:bg-zinc-800 flex items-center gap-2 ${selectedLocation === loc ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'}`}
                        >
                            <MapPin size={16}/> {loc}
                        </div>
                    ))
                ) : (
                    <div className="p-3 text-zinc-500 text-sm italic text-center">Nuk u gjet asnjë qytet.</div>
                )}
            </div>

            <button 
                disabled={!selectedLocation}
                className="w-full bg-white text-black py-3 rounded-lg font-bold disabled:opacity-50"
                onClick={() => { 
                    alert("Pronë e shtuar në: " + selectedLocation); 
                    setIsAddPropertyModalOpen(false); 
                    setSearchTerm('');
                    setSelectedLocation('');
                }}
            >
                {selectedLocation ? `Shto për ${selectedLocation}` : "Zgjidh një qytet"}
            </button>
          </div>
        </div>
      )}

      {/* --- DASHBOARD UI --- */}
      <div className="max-w-7xl mx-auto px-8 py-10 pb-24">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-all font-bold uppercase tracking-widest text-sm">← KTHEHU NË FAQEN KRYESORE</button>

        {showNotification && <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg">Ndryshimet u ruajtën!</div>}
        {removedNotification && <div className="fixed top-20 right-5 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg">Prona u hoq!</div>}

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white mb-3">Profili Im 👤</h1>
          <p className="text-zinc-500">Menaxho profilin dhe pronat e preferuara</p>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {["profile", "favorites", "stories", "rating"].map(section => (
            <button key={section} onClick={() => setActiveSection(section)} className={`px-5 py-3 rounded-xl font-bold transition ${activeSection === section ? "bg-white text-black" : "bg-zinc-900 text-white border border-zinc-800"}`}>
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>

        {/* RENDER SECTIONS */}
        {activeSection === "profile" && <UserProfile />}
        {activeSection === "favorites" && (
          <UserFavorites 
            favorites={favorites} 
            handleRemoveFavorite={handleRemoveFavorite} 
            onAddFavorite={() => setIsAddPropertyModalOpen(true)} 
          />
        )}
        {activeSection === "stories" && <UserStories testimonials={testimonials} setIsStoryModalOpen={setIsStoryModalOpen} />}
        {activeSection === "rating" && <UserRating agentName={agentName} setAgentName={setAgentName} rating={rating} setRating={setRating} comment={comment} setComment={setComment} handleSubmitRating={handleSubmitRating} />}
      </div>
    </div>
  );
}