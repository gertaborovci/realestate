import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../lib/api';

import UserProfile from '../components/UserProfile';
import UserFavorites from '../components/UserFavorites';
import UserStories from '../components/UserStories';
import UserRating from '../components/UserRating';

export default function UserDashboard({ onBack, favorites = [], onRemoveFavorite, onViewProperty }) {
  const [activeSection, setActiveSection] = useState('profile');

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  const [showNotification, setShowNotification] = useState(false);
  const [removedNotification, setRemovedNotification] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingName, setRatingName] = useState('');
  const [agentName, setAgentName] = useState('');

  const [alertData, setAlertData] = useState({ city: '', maxPrice: '' });
  const [newStory, setNewStory] = useState({ text: '', client: '', isAnonymous: false });
  const [testimonials, setTestimonials] = useState([]);

  // Load testimonials from backend on mount
  useEffect(() => {
    apiFetch('/api/testimonials')
      .then((data) =>
        setTestimonials(
          data.map((t) => ({ id: t.id, text: t.teksti, client: t.klienti_emri }))
        )
      )
      .catch(console.error);
  }, []);

  const onlyLetters = (value) => value.replace(/[^a-zA-ZçÇëË\s]/g, '');

  // --- HANDLERS ---
  const handleRemoveFavorite = (id) => {
    if (onRemoveFavorite) onRemoveFavorite(id);
    setRemovedNotification(true);
    setTimeout(() => setRemovedNotification(false), 3000);
  };

  const handleSubmitRating = (e) => {
    e.preventDefault();
    if (!agentName.trim()) { alert("Please enter the agent's name!"); return; }
    if (rating === 0 && comment.trim() === '') { alert('Please add a star rating or write a comment!'); return; }

    apiFetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: 1, client_id: 1, vleresimi: rating, komenti: comment }),
    })
      .then(() => alert(`Thank you! Your rating for ${agentName} was submitted successfully.`))
      .catch((err) => alert(err.message));

    setRating(0); setComment(''); setRatingName(''); setAgentName('');
  };

  const handleSaveAlert = () => {
    if (!alertData.city.trim() && !alertData.maxPrice.trim()) {
      alert('Please enter a city or a maximum price!');
      return;
    }
    apiFetch('/api/search-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: 1, qyteti: alertData.city, cmimi_max: alertData.maxPrice || null }),
    })
      .then(() => {
        alert('Alert saved successfully!');
        setIsAlertModalOpen(false);
        setAlertData({ city: '', maxPrice: '' });
      })
      .catch((err) => alert(err.message));
  };

  const handleSaveStory = () => {
    if (!newStory.text.trim()) { alert('Please write your story text!'); return; }
    const finalName = newStory.isAnonymous ? 'Anonymous' : (newStory.client || 'User');

    apiFetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ klienti_emri: finalName, teksti: newStory.text }),
    })
      .then((created) => {
        setTestimonials([...testimonials, { id: created.id, text: newStory.text, client: finalName }]);
        setIsStoryModalOpen(false);
        setNewStory({ text: '', client: '', isAnonymous: false });
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-zinc-100 font-sans">

      {/* Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-lg">Create Alert</h3>
              <button onClick={() => setIsAlertModalOpen(false)}><X /></button>
            </div>
            <input
              placeholder="City..."
              className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700"
              value={alertData.city}
              onChange={(e) => setAlertData({ ...alertData, city: onlyLetters(e.target.value) })}
            />
            <input
              placeholder="Maximum price..."
              type="number"
              className="w-full bg-black p-3 rounded-lg mb-4 border border-zinc-700"
              value={alertData.maxPrice}
              onChange={(e) => setAlertData({ ...alertData, maxPrice: e.target.value })}
            />
            <button className="w-full bg-white text-black py-3 rounded-lg font-bold" onClick={handleSaveAlert}>
              Save Alert
            </button>
          </div>
        </div>
      )}

      {/* Story Modal */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold text-lg">Add Your Story</h3>
              <button onClick={() => setIsStoryModalOpen(false)}><X /></button>
            </div>
            <textarea
              placeholder="Write your story..."
              className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 h-32"
              onChange={(e) => setNewStory({ ...newStory, text: e.target.value })}
            />
            <input
              placeholder="Your name..."
              disabled={newStory.isAnonymous}
              className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 disabled:opacity-30"
              value={newStory.client}
              onChange={(e) => setNewStory({ ...newStory, client: onlyLetters(e.target.value) })}
            />
            <label className="flex items-center gap-2 mb-4 text-sm">
              <input type="checkbox" onChange={(e) => setNewStory({ ...newStory, isAnonymous: e.target.checked })} />
              Post anonymously
            </label>
            <button className="w-full bg-white text-black py-2 rounded-lg font-bold" onClick={handleSaveStory}>
              Publish
            </button>
          </div>
        </div>
      )}

      {/* Dashboard UI */}
      <div className="max-w-7xl mx-auto px-8 py-10 pb-24">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-all font-bold uppercase tracking-widest text-sm"
        >
          ← Back to Home
        </button>

        {showNotification && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg">
            Changes saved!
          </div>
        )}
        {removedNotification && (
          <div className="fixed top-20 right-5 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg">
            Property removed!
          </div>
        )}

        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white mb-3">My Profile</h1>
          <p className="text-zinc-500">Manage your profile and saved properties</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {[
            { key: 'profile',   label: 'Profile' },
            { key: 'favorites', label: `Favorites (${favorites.length})` },
            { key: 'stories',   label: 'Stories' },
            { key: 'rating',    label: 'Ratings' },
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
        {activeSection === 'profile' && <UserProfile />}
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
          <UserRating
            agentName={agentName}
            setAgentName={setAgentName}
            rating={rating}
            setRating={setRating}
            ratingName={ratingName}
            setRatingName={setRatingName}
            comment={comment}
            setComment={setComment}
            handleSubmitRating={handleSubmitRating}
          />
        )}
      </div>
    </div>
  );
}
