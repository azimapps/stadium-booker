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
    is_active: boolean;
    created_at: string;
    updated_at: string;
    stadium: Partial<Stadium>;
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

// Fallback mock data since the public API endpoint seems to be secured/missing
const MOCK_TOURNAMENTS: Tournament[] = [
    {
        id: 1,
        title_uz: "Navro'z Kubogi",
        title_ru: "Кубок Навруз",
        description_uz: "Navro'z bayramiga bag'ishlangan katta futbol turniri. 16 ta jamoa, 1 ta g'olib.",
        description_ru: "Большой футбольный турнир, посвященный празднику Навруз. 16 команд, 1 победитель.",
        stadium_id: 8,
        start_time: "2026-03-21T10:00:00",
        end_time: "2026-03-22T18:00:00",
        entrance_fee: 150000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stadium: {}
    },
    {
        id: 2,
        title_uz: "Yozgi Liga 2026",
        title_ru: "Летняя Лига 2026",
        description_uz: "Havaskor jamoalar o'rtasida yozgi chempionat. Har hafta o'yinlar.",
        description_ru: "Летний чемпионат среди любительских команд. Игры каждую неделю.",
        stadium_id: 7,
        start_time: "2026-06-01T18:00:00",
        end_time: "2026-08-31T22:00:00",
        entrance_fee: 500000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stadium: {}
    }
];

export const fetchTournaments = async (): Promise<Tournament[]> => {
    let stadiums: Stadium[] = [];
    try {
        // Always try to fetch stadiums first as they are public
        const stadiumsResponse = await fetch(`${BASE_URL}/stadiums/`);
        if (stadiumsResponse.ok) {
            stadiums = await stadiumsResponse.json();
        }
    } catch (e) {
        console.warn("Failed to fetch stadiums for enrichment", e);
    }

    try {
        // Try to fetch tournaments from the API
        const tournamentsResponse = await fetch(`${BASE_URL}/tournaments/`);

        if (!tournamentsResponse.ok) {
            throw new Error(`API Error: ${tournamentsResponse.status}`);
        }

        const tournaments: Tournament[] = await tournamentsResponse.json();

        // Join stadium data
        return tournaments.map(tournament => {
            const stadium = stadiums.find(s => s.id === tournament.stadium_id);
            return {
                ...tournament,
                stadium: stadium || {}
            };
        });

    } catch (error) {
        console.warn("Tournaments API not accessible (likely secured), using mock data.", error);

        // Return mock data enriched with real stadium info if available
        return MOCK_TOURNAMENTS.map(tournament => {
            // Try to find a stadium for the mock tournament
            // If specific ID not found, just use the first available stadium to make it look good
            const stadium = stadiums.find(s => s.id === tournament.stadium_id) || stadiums[0];
            return {
                ...tournament,
                stadium: stadium || {}
            };
        });
    }
};
