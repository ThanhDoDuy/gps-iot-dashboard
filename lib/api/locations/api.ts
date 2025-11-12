import { apiClient } from '../client';
import { ApiResponse } from '../types';
import { Location, Country, City } from './types';

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
}

export const locationsApi = new LocationsApi();

