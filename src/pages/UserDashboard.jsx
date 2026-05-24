import React, { useState } from 'react';

import {
  Heart,
  User,
  CheckCircle,
  MapPin,
  Shield,
  Calendar,
  Building,
  Trash2,
  Star,
  Bell,
  MessageSquare,
  X,
  PlusCircle,
} from 'lucide-react';

export default function UserDashboard({ onBack }) {

  // MENU
  const [activeSection, setActiveSection] = useState("profile");

  // PROFILE
  const [firstName, setFirstName] = useState("Arta");
  const [lastName, setLastName] = useState("Berisha");
  const [email, setEmail] = useState("arta@gmail.com");
  const [phone, setPhone] = useState("+38349123456");
  const [address, setAddress] = useState("Rruga Nëna Terezë, Prishtinë");

  // FAVORITES
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      title: "Vilë Moderne me Pishinë",
      price: "250,000",
      location: "Prishtinë",
      image:
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      title: "Apartament Luksoz në Qendër",
      price: "120,000",
      location: "Pejë",
      image:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      title: "Shtëpi Private me Kopsht",
      price: "180,000",
      location: "Prizren",
      image:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    },
  ]);

  // NOTIFICATIONS
  const [showNotification, setShowNotification] = useState(false);
  const [removedNotification, setRemovedNotification] = useState(false);

  // RATING
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingName, setRatingName] = useState("");
  const [agentName, setAgentName] = useState(""); 

  // ALERT MODAL
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const [alertData, setAlertData] = useState({
    city: '',
    maxPrice: ''
  });

  // STORIES
  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      text:
        "Platforma Find Home më ndihmoi të gjej shtëpinë time të ëndrrave!",
      client: "Klient i lumtur"
    }
  ]);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  const [newStory, setNewStory] = useState({
    text: '',
    client: '',
    isAnonymous: false
  });

  // REGEX
  const onlyLetters = (value) =>
    value.replace(/[^a-zA-ZçÇëË\s]/g, '');

  // REMOVE FAVORITE
  const handleRemoveFavorite = (id) => {

    setFavorites(favorites.filter((item) => item.id !== id));

    setRemovedNotification(true);

    setTimeout(() => {
      setRemovedNotification(false);
    }, 3000);
  };

  // UPDATE PROFILE - Validimi: Asnjë fushë nuk mund të jetë zbrazët
  const handleUpdateProfile = (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      alert("Të gjitha fushat janë të obligueshme për ruajtjen e profilit!");
      return;
    }
    
    if (/[a-zA-Z]/.test(phone)) {
      alert("Në fushën e telefonit shkruani vetëm numra!");
      return;
    }

    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // RATING - Validimi: Agjenti obligues, Emri opsional, Yjet ose Komenti obligues
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

    alert("Faleminderit! Vlerësimi për " + agentName + " u dërgua me sukses.");

    setRating(0);
    setComment("");
    setRatingName("");
    setAgentName("");
  };

  // ALERT SAVE - Validimi: Mjafton të plotësohet Qyteti OSE Çmimi
  const handleSaveAlert = () => {

    if (!alertData.city.trim() && !alertData.maxPrice.trim()) {
      alert("Ju lutemi plotësoni qytetin ose çmimin maksimal!");
      return;
    }

    alert("Alarmi u ruajt me sukses!");

    setIsAlertModalOpen(false);

    setAlertData({
      city: '',
      maxPrice: ''
    });
  };

  // STORY SAVE
  const handleSaveStory = () => {

    if (!newStory.text.trim()) {
      alert("Shkruaj tekstin e historisë!");
      return;
    }

    const finalName =
      newStory.isAnonymous
        ? "Anonim"
        : (newStory.client || "Përdorues");

    setTestimonials([
      ...testimonials,
      {
        id: Date.now(),
        text: newStory.text,
        client: finalName
      }
    ]);

    setIsStoryModalOpen(false);

    setNewStory({
      text: '',
      client: '',
      isAnonymous: false
    });
  };

  return (

    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-zinc-100 font-sans">

      {/* ALERT MODAL */}

      {isAlertModalOpen && (

        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">

          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">

            <div className="flex justify-between mb-4">

              <h3 className="font-bold text-lg">
                Krijo Alarm
              </h3>

              <button onClick={() => setIsAlertModalOpen(false)}>
                <X />
              </button>

            </div>

            <input
              placeholder="Qyteti..."
              className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700"
              value={alertData.city}
              onChange={(e) =>
                setAlertData({
                  ...alertData,
                  city: onlyLetters(e.target.value)
                })
              }
            />

            <input
              placeholder="Çmimi maksimal..."
              type="number"
              min="0"
              className="w-full bg-black p-3 rounded-lg mb-4 border border-zinc-700"
              value={alertData.maxPrice}
              onChange={(e) =>
                setAlertData({
                  ...alertData,
                  maxPrice: e.target.value
                })
              }
            />

            <button
              className="w-full bg-white text-black py-3 rounded-lg font-bold"
              onClick={handleSaveAlert}
            >
              Ruaj Alarmin
            </button>

          </div>

        </div>
      )}

      {/* STORY MODAL */}

      {isStoryModalOpen && (

        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">

          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">

            <div className="flex justify-between mb-4">

              <h3 className="font-bold text-lg">
                Shto Historinë
              </h3>

              <button onClick={() => setIsStoryModalOpen(false)}>
                <X />
              </button>

            </div>

            <textarea
              placeholder="Shkruaj historinë..."
              className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 h-32"
              onChange={(e) =>
                setNewStory({
                  ...newStory,
                  text: e.target.value
                })
              }
            />

            <input
              placeholder="Emri yt..."
              disabled={newStory.isAnonymous}
              className="w-full bg-black p-3 rounded-lg mb-3 border border-zinc-700 disabled:opacity-30"
              value={newStory.client}
              onChange={(e) =>
                setNewStory({
                  ...newStory,
                  client: onlyLetters(e.target.value)
                })
              }
            />

            <label className="flex items-center gap-2 mb-4 text-sm">

              <input
                type="checkbox"
                onChange={(e) =>
                  setNewStory({
                    ...newStory,
                    isAnonymous: e.target.checked
                  })
                }
              />

              Dërgoje si Anonim

            </label>

            <button
              className="w-full bg-white text-black py-2 rounded-lg font-bold"
              onClick={handleSaveStory}
            >
              Publiko
            </button>

          </div>

        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-10 pb-24">

        {/* BACK */}

        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-all font-bold uppercase tracking-widest text-sm"
        >
          ← KTHEHU NË FAQEN KRYESORE
        </button>

        {/* NOTIFICATIONS */}

        {showNotification && (

          <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium">

            <CheckCircle size={18} />

            <span>
              Ndryshimet në profil u ruajtën me sukses ✨
            </span>

          </div>
        )}

        {removedNotification && (

          <div className="fixed top-20 right-5 z-50 bg-red-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium">

            <span>
              Prona u hoq nga të preferuarat 💔
            </span>

          </div>
        )}

        {/* HEADER */}

        <div className="mb-10 text-center">

          <h1 className="text-4xl font-black text-white mb-3">
            Profili Im 👤
          </h1>

          <p className="text-zinc-500 text-base">
            Menaxho profilin dhe pronat e preferuara
          </p>

        </div>

        {/* MENU */}

        <div className="flex flex-wrap justify-center gap-4 mb-14">

          <button
            onClick={() => setActiveSection("profile")}
            className={`px-5 py-3 rounded-xl font-bold transition ${
              activeSection === "profile"
                ? "bg-white text-black"
                : "bg-zinc-900 text-white border border-zinc-800"
            }`}
          >
            Profili
          </button>

          <button
            onClick={() => setActiveSection("favorites")}
            className={`px-5 py-3 rounded-xl font-bold transition ${
              activeSection === "favorites"
                ? "bg-white text-black"
                : "bg-zinc-900 text-white border border-zinc-800"
            }`}
          >
            Favoritet
          </button>

          <button
            onClick={() => setActiveSection("stories")}
            className={`px-5 py-3 rounded-xl font-bold transition ${
              activeSection === "stories"
                ? "bg-white text-black"
                : "bg-zinc-900 text-white border border-zinc-800"
            }`}
          >
            Historitë
          </button>

          <button
            onClick={() => setActiveSection("rating")}
            className={`px-5 py-3 rounded-xl font-bold transition ${
              activeSection === "rating"
                ? "bg-white text-black"
                : "bg-zinc-900 text-white border border-zinc-800"
            }`}
          >
            Vlerësimi
          </button>

        </div>

        {/* PROFILE */}

        {activeSection === "profile" && (

          <div className="max-w-5xl mx-auto mb-20">

            <div className="flex items-center gap-3 mb-5">

              <User className="text-white" size={22} />

              <h2 className="text-xl font-bold text-white">
                Menaxhimi i Profilit
              </h2>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* PROFILE FORM */}

              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">

                <div className="flex items-center gap-4 mb-5 pb-5 border-b border-zinc-800">

                  <div className="w-14 h-14 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center text-white font-bold text-lg">
                    U
                  </div>

                  <div>

                    <h3 className="text-base font-bold text-white">
                      Përdorues Premium
                    </h3>

                    <p className="text-xs text-zinc-500">
                      Anëtar i platformës Find Home
                    </p>

                  </div>

                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">

                  {/* EMER MBIEMER */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Emri
                      </label>

                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) =>
                          setFirstName(onlyLetters(e.target.value))
                        }
                        className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white"
                      />

                    </div>

                    <div>

                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Mbiemri
                      </label>

                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) =>
                          setLastName(onlyLetters(e.target.value))
                        }
                        className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white"
                      />

                    </div>

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Email
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white"
                    />

                  </div>

                  {/* PHONE */}

                  <div>

                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Numri i Telefonit
                    </label>

                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white"
                    />

                  </div>

                  {/* ADDRESS */}

                  <div>

                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Adresa Banimi
                    </label>

                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white"
                    />

                  </div>

                  <button
                    type="submit"
                    className="bg-white hover:bg-zinc-200 text-black font-bold py-3 px-6 rounded-xl text-sm transition"
                  >
                    Ruaj Ndryshimet ✨
                  </button>

                </form>

              </div>

              {/* SIDE CARDS */}

              <div className="space-y-4">

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">

                  <div>

                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      Pronat
                    </p>

                    <p className="text-2xl font-black text-white">
                      {favorites.length}
                    </p>

                  </div>

                  <div className="bg-zinc-800 p-3 rounded-xl">
                    <Heart size={18} className="text-white fill-white" />
                  </div>

                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">

                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Verifikimi
                  </p>

                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <Shield size={15} />
                    Verifikuar
                  </p>

                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">

                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Regjistruar
                  </p>

                  <p className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                    <Calendar size={15} />
                    Maj, 2026
                  </p>

                </div>

                {/* ALERT */}

                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">

                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2">

                    <Bell size={16} />

                    Alarmi

                  </h2>

                  <button
                    onClick={() => setIsAlertModalOpen(true)}
                    className="w-full border border-zinc-700 py-3 rounded-xl hover:bg-zinc-800 transition"
                  >
                    Krijo Alarm të Ri +
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* FAVORITES */}

        {activeSection === "favorites" && (

          <div className="max-w-7xl mx-auto mt-8">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-800">

              <div className="flex items-center gap-3">

                <Heart
                  className="text-red-500 fill-red-500"
                  size={22}
                />

                <h2 className="text-2xl font-bold text-white">
                  Pronat e mia të preferuara
                </h2>

              </div>

              <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">

                <Building size={13} />

                Total: {favorites.length}

              </span>

            </div>

            {favorites.length === 0 ? (

              <div className="bg-zinc-900 border border-zinc-800 border-dashed p-14 rounded-2xl text-center text-zinc-500 font-medium">
                Nuk keni asnjë pronë të ruajtur.
              </div>

            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {favorites.map((property) => (

                  <div
                    key={property.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition duration-300 shadow-xl flex flex-col"
                  >

                    <div className="relative h-52 overflow-hidden">

                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />

                      <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-zinc-200 border border-zinc-800">

                        <MapPin size={12} />

                        {property.location}

                      </span>

                      {/* RED HEART */}

                      <button
                        onClick={() =>
                          handleRemoveFavorite(property.id)
                        }
                        className="absolute top-3 right-3 bg-red-500/20 hover:bg-red-500/30 p-2 rounded-xl border border-red-500/30 transition hover:scale-110"
                      >

                        <Heart
                          size={15}
                          className="text-red-500 fill-red-500"
                        />

                      </button>

                    </div>

                    <div className="p-5 flex flex-col flex-1 justify-between">

                      <div>

                        <h3 className="text-base font-bold text-white mb-3">
                          {property.title}
                        </h3>

                        <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">

                          <p className="text-base font-black text-emerald-400">
                            €{property.price}
                          </p>

                        </div>

                      </div>

                      <button
                        onClick={() =>
                          handleRemoveFavorite(property.id)
                        }
                        className="w-full mt-5 bg-black hover:bg-red-950/30 border border-zinc-800 hover:border-red-900/40 text-zinc-400 hover:text-red-400 py-3 rounded-xl text-sm font-semibold transition duration-300 flex items-center justify-center gap-2"
                      >

                        <Trash2 size={15} />

                        Hiq nga të Preferuarat

                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>
        )}

        {/* STORIES */}

        {activeSection === "stories" && (

          <div className="max-w-5xl mx-auto mt-20 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-xl font-bold flex items-center gap-2">

                <MessageSquare />

                Historitë

              </h2>

              <button
                onClick={() => setIsStoryModalOpen(true)}
                className="text-emerald-400 text-sm flex items-center gap-1"
              >

                <PlusCircle size={16} />

                Shto tënden

              </button>

            </div>

            {testimonials.map((t) => (

              <div
                key={t.id}
                className="p-4 bg-black rounded-xl border border-zinc-800 mb-3"
              >

                <p className="italic text-zinc-400">
                  "{t.text}"
                </p>

                <span className="text-sm font-bold text-emerald-400">
                  - {t.client}
                </span>

              </div>

            ))}

          </div>
        )}

        {/* RATING */}

        {activeSection === "rating" && (

          <div className="max-w-5xl mx-auto mt-20 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">

            <h2 className="text-xl font-bold text-white mb-6">
              Vlerëso Agjentin
            </h2>

            <form
              onSubmit={handleSubmitRating}
              className="space-y-6"
            >

              {/* NAME */}

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-2">Emri i Agjentit</label>
                    <input 
                      type="text" 
                      value={agentName} 
                      onChange={(e) => setAgentName(onlyLetters(e.target.value))} 
                      placeholder="Emri i Agjentit..." 
                      className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-300 mb-2">Emri juaj (opsionale)</label>
                    <input
                      type="text"
                      value={ratingName}
                      onChange={(e) =>
                        setRatingName(
                          onlyLetters(e.target.value)
                        )
                      }
                      placeholder="Shkruaj emrin..."
                      className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white"
                    />
                  </div>
              </div>

              {/* STARS */}

              <div className="flex gap-2">

                {[1, 2, 3, 4, 5].map((star) => (

                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setRating(
                        rating === star
                          ? star - 1
                          : star
                      )
                    }
                    className="focus:outline-none transition-transform active:scale-95"
                  >

                    <Star
                      size={36}
                      className={`${
                        star <= rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-zinc-700"
                      } transition-colors`}
                    />

                  </button>
                ))}

              </div>

              {/* COMMENT */}

              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
                placeholder="Shkruaj përshtypjen..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white h-32 resize-none"
              />

              <button
                type="submit"
                className="bg-white hover:bg-zinc-200 text-black font-bold py-3 px-8 rounded-xl text-sm transition"
              >
                Dërgo Vlerësimin
              </button>

            </form>

          </div>
        )}

      </div>

    </div>
  );
}