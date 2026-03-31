'use client';

import { useState, useRef } from 'react';
import { updateUserProfile } from '@/lib/api';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar_url?: string;
  };
  token: string;
  onSuccess: () => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  user,
  token,
  onSuccess,
}: ProfileEditModalProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image if too large
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas and compress
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Reduce size if too large
          if (width > 400) {
            height = Math.round((height * 400) / width);
            width = 400;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to 80% quality
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setAvatarPreview(compressedDataUrl);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      console.log('Updating profile to:', `${API_URL}/api/users/me`);

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio.trim(),
          avatar_url: avatarPreview || null,
        }),
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Profile updated successfully:', data);
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      console.error('Profile update error:', err);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#BFC9D1]/20">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-[#BFC9D1]/20 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#25343F]">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-[#25343F]/50 hover:text-[#25343F] text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-[#BFC9D1]/20">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#e8893f] text-white flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  username.charAt(0).toUpperCase()
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#EAEFEF] hover:bg-[#BFC9D1]/30 text-[#25343F] rounded-lg text-sm font-semibold transition-colors"
              >
                Change Photo
              </button>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-[#25343F] mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="w-full px-4 py-2.5 border border-[#BFC9D1]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51] text-[#25343F]"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-[#25343F] mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 border border-[#BFC9D1]/30 rounded-lg bg-[#EAEFEF] text-[#25343F]/50 cursor-not-allowed"
              />
              <p className="text-xs text-[#25343F]/40 mt-1">Email cannot be changed</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-[#25343F] mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell something about yourself..."
                maxLength={150}
                rows={3}
                className="w-full px-4 py-2.5 border border-[#BFC9D1]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9B51]/50 focus:border-[#FF9B51] text-[#25343F] resize-none"
              />
              <p className="text-xs text-[#25343F]/40 mt-1">
                {bio.length}/150
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-[#EAEFEF] hover:bg-[#BFC9D1]/30 text-[#25343F] rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="flex-1 px-4 py-2.5 bg-[#FF9B51] hover:bg-[#e8893f] disabled:opacity-50 text-white rounded-lg font-semibold transition-colors shadow-md"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
