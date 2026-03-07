export interface Stadium {
    id: number;
    slug: string;
    name_uz: string;
    name_ru: string;
    description_uz: string;
    description_ru: string;
    address_uz: string;
    address_ru: string;
    latitude: number;
    longitude: number;
    is_metro_near: boolean;
    metro_station: string;
    metro_distance: number;
    capacity: string;
    surface_type: string;
    roof_type: string;
    price_per_hour: number;
    discount_price_per_hour: number | null;
    phone: string[];
    main_image: string;
    images: string[];
}

export interface Tournament {
    id: number;
    title_uz: string;
    title_ru: string;
    description_uz: string;
    description_ru: string;
    stadium_id: number;
    start_time: string;
    end_time: string;
    entrance_fee: number;
    min_players_per_team: number;
    max_players_per_team: number;
    max_players_tournament: number;
    cover_image?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    registration_status?: string | null;
    stadium: Partial<Stadium>;
}

export interface TournamentRegistration {
    id: number;
    user_id: number;
    tournament_id: number;
    status: 'in_progress' | 'paid' | 'cancelled';
    paid_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    message?: string;
}

export interface ClubStatus {
    registered: boolean;
    paid: boolean;
    status: string | null;
    club_id: number | null;
    club_name: string | null;
    type: 'solo' | 'club' | null;
}

export interface Club {
    id: number;
    name: string;
    avatar_url?: string;
    tournament_id: number;
    creator_id: number;
    member_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    members?: ClubMember[];
}

export interface ClubMember {
    id: number;
    user_id: number;
    user_phone: string;
    user_fullname: string;
}

export interface ClubsResponse {
    clubs: Club[];
    solo_players: { user_id: number; user_phone: string; user_fullname: string }[];
}

const BASE_URL = 'https://stadio-backend-pythoon-production.up.railway.app/api/v1';

