// Locations module types
export interface Location {
  country_code: string;
  city_code: string; // "#" for countries, actual city code for cities
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Country extends Location {
  city_code: '#';
}

export interface City extends Location {
  city_code: string; // Non-"#" string
}

