export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface NavigationPayload {
  path: string;
  params?: Record<string, string>;
}

export interface NotificationPayload {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface EventMap {
  'user:login': UserProfile;
  'user:logout': undefined;
  'user:update': Partial<UserProfile>;
  'navigation:change': NavigationPayload;
  'notification:show': NotificationPayload;
  'mfe:ready': { name: string };
  'mfe:error': { name: string; error: Error };
}

export type EventName = keyof EventMap;
export type EventPayload<T extends EventName> = EventMap[T];