export const fetchStadiums = async (limit?: number): Promise<Stadium[]> => {
    const url = new URL(`${BASE_URL}/stadiums/`);
    if (limit) {
        url.searchParams.append('limit', limit.toString());
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const fetchStadiumById = async (id: string | number): Promise<Stadium> => {
    const response = await fetch(`${BASE_URL}/stadiums/${id}/`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const fetchTournaments = async (): Promise<Tournament[]> => {
    const token = localStorage.getItem('token');
    let stadiums: Stadium[] = [];
    try {
        const stadiumsResponse = await fetch(`${BASE_URL}/stadiums/`);
        if (stadiumsResponse.ok) {
            stadiums = await stadiumsResponse.json();
        }
    } catch (e) {
        console.warn("Failed to fetch stadiums for enrichment", e);
    }

    try {
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const tournamentsResponse = await fetch(`${BASE_URL}/client/tournaments/`, { headers });

        if (!tournamentsResponse.ok) {
            const errorText = await tournamentsResponse.text();
            console.error("Tournaments API error:", tournamentsResponse.status, errorText);
            throw new Error(`API Error: ${tournamentsResponse.status}`);
        }

        const data = await tournamentsResponse.json();
        const tournaments: Tournament[] = Array.isArray(data) ? data : (data.results || data.data || []);

        return tournaments.map(tournament => {
            const stadium = stadiums.find(s => s.id === tournament.stadium_id);
            return {
                ...tournament,
                stadium: stadium || {}
            };
        });

    } catch (error) {
        console.error("Tournaments API error:", error);
        throw error;
    }
};

export interface LegalDocument {
    title_uz: string;
    title_ru: string;
    content_uz: string;
    content_ru: string;
    updated_at: string;
}

export const fetchTerms = async (): Promise<LegalDocument> => {
    const response = await fetch(`${BASE_URL}/legal/terms`);
    if (!response.ok) throw new Error('Failed to fetch terms');
    return response.json();
};

export const fetchPrivacy = async (): Promise<LegalDocument> => {
    const response = await fetch(`${BASE_URL}/legal/privacy`);
    if (!response.ok) throw new Error('Failed to fetch privacy');
    return response.json();
};

export const sendOtp = async (phone: string) => {
    const response = await fetch(`${BASE_URL}/users/send-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
        throw new Error('Failed to send OTP');
    }

    return response.json();
};

export const verifyOtp = async (phone: string, otp_code: string) => {
    const response = await fetch(`${BASE_URL}/users/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp_code }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to verify OTP');
    }

    return response.json();
};

// Payment APIs
export interface PaymentOrder {
    order_id: number;
    amount: number;
    checkout_url?: string;
    payment_url?: string;
}

export interface PaymentStatus {
    order_id: number;
    status: 'pending' | 'paid' | 'cancelled';
    amount: number;
}

export const createPaymeOrder = async (token: string, data: { stadium_book_id?: number; tournament_registration_id?: number }): Promise<PaymentOrder> => {
    const response = await fetch(`${BASE_URL}/client/payme/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to create Payme order');
    }
    return response.json();
};

export const createClickOrder = async (token: string, data: { stadium_book_id?: number; tournament_registration_id?: number }): Promise<PaymentOrder> => {
    const response = await fetch(`${BASE_URL}/client/click/order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to create Click order');
    }
    return response.json();
};

export const checkPaymeStatus = async (token: string, orderId: number): Promise<PaymentStatus> => {
    const response = await fetch(`${BASE_URL}/client/payme/status/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to check Payme status');
    return response.json();
};

export const checkClickStatus = async (token: string, orderId: number): Promise<PaymentStatus> => {
    const response = await fetch(`${BASE_URL}/client/click/status/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to check Click status');
    return response.json();
};

export const getProfile = async (token: string, role: 'manager' | 'user') => {
    const endpoint = role === 'manager' ? 'managers' : 'users';
    const response = await fetch(`${BASE_URL}/${endpoint}/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }

    return response.json();
};

export const updateProfile = async (token: string, role: 'manager' | 'user', data: Record<string, unknown>) => {
    const endpoint = role === 'manager' ? 'managers' : 'users';
    const response = await fetch(`${BASE_URL}/${endpoint}/me`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error('Failed to update profile');
    }

    return response.json();
};

export const uploadAvatar = async (token: string, role: 'manager' | 'user', file: File) => {
    const endpoint = role === 'manager' ? 'managers' : 'users';

    // Note: Managers API currently doesn't document an avatar upload endpoint in the provided snippet,
    // but assuming it follows the User pattern or might be added later. 
    // If the API docs strictly say only Users have avatar upload, we should handle that.
    // Based on the provided docs, ONLY USERS have /me/avatar. 
    // But let's keep it generic if possible, or restrict if strictly followed.
    // The doc says "User Profile" -> Upload Avatar. "Manager Profile" -> Update Profile (name only).
    // So if role is manager, this might fail or not exist. I'll add a check or let the backend reject it.

    if (role === 'manager') {
        console.warn("Avatar upload might not be supported for managers based on current docs.");
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/${endpoint}/me/avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            // Explicitly do NOT set Content-Type here so browser sets it with boundary
        },
        body: formData
    });

    if (response.status === 401) {
        throw new Error('AVATAR_UPLOAD_UNAUTHORIZED');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload avatar'); // Return backend error message if available
    }

    return response.json();
};

export const deleteAccount = async (token: string, role: 'manager' | 'user') => {
    const endpoint = role === 'manager' ? 'managers' : 'users';
    const response = await fetch(`${BASE_URL}/${endpoint}/me`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error('Failed to delete account');
    }
};

// Booking Types & API

export interface Booking {
    id: number;
    stadium_id: number;
    user_id: number;
    is_recurring: boolean;
    day_of_week: number | null;
    date: string | null;
    hours: number[];
    price: number | null;
    status: 'in_progress' | 'paid_online' | 'partially_paid' | 'assigned_by_admin' | 'cancelled';
    payment_deadline: string | null;
    assigned_by_manager_id: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    stadium: Stadium;
}

export interface BookingAvailability {
    stadium_id: number;
    date?: string;
    day_of_week?: number;
    timetable_hours: number[];
    booked_hours: number[];
    available_hours: number[];
    discount_hours: number[];
    discount_price: number;
}

export interface CreateBookingRequest {
    stadium_id: number;
    is_recurring?: boolean;
    day_of_week?: number;
    date?: string;
    hours: number[];
}

export const fetchAvailability = async (token: string, stadiumId: number, date?: string, dayOfWeek?: number): Promise<BookingAvailability> => {
    if (!token) throw new Error("UNAUTHORIZED");

    const url = new URL(`${BASE_URL}/client/bookings/availability/${stadiumId}`);
    if (date) url.searchParams.append('booking_date', date);
    if (dayOfWeek !== undefined) url.searchParams.append('day_of_week', dayOfWeek.toString());

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to fetch availability');
    }

    return response.json();
};

export const createBooking = async (token: string, data: CreateBookingRequest): Promise<Booking> => {
    if (!token) throw new Error("UNAUTHORIZED");

    const response = await fetch(`${BASE_URL}/client/bookings/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to create booking');
    }

    return response.json();
};

export const fetchMyBookings = async (token: string, status?: string): Promise<Booking[]> => {
    if (!token) throw new Error("UNAUTHORIZED");

    const url = new URL(`${BASE_URL}/client/bookings/my`);
    if (status) url.searchParams.append('status_filter', status);

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error('Failed to fetch bookings');
    }

    return response.json();
};

export const fetchBookingById = async (token: string, id: number): Promise<Booking> => {
    if (!token) throw new Error("UNAUTHORIZED");

    const response = await fetch(`${BASE_URL}/client/bookings/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error('Failed to fetch booking');
    }

    return response.json();
};

export const cancelBooking = async (token: string, id: number): Promise<Booking> => {
    if (!token) throw new Error("UNAUTHORIZED");

    const response = await fetch(`${BASE_URL}/client/bookings/${id}/cancel`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to cancel booking');
    }

    return response.json();
};

export interface Media {
    id: number;
    title_uz: string;
    title_ru: string;
    content_uz: string;
    content_ru: string;
    youtube_video_link: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const fetchMedia = async (token: string, skip: number = 0, limit: number = 100): Promise<Media[]> => {
    if (!token) throw new Error("UNAUTHORIZED");

    const url = new URL(`${BASE_URL}/client/media/`);
    url.searchParams.append('skip', skip.toString());
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        throw new Error('Failed to fetch media');
    }

    return response.json();
};

// Tournament Registration & Clubs

export const fetchTournamentById = async (token: string, id: number): Promise<Tournament> => {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
    const response = await fetch(`${BASE_URL}/client/tournaments/${id}`, { headers });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to fetch tournament');
    }
    return response.json();
};

export const registerForTournament = async (token: string, tournamentId: number): Promise<TournamentRegistration> => {
    const response = await fetch(`${BASE_URL}/client/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to register');
    }
    return response.json();
};

export const fetchMyRegistrations = async (token: string, statusFilter?: string): Promise<TournamentRegistration[]> => {
    const url = new URL(`${BASE_URL}/client/tournaments/registrations`);
    if (statusFilter) url.searchParams.append('status_filter', statusFilter);
    const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch registrations');
    return response.json();
};

export const fetchClubs = async (token: string, tournamentId: number): Promise<ClubsResponse> => {
    const response = await fetch(`${BASE_URL}/client/clubs/?tournament_id=${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch clubs');
    return response.json();
};

export const fetchMyClubStatus = async (token: string, tournamentId: number): Promise<ClubStatus> => {
    const response = await fetch(`${BASE_URL}/client/clubs/my-status?tournament_id=${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch club status');
    return response.json();
};

export const createClub = async (token: string, data: { name: string; password: string; tournament_id: number; avatar_url?: string }): Promise<Club> => {
    const response = await fetch(`${BASE_URL}/client/clubs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to create club');
    }
    return response.json();
};

export const joinClub = async (token: string, clubId: number, password: string): Promise<Club> => {
    const response = await fetch(`${BASE_URL}/client/clubs/${clubId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to join club');
    }
    return response.json();
};

export const leaveClub = async (token: string, clubId: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/client/clubs/${clubId}/leave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to leave club');
    }
};

export const fetchClubDetail = async (token: string, clubId: number): Promise<Club> => {
    const response = await fetch(`${BASE_URL}/client/clubs/${clubId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch club');
    return response.json();
};
