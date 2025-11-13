import { apiClient } from '../client';
import { ApiResponse } from '../types';
import { Location, Country, City } from './types';

export interface CreateLocationRequest {
  country_code: string;
  city_code?: string; // Optional, use "#" for countries
  name: string;
  is_active?: boolean;
}

export interface UpdateLocationRequest {
  name?: string;
  is_active?: boolean;
}

export class LocationsApi {
  async getCountries(accessToken: string): Promise<ApiResponse<Country[]>> {
    return apiClient.authenticatedRequest<ApiResponse<Country[]>>('/locations/countries', accessToken);
  }

  async getCities(accessToken: string, countryCode: string): Promise<ApiResponse<City[]>> {
    return apiClient.authenticatedRequest<ApiResponse<City[]>>(
      `/locations/cities?countryCode=${countryCode}`,
      accessToken
    );
  }

  async getAllLocations(accessToken: string): Promise<ApiResponse<Location[]>> {
    return apiClient.authenticatedRequest<ApiResponse<Location[]>>('/locations', accessToken);
  }

  async getLocation(
    accessToken: string,
    countryCode: string,
    cityCode?: string
  ): Promise<ApiResponse<Location>> {
    const endpoint = cityCode
      ? `/locations/${countryCode}/${cityCode}`
      : `/locations/${countryCode}`;
    return apiClient.authenticatedRequest<ApiResponse<Location>>(endpoint, accessToken);
  }

  async createLocation(
    accessToken: string,
    data: CreateLocationRequest
  ): Promise<ApiResponse<Location>> {
    return apiClient.authenticatedRequest<ApiResponse<Location>>('/locations', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLocation(
    accessToken: string,
    countryCode: string,
    cityCode: string | undefined,
    data: UpdateLocationRequest
  ): Promise<ApiResponse<Location>> {
    const endpoint = cityCode
      ? `/locations/${countryCode}/${cityCode}`
      : `/locations/${countryCode}`;
    return apiClient.authenticatedRequest<ApiResponse<Location>>(endpoint, accessToken, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(
    accessToken: string,
    countryCode: string,
    cityCode?: string
  ): Promise<ApiResponse<void>> {
    const endpoint = cityCode
      ? `/locations/${countryCode}/${cityCode}`
      : `/locations/${countryCode}`;
    return apiClient.authenticatedRequest<ApiResponse<void>>(endpoint, accessToken, {
      method: 'DELETE',
    });
  }
}

export const locationsApi = new LocationsApi();

