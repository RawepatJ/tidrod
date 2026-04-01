const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
console.log(API_URL);
interface FetchOptions extends RequestInit {
    token?: string;
}

async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(fetchOptions.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
}

export async function fetchAuth<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const token = getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch<T>(endpoint, { ...options, token });
}

// --- Auth ---
export async function registerUser(username: string, email: string, password: string, gender: string) {
    return apiFetch<{ user: any; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, gender }),
    });
}

export async function loginUser(email: string, password: string) {
    return apiFetch<{ user: any; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

// --- Trips ---
export async function getTrips(page = 1, limit = 20) {
    return apiFetch<{ trips: any[]; pagination: any }>(`/api/trips?page=${page}&limit=${limit}`);
}

export async function getTrip(id: string) {
    return apiFetch<any>(`/api/trips/${id}`);
}

export async function searchTrips(query: string) {
    return apiFetch<{ trips: any[] }>(`/api/trips/search?q=${encodeURIComponent(query)}`);
}

export async function createTrip(
    data: { title: string; description: string; latitude: number; longitude: number; ladiesOnly?: boolean; privacy?: string; maxMembers?: number },
    photos: File[],
    token: string
) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('latitude', String(data.latitude));
    formData.append('longitude', String(data.longitude));
    formData.append('ladiesOnly', String(!!data.ladiesOnly));
    formData.append('privacy', data.privacy || 'open');
    if (data.maxMembers) {
        formData.append('maxMembers', String(data.maxMembers));
    }
    photos.forEach((photo) => formData.append('photos', photo));

    return apiFetch<any>('/api/trips', {
        method: 'POST',
        body: formData,
        token,
    });
}

export async function deleteTrip(id: string, token: string) {
    return apiFetch<{ message: string }>(`/api/trips/${id}`, {
        method: 'DELETE',
        token,
    });
}

export async function endTrip(tripId: string) {
    return fetchAuth<{ message: string }>(`/api/trips/${tripId}/end`, {
        method: 'POST',
    });
}

export async function leaveTrip(tripId: string) {
    return fetchAuth<{ message: string }>(`/api/trips/${tripId}/leave`, {
        method: 'POST',
    });
}

export async function updateTripStatus(tripId: string, status: string) {
    return fetchAuth<{ message: string }>(`/api/trips/${tripId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

// --- Trip Join ---
export async function joinTrip(tripId: string) {
    return fetchAuth<{ message: string; status: string }>(`/api/trips/${tripId}/join`, {
        method: 'POST',
    });
}

export async function getJoinRequests(tripId: string) {
    return fetchAuth<{ requests: any[] }>(`/api/trips/${tripId}/join-requests`);
}

export async function respondJoinRequest(tripId: string, requestId: string, status: 'approved' | 'denied') {
    return fetchAuth<{ message: string }>(`/api/trips/${tripId}/join-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function getTripMembers(tripId: string) {
    return apiFetch<{ members: any[] }>(`/api/trips/${tripId}/members`);
}

// --- Markers ---
export async function getMarkers(bbox: { west: number; south: number; east: number; north: number }) {
    const bboxStr = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
    return apiFetch<any[]>(`/api/markers?bbox=${bboxStr}`);
}

// --- Messages ---
export async function getMessages(tripId: string, page = 1) {
    return apiFetch<any[]>(`/api/trips/${tripId}/messages?page=${page}`);
}

// --- Reports ---
export async function submitReport(data: { targetType: string; targetId: string; reason: string; description?: string }, token: string) {
    return apiFetch<any>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data),
        token,
    });
}

// --- User Profile ---
export async function fetchMe() {
    return fetchAuth<{ user: any; trips: any[] }>('/api/users/me');
}

export async function updateUserProfile(data: { username: string; bio: string; avatar_url?: string }, token: string) {
    return apiFetch<{ user: any; message: string }>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
        token,
    });
}

export async function getUserRating(userId: string) {
    return apiFetch<{ user_id: string; total_ratings: number; average_rating: number }>(`/api/users/${userId}/rating`);
}

// --- Trip Ratings ---
export async function getTripRating(tripId: string) {
    return apiFetch<{ trip_id: string; total_ratings: number; average_rating: number }>(`/api/trips/${tripId}/rating`);
}

export async function getTripRatings(tripId: string) {
    return apiFetch<{ ratings: any[] }>(`/api/trips/${tripId}/ratings`);
}

export async function rateTrip(tripId: string, rating: number, comment: string, token: string) {
    return apiFetch<{ message: string; rating: any }>(`/api/trips/${tripId}/rating`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
        token,
    });
}

// --- Notifications ---
export async function getNotifications(page = 1) {
    return fetchAuth<{ notifications: any[]; pagination: any }>(`/api/notifications?page=${page}`);
}

export async function getUnreadNotificationCount() {
    return fetchAuth<{ count: number }>('/api/notifications/unread-count');
}

export async function markNotificationRead(id: string) {
    return fetchAuth<{ message: string }>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
    });
}

export async function markAllNotificationsRead() {
    return fetchAuth<{ message: string }>('/api/notifications/read-all', {
        method: 'POST',
    });
}

// --- Admin ---
export async function adminUpdateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
    return fetchAuth<{ message: string; user: any }>(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

// --- Token helpers ---
export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tidrod_token');
}

export function setToken(token: string): void {
    localStorage.setItem('tidrod_token', token);
}

export function removeToken(): void {
    localStorage.removeItem('tidrod_token');
}

export function getUser(): { id: string; email: string; username: string; role: string; gender?: string; email_verified: boolean } | null {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { 
            id: payload.id, 
            email: payload.email, 
            username: payload.username, 
            role: payload.role, 
            gender: payload.gender,
            email_verified: !!payload.email_verified
        };
    } catch {
        return null;
    }
}
