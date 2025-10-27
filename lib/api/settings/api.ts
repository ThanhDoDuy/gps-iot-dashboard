import { apiClient } from '../client';
import { 
  SystemSettings, 
  UpdateSystemSettingsRequest
} from './types';

export class SettingsApi {
  async getSystemSettings(accessToken: string): Promise<SystemSettings> {
    return apiClient.authenticatedRequest<SystemSettings>('/settings', accessToken);
  }

  async updateSystemSettings(
    accessToken: string, 
    settings: UpdateSystemSettingsRequest
  ): Promise<SystemSettings> {
    return apiClient.authenticatedRequest<SystemSettings>('/settings', accessToken, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateGeneralSettings(
    accessToken: string, 
    general: SystemSettings['general']
  ): Promise<SystemSettings> {
    return apiClient.authenticatedRequest<SystemSettings>('/settings/general', accessToken, {
      method: 'PATCH',
      body: JSON.stringify(general),
    });
  }

  async updateSecuritySettings(
    accessToken: string, 
    security: SystemSettings['security']
  ): Promise<SystemSettings> {
    return apiClient.authenticatedRequest<SystemSettings>('/settings/security', accessToken, {
      method: 'PATCH',
      body: JSON.stringify(security),
    });
  }

  async updateNotificationSettings(
    accessToken: string, 
    notifications: SystemSettings['notifications']
  ): Promise<SystemSettings> {
    return apiClient.authenticatedRequest<SystemSettings>('/settings/notifications', accessToken, {
      method: 'PATCH',
      body: JSON.stringify(notifications),
    });
  }

  async testEmailSettings(accessToken: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    return apiClient.authenticatedRequest<{ success: boolean; message: string }>(
      '/settings/test-email', 
      accessToken, 
      {
        method: 'POST',
        body: JSON.stringify({ testEmail }),
      }
    );
  }

  async testSmsSettings(accessToken: string, testPhone: string): Promise<{ success: boolean; message: string }> {
    return apiClient.authenticatedRequest<{ success: boolean; message: string }>(
      '/settings/test-sms', 
      accessToken, 
      {
        method: 'POST',
        body: JSON.stringify({ testPhone }),
      }
    );
  }

  async resetSettings(accessToken: string): Promise<SystemSettings> {
    return apiClient.authenticatedRequest<SystemSettings>('/settings/reset', accessToken, {
      method: 'POST',
    });
  }
}

export const settingsApi = new SettingsApi();
