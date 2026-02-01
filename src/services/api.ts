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
