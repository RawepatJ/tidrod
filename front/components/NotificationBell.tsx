'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, UserPlus, XCircle, Flag, MapPin, Eye, X } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, respondJoinRequest } from '@/lib/api';
import { useSession } from './SessionProvider';
import Link from 'next/link';
import { useToast } from './Toast';

const ICON_MAP: Record<string, React.ReactNode> = {
    join_request: <UserPlus size={16} className="text-blue-500" />,
    join_approved: <Check size={16} className="text-green-500" />,
    join_denied: <XCircle size={16} className="text-red-500" />,
    trip_ended: <Flag size={16} className="text-orange-500" />,
    default: <MapPin size={16} className="text-[#FF9B51]" />,
};

export default function NotificationBell() {
    const { user } = useSession();
    const { addToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const handleJoinResponse = async (e: React.MouseEvent, n: any, status: 'approved' | 'denied') => {
        e.stopPropagation();
        if (!n.related_trip_id || !n.related_join_request_id) return;

        setActionLoading(n.id);
        try {
            await respondJoinRequest(n.related_trip_id, n.related_join_request_id, status);
            addToast(`Successfully ${status} join request`, 'success');
            if (!n.is_read) handleMarkRead(n.id);
            // Optionally remove from list or update UI
            setNotifications(prev => prev.filter(item => item.id !== n.id));
        } catch (err: any) {
            addToast(err.message || 'Failed to respond to request', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const data = await getUnreadNotificationCount();
            setUnreadCount(data.count);
        } catch {
            // silent
        }
    }, [user]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getNotifications(1);
            setNotifications(data.notifications || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Poll unread count every 15 seconds
    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 15000);
        return () => clearInterval(interval);
    }, [user, fetchUnreadCount]);

    // Load notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch {
            // silent
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationRead(id);
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch {
            // silent
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (!user) return null;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-[#25343F]/60 hover:text-[#FF9B51] transition-colors rounded-lg hover:bg-[#FF9B51]/5"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#BFC9D1]/30 z-50 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#BFC9D1]/20 bg-[#F8FAFC]">
                        <h3 className="font-bold text-[#25343F] text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-[#FF9B51] hover:text-[#e8893f] font-medium flex items-center gap-1 transition-colors"
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="w-6 h-6 border-2 border-[#FF9B51] border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-[#BFC9D1]">
                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => {
                                        if (!n.is_read) handleMarkRead(n.id);
                                    }}
                                    className={`flex items-start gap-3 px-4 py-3 border-b border-[#BFC9D1]/10 cursor-pointer hover:bg-[#F8FAFC] transition-colors ${!n.is_read ? 'bg-[#FF9B51]/5' : ''
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-[#EAEFEF] flex items-center justify-center">
                                        {ICON_MAP[n.type] || ICON_MAP.default}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!n.is_read ? 'font-semibold text-[#25343F]' : 'text-[#25343F]/80'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-[#25343F]/50 mt-0.5 line-clamp-2">
                                            {n.message}
                                        </p>

                                        {/* Quick Actions */}
                                        <div className="mt-2 flex items-center gap-2">
                                            {n.type === 'join_request' && n.related_join_request_id && (
                                                <>
                                                    <button
                                                        onClick={(e) => handleJoinResponse(e, n, 'approved')}
                                                        disabled={!!actionLoading}
                                                        className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                                                    >
                                                        <Check size={10} />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleJoinResponse(e, n, 'denied')}
                                                        disabled={!!actionLoading}
                                                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                                                    >
                                                        <X size={10} />
                                                        Decline
                                                    </button>
                                                </>
                                            )}
                                            {n.related_trip_id && (
                                                <Link
                                                    href={`/trip/${n.related_trip_id}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsOpen(false);
                                                        if (!n.is_read) handleMarkRead(n.id);
                                                    }}
                                                    className="px-2 py-1 bg-[#25343F]/5 hover:bg-[#25343F]/10 text-[#25343F] rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                                                >
                                                    <Eye size={10} />
                                                    View Trip
                                                </Link>
                                            )}
                                        </div>

                                        <p className="text-[10px] text-[#BFC9D1] mt-1">
                                            {getTimeAgo(n.created_at)}
                                        </p>
                                    </div>
                                    {!n.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-[#FF9B51] flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-[#BFC9D1]/20 bg-[#F8FAFC]">
                            <Link
                                href="/notifications"
                                className="text-xs text-[#FF9B51] hover:text-[#e8893f] font-medium block text-center transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
