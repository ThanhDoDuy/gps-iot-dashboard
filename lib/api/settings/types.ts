// Settings module types
export interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    theme: 'light' | 'dark' | 'auto';
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
  notifications: {
    email: {
      enabled: boolean;
      smtpHost: string;
      smtpPort: number;
      smtpUser: string;
      smtpPassword: string;
      fromEmail: string;
    };
    sms: {
      enabled: boolean;
      provider: string;
      apiKey: string;
      fromNumber: string;
    };
    push: {
      enabled: boolean;
      firebaseConfig: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
      };
    };
  };
  integrations: {
    [key: string]: {
      enabled: boolean;
      config: Record<string, any>;
    };
  };
}

export interface UpdateSystemSettingsRequest {
  general?: Partial<SystemSettings['general']>;
  security?: Partial<SystemSettings['security']>;
  notifications?: Partial<SystemSettings['notifications']>;
  integrations?: Partial<SystemSettings['integrations']>;
}
