'use client';

import RatingStars from './RatingStars';

interface TripRatingsListProps {
  ratings: Array<{
    id: string;
    rating: number;
    comment?: string;
    username: string;
    avatar_url?: string;
    created_at: string;
  }>;
}

export default function TripRatingsList({ ratings }: TripRatingsListProps) {
  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-12 text-[#BFC9D1]">
        <span className="text-4xl block mb-3">⭐</span>
        <p className="font-semibold">ยังไม่มีคะแนนรีวิว</p>
        <p className="text-sm mt-1">เป็นคนแรกที่ให้คะแนนทริปนี้!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ratings.map((rating, index) => (
        <div
          key={rating.id}
          className="bg-white rounded-lg p-4 shadow-sm border border-[#BFC9D1]/20 hover:shadow-md hover:border-[#FF9B51]/20 transition-all animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            {rating.avatar_url ? (
              <img
                src={rating.avatar_url}
                alt={rating.username}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#e8893f] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {rating.username.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-[#25343F] text-sm">{rating.username}</p>
                <RatingStars rating={rating.rating} size="sm" />
              </div>
              {rating.comment && (
                <p className="text-sm text-[#25343F]/80 leading-relaxed mb-2">
                  {rating.comment}
                </p>
              )}
              <p className="text-xs text-[#25343F]/40 font-medium">
                {new Date(rating.created_at).toLocaleDateString('th-TH', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
