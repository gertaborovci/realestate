import React, { useState, useEffect } from 'react';
import { X, Globe, Mail, Phone } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

import Navbar from '../components/Navbar';
import UserProfile from '../components/UserProfile';
import UserFavorites from '../components/UserFavorites';
import UserStories from '../components/UserStories';
import UserRating from '../components/UserRating';
import UserRequests from '../components/UserRequests';

export default function UserDashboard({ onNavigate, onBack, onSignOut, currentUser, onUserChange, favorites = [], onRemoveFavorite, onViewProperty }) {
  const user = currentUser || getCurrentUser();
  const [activeSection, setActiveSection] = useState('profile');

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [removedNotification, setRemovedNotification] = useState(false);

  const [testimonials, setTestimonials] = useState([]);
  const [ratings, setRatings] = useState([]);

  // Redirect to sign-in if not logged in
  useEffect(() => {
    if (!user) {
      onNavigate('signin');
    }
  }, []);

  // Load testimonials
  useEffect(() => {
    apiFetch('/api/testimonials')
      .then((data) =>
        setTestimonials(data.map((t) => ({ id: t.id, text: t.teksti, client: t.klienti_emri })))
      )
      .catch(console.error);
  }, []);

  // Load user's own ratings
  useEffect(() => {
    if (!user) return;
    apiFetch(`/api/ratings/user/${user.id}`)
      .then(setRatings)
      .catch(console.error);
  }, []);

  const handleRemoveFavorite = (id) => {
    if (onRemoveFavorite) onRemoveFavorite(id);
    setRemovedNotification(true);
    setTimeout(() => setRemovedNotification(false), 3000);
  };

  const handleSaveStory = (newStory) => {
    const finalName = newStory.isAnonymous ? 'Anonymous' : (newStory.client || 'User');
    apiFetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ klienti_emri: finalName, teksti: newStory.text }),
    })
      .then((created) => {
        setTestimonials((prev) => [...prev, { id: created.id, text: newStory.text, client: finalName }]);
        setIsStoryModalOpen(false);
      })
      .catch((err) => alert(err.message));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">

      {/* Shared navbar */}
      <Navbar
        onNavigate={onNavigate}
        isScrolled={true}
        currentView="user-dashboard"
        onSignOut={onSignOut}
      />

      {/* Story Modal */}
      {isStoryModalOpen && (
        <StoryModal
          onClose={() => setIsStoryModalOpen(false)}
          onSave={handleSaveStory}
        />
      )}

      {removedNotification && (
        <div className="fixed top-20 right-5 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg">
          Property removed!
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-8 pt-36 pb-24">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white mb-3">
            {user.emri || user.username || 'My Profile'}
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">
            {user.role === 'agent' ? 'Real Estate Agent' : user.role === 'admin' ? 'Administrator' : 'Member'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {[
            { key: 'profile',   label: 'Profile' },
            { key: 'favorites', label: `Favorites (${favorites.length})` },
            { key: 'stories',   label: 'Stories' },
            { key: 'rating',    label: 'Ratings' },
            { key: 'requests',  label: 'My Requests' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-5 py-3 rounded-xl font-bold transition ${
                activeSection === key ? 'bg-white text-black' : 'bg-zinc-900 text-white border border-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {activeSection === 'profile' && <UserProfile currentUser={user} onUserChange={onUserChange} onNavigate={onNavigate} />}
        {activeSection === 'favorites' && (
          <UserFavorites
            favorites={favorites}
            handleRemoveFavorite={handleRemoveFavorite}
            onViewProperty={onViewProperty}
          />
        )}
        {activeSection === 'stories' && (
          <UserStories testimonials={testimonials} setIsStoryModalOpen={setIsStoryModalOpen} />
        )}
        {activeSection === 'rating' && (
          <UserRating ratings={ratings} setRatings={setRatings} />
        )}
        {activeSection === 'requests' && <UserRequests />}
      </div>

      {/* About Us Footer */}
      <AboutUsFooter onNavigate={onNavigate} />
    </div>
  );
}

/* ── Story modal ─────────────────────────────────────────────────────────────── */
function StoryModal({ onClose, onSave }) {
  const [text, setText] = useState('');
  const [client, setClient] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const onlyLetters = (v) => v.replace(/[^a-zA-ZçÇëË\s]/g, '');

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-lg">Add Your Story</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <textarea
          placeholder="Write your story..."
          className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 h-32"
          onChange={(e) => setText(e.target.value)}
        />
        <input
          placeholder="Your name..."
          disabled={isAnonymous}
          className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 disabled:opacity-30"
          value={client}
          onChange={(e) => setClient(onlyLetters(e.target.value))}
        />
        <label className="flex items-center gap-2 mb-4 text-sm">
          <input type="checkbox" onChange={(e) => setIsAnonymous(e.target.checked)} />
          Post anonymously
        </label>
        <button
          className="w-full bg-white text-black py-2 rounded-lg font-bold"
          onClick={() => { if (!text.trim()) { alert('Write your story first!'); return; } onSave({ text, client, isAnonymous }); }}
        >
          Publish
        </button>
      </div>
    </div>
  );
}

/* ── About Us footer (same as RealEstateHero) ───────────────────────────────── */
function AboutUsFooter({ onNavigate }) {
  return (
    <section className="w-full bg-[#050505] text-white p-16 md:p-24 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 py-10">
        <div className="space-y-10">
          <h2 className="text-6xl font-black tracking-tighter uppercase leading-[0.8]">About Us</h2>
          <p className="text-2xl font-medium tracking-tight leading-relaxed max-w-lg opacity-60">
            KosovaNest is the leading premium real estate network in Kosovo. We specialize in identifying
            architectural legacies and providing elite, transparent service to buyers, sellers, and investors
            across the region.
          </p>
          <div className="flex gap-10 pt-4">
            <Globe className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
            <Mail  className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
            <Phone className="text-white/40 hover:text-white transition-colors cursor-pointer" size={24} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-12 pt-4">
          <div className="space-y-8">
            <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Operations</h4>
            <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80">
              <li className="hover:opacity-100 cursor-pointer transition-all">Local Market</li>
              <li className="hover:opacity-100 cursor-pointer transition-all">Portfolio</li>
              <li className="hover:opacity-100 cursor-pointer transition-all">Press Room</li>
            </ul>
          </div>
          <div className="space-y-8">
            <h4 className="text-[11px] font-black tracking-[0.4em] uppercase text-white/40">Legal</h4>
            <ul className="space-y-4 text-[13px] font-bold uppercase tracking-widest opacity-80">
              <li className="hover:opacity-100 cursor-pointer transition-all">Privacy Policy</li>
              <li className="hover:opacity-100 cursor-pointer transition-all">Terms of Service</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto w-full pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black tracking-[0.6em] uppercase opacity-40">
        <span>© 2026 KosovaNest. All Rights Reserved.</span>
        <div className="flex gap-8">
          <span>Premium Properties</span>
          <span>•</span>
          <span>Elite Service</span>
        </div>
      </div>
    </section>
  );
}
