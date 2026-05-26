import React from 'react';
import { Star } from 'lucide-react';

export default function UserRating({
  agentName, setAgentName,
  ratingName, setRatingName,
  rating, setRating,
  comment, setComment,
  onlyLetters,
  handleSubmitRating
}) {
  return (
    <div className="max-w-5xl mx-auto mt-20 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6">Vlerëso Agjentin</h2>

      <form onSubmit={handleSubmitRating} className="space-y-6">
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
              onChange={(e) => setRatingName(onlyLetters(e.target.value))}
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
              onClick={() => setRating(rating === star ? star - 1 : star)}
              className="focus:outline-none transition-transform active:scale-95"
            >
              <Star
                size={36}
                className={`${
                  star <= rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-700"
                } transition-colors`}
              />
            </button>
          ))}
        </div>

        {/* COMMENT */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
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
  );
}