import React, { useState, useEffect, useRef } from 'react';
import { X, Globe, Mail, Phone, Camera, User } from 'lucide-react';
import { apiFetch, API_BASE } from '../lib/api';
import { getCurrentUser } from '../lib/auth';

import Navbar from '../components/Navbar';
import UserProfile from '../components/UserProfile';
import UserFavorites from '../components/UserFavorites';
import UserVisits from '../components/UserVisits';
import UserContracts from '../components/UserContracts';
import UserStories from '../components/UserStories';
import UserRating from '../components/UserRating';
import UserRequests from '../components/UserRequests';
import UserSupport from '../components/UserSupport';
import UserSearchAlerts from '../components/UserSearchAlerts';
import { showAlert, showConfirm } from '../lib/modal';

export default function UserDashboard({ onNavigate, onBack, onSignOut, currentUser, onUserChange, favorites = [], onRemoveFavorite, onViewProperty }) {
  const user = currentUser || getCurrentUser();
  const [activeSection, setActiveSection] = useState(() => {
    // If a notification click pre-selected a section, honour it
    const pending = sessionStorage.getItem('kn_dashboard_section');
    if (pending) { sessionStorage.removeItem('kn_dashboard_section'); return pending; }
    return 'profile';
  });
  const [uploadingPhoto,   setUploadingPhoto]   = useState(false);
  const [photoError,       setPhotoError]       = useState('');
  const photoInputRef = useRef(null);

  const photoSrc = user?.photo_url
    ? (user.photo_url.startsWith('http') ? user.photo_url : `${API_BASE}${user.photo_url}`)
    : null;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be smaller than 5 MB.'); e.target.value = ''; return; }
    const fd = new FormData();
    fd.append('photo', file);
    setUploadingPhoto(true);
    try {
      const data = await apiFetch(`/api/users/${user.id}/photo`, { method: 'POST', body: fd });
      if (onUserChange) onUserChange({ ...user, photo_url: data.photo_url });
    } catch (err) { setPhotoError(err.message || 'Upload failed.'); }
    finally { setUploadingPhoto(false); e.target.value = ''; }
  };

  const handlePhotoDelete = async () => {
    setPhotoError('');
    try {
      await apiFetch(`/api/users/${user.id}/photo`, { method: 'DELETE' });
      if (onUserChange) onUserChange({ ...user, photo_url: null });
    } catch (err) { setPhotoError(err.message || 'Failed to remove photo.'); }
  };

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [removedNotification, setRemovedNotification] = useState(false);

  const [testimonials,      setTestimonials]      = useState([]);
  const [ratings,           setRatings]           = useState([]);
  const [alertUnreadCount,  setAlertUnreadCount]  = useState(0);
  const [sectionBadges,     setSectionBadges]     = useState({});

  // Re-fetch the logged-in user's profile from the API so any changes
  // made by an admin (e.g. photo update) are reflected immediately.
  useEffect(() => {
    if (!user?.id) return;
    apiFetch(`/api/users/${user.id}`)
      .then(fresh => {
        if (fresh && onUserChange) onUserChange(fresh);
      })
      .catch(() => {}); // non-fatal — shows cached data if server unreachable
  }, [user?.id]);

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
        setTestimonials(data.map((t) => ({
          id:           t.id,
          text:         t.teksti,
          teksti:       t.teksti,
          client:       t.klienti_emri,
          klienti_emri: t.klienti_emri,
          foto_url:     t.foto_url  || null,
          user_id:      t.user_id   || null,
        })))
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

  // Map notification link/type → dashboard section key
  const notifToSection = (n) => {
    if (n.type === 'ticket' || n.link === 'support')       return 'support';
    if (n.type === 'visit_update' || n.link === 'visits')  return 'requests';
    if (n.type === 'alert')                                return 'alerts';
    return null;
  };

  // Poll unread notifications and spread badges across sections
  useEffect(() => {
    if (!user?.id) return;
    const check = () => {
      apiFetch(`/api/notifications/user/${user.id}`)
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          const counts = {};
          list.filter(n => !n.is_read).forEach(n => {
            const sec = notifToSection(n);
            if (sec) counts[sec] = (counts[sec] || 0) + 1;
          });
          setSectionBadges(counts);
          setAlertUnreadCount(counts['alerts'] || 0);
        })
        .catch(() => {});
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleRemoveFavorite = (id) => {
    if (onRemoveFavorite) onRemoveFavorite(id); // delegate to App.jsx which owns favorites state
    setRemovedNotification(true);
    setTimeout(() => { setRemovedNotification(false); }, 3000);
  };

  const handleSaveStory = (newStory) => {
    const finalName = newStory.isAnonymous ? 'Anonymous' : (newStory.client || 'User');

    const doPost = (body, headers) =>
      apiFetch('/api/testimonials', { method: 'POST', ...headers, body })
        .then((created) => {
          setTestimonials((prev) => [...prev, {
            id: created.id,
            text: newStory.text,
            teksti: newStory.text,
            client: finalName,
            klienti_emri: finalName,
            foto_url: created.foto_url || null,
            user_id: user?.id || null,
          }]);
          setIsStoryModalOpen(false);
        })
        .catch(async (err) => await showAlert(err.message, 'error'));

    if (newStory.photo) {
      const fd = new FormData();
      fd.append('klienti_emri', finalName);
      fd.append('teksti', newStory.text);
      fd.append('photo', newStory.photo);
      if (user?.id) fd.append('user_id', String(user.id));
      doPost(fd, {});
    } else {
      doPost(
        JSON.stringify({ klienti_emri: finalName, teksti: newStory.text, user_id: user?.id || null }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">

      {/* Shared navbar */}
      <Navbar
        onNavigate={onNavigate}
        isScrolled={true}
        currentView="user-dashboard"
        currentUser={user}
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-36 pb-12 md:pb-24">

        {/* Profile header — photo + name */}
        <div className="mb-10 flex flex-col items-center gap-4">
          {/* Avatar with click-to-change overlay */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
              {photoSrc ? (
                <img src={photoSrc} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-zinc-500" />
              )}
            </div>
            {/* Hover overlay to upload */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              title="Change photo"
            >
              {uploadingPhoto
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Camera size={20} className="text-white" />}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {/* Remove badge */}
            {photoSrc && !uploadingPhoto && (
              <button
                onClick={handlePhotoDelete}
                title="Remove photo"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition z-10"
              >
                <X size={11} />
              </button>
            )}
          </div>
          {photoError && <p className="text-red-400 text-xs font-semibold">{photoError}</p>}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black text-white">
              {user.emri || user.username || 'My Profile'}
            </h1>
            <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold mt-1">
              {user.role === 'agent' ? 'Real Estate Agent' : user.role === 'admin' ? 'Administrator' : 'Member'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-14">
          {[
            { key: 'profile',   label: 'Profile' },
            { key: 'favorites', label: `Favorites (${favorites.length})` },
            { key: 'requests',  label: 'My Requests' },
            { key: 'contracts', label: 'My Contracts' },
            { key: 'stories',   label: 'Stories' },
            { key: 'rating',    label: 'Ratings' },
            { key: 'alerts',    label: 'Alerts' },
            { key: 'support',   label: 'Support' },
          ].map(({ key, label }) => {
            const badge = sectionBadges[key] || 0;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveSection(key);
                  if (badge > 0) setSectionBadges(prev => ({ ...prev, [key]: 0 }));
                }}
                className={`relative px-3 md:px-5 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm transition ${
                  activeSection === key ? 'bg-white text-black' : 'bg-zinc-900 text-white border border-zinc-800'
                }`}
              >
                {label}
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sections */}
        {activeSection === 'profile'   && <UserProfile currentUser={user} onUserChange={onUserChange} onNavigate={onNavigate} />}
        {activeSection === 'favorites' && (
          <UserFavorites
            favorites={favorites}
            handleRemoveFavorite={handleRemoveFavorite}
            onViewProperty={onViewProperty}
          />
        )}
        {activeSection === 'requests'  && <UserRequests />}
        {activeSection === 'contracts' && <UserContracts />}
        {activeSection === 'stories'   && (
          <UserStories testimonials={testimonials} setIsStoryModalOpen={setIsStoryModalOpen} setTestimonials={setTestimonials} />
        )}
        {activeSection === 'rating'    && (
          <UserRating ratings={ratings} setRatings={setRatings} />
        )}
        {activeSection === 'alerts'    && <UserSearchAlerts onNavigate={onNavigate} />}
        {activeSection === 'support'   && <UserSupport />}
      </div>

      {/* About Us Footer */}
      <AboutUsFooter onNavigate={onNavigate} />
    </div>
  );
}

/* ── Story modal ─────────────────────────────────────────────────────────────── */
function StoryModal({ onClose, onSave }) {
  const [text,        setText]        = useState('');
  const [client,      setClient]      = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photo,       setPhoto]       = useState(null);
  const [preview,     setPreview]     = useState(null);
  const onlyLetters = (v) => v.replace(/[^a-zA-ZçÇëË\s]/g, '');

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Add Your Story</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={18} /></button>
        </div>

        <textarea
          placeholder="Write your story..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-black p-3 rounded-xl border border-zinc-700 h-32 resize-none outline-none focus:border-zinc-500 text-sm"
        />

        <input
          placeholder="Your name..."
          disabled={isAnonymous}
          className="w-full bg-black p-3 rounded-xl border border-zinc-700 disabled:opacity-30 outline-none focus:border-zinc-500 text-sm"
          value={client}
          onChange={(e) => setClient(onlyLetters(e.target.value))}
        />

        {/* Photo upload */}
        <div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">Photo (optional)</p>
          {preview ? (
            <div className="relative inline-block">
              <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-xl border border-zinc-700" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black transition"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 w-full h-16 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer transition text-zinc-500 hover:text-white text-sm font-bold uppercase tracking-wide">
              + Add Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
          <input type="checkbox" onChange={(e) => setIsAnonymous(e.target.checked)} className="accent-white" />
          Post anonymously
        </label>

        <button
          className="w-full bg-white text-black py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition"
          onClick={async () => {
            if (!text.trim()) { await showAlert('Write your story first!'); return; }
            onSave({ text, client, isAnonymous, photo });
          }}
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
