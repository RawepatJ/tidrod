'use client';

import { useState } from 'react';
import { rateTrip } from '@/lib/api';
import RatingStars from './RatingStars';

interface RateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripTitle: string;
  token: string;
  onSuccess: () => void;
}

export default function RateTripModal({
  isOpen,
  onClose,
  tripId,
  tripTitle,
  token,
  onSuccess,
}: RateTripModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | undefined>();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ratingLabels = {
    1: '😞 Poor',
    2: '😐 Fair',
    3: '😊 Good',
    4: '😄 Very Good',
    5: '😍 Excellent',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await rateTrip(tripId, rating, comment, token);
      onSuccess();
      onClose();
      setRating(0);
      setComment('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save rating';
      console.error('Rating error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#BFC9D1]/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF9B51]/10 to-[#FF9B51]/5 border-b border-[#BFC9D1]/20 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#25343F]">Rate This Trip</h2>
              <p className="text-xs text-[#25343F]/60 mt-1">Share your experience</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#25343F]/50 hover:text-[#25343F] text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium animate-fade-in">
                {error}
              </div>
            )}

            {/* Trip Title */}
            <div className="bg-[#EAEFEF]/50 rounded-lg p-4 border border-[#BFC9D1]/20">
              <p className="text-xs text-[#25343F]/60 font-semibold uppercase tracking-wider mb-1">Trip</p>
              <p className="text-[#25343F] font-semibold line-clamp-2">{tripTitle}</p>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-[#25343F] mb-4">
                Your Rating
              </label>
              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(undefined)}
                    className={`w-12 h-12 text-3xl transition-all duration-150 ${
                      star <= (hoveredRating ?? rating)
                        ? 'text-[#FF9B51] scale-110 drop-shadow-lg'
                        : 'text-[#BFC9D1] scale-100'
                    } hover:scale-125`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center font-semibold text-[#25343F] mb-1">
                  {ratingLabels[rating as keyof typeof ratingLabels]}
                </p>
              )}
              <p className="text-center text-xs text-[#25343F]/50">
                {rating > 0 ? `You're about to give ${rating} star${rating !== 1 ? 's' : ''}` : 'Select a rating'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-semibold text-[#25343F] mb-2">
                Add a Comment
                <span className="text-xs text-[#25343F]/50 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share what you loved about this trip... (or didn't!)"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 border border-[#BFC9D1]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51] text-[#25343F] resize-none placeholder:text-[#BFC9D1] transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-[#25343F]/40">
                  {comment.length}/200
                </p>
                {comment.length > 180 && (
                  <p className="text-xs text-[#FF9B51] font-medium">
                    {200 - comment.length} characters left
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-[#EAEFEF] hover:bg-[#BFC9D1]/30 text-[#25343F] rounded-lg font-semibold transition-all hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex-1 px-4 py-3 bg-[#FF9B51] hover:bg-[#e8893f] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Submitting...
                  </>
                ) : (
                  `Submit Rating ${rating > 0 ? `(${rating}⭐)` : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
