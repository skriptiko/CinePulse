/** Domains an event name may start with; a new domain is added here first. */
export type EventDomain = 'notification' | 'mfe' | 'error' | 'user';

/** Every event is named `domain:action`. */
export type EventKey = `${EventDomain}:${string}`;

export type NotificationPayload = {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
};

/** Plain-data form of an error, safe to clone, log or send outside the page. */
export type SerializedError = {
  name: string;
  message: string;
};

export type MfeErrorPayload = {
  /** Remote name, e.g. `pagesMfe`. */
  name: string;
  error: SerializedError;
};

export type ErrorReportSource = 'boundary' | 'query' | 'mutation' | 'window' | 'auth';

export type ErrorReportPayload = {
  /** The original error: the host listener needs its type (`ApiError` kind) to filter reports. */
  error: unknown;
  source: ErrorReportSource;
};

/** The signed-in user, as the app sees it; the Firebase `User` stays in `@repo/firebase`. */
export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
};

export type UserLoginPayload = {
  user: AuthUser;
};

export type UserLogoutPayload = {
  uid: string;
};

export type EventMap = {
  'notification:show': NotificationPayload;
  'mfe:error': MfeErrorPayload;
  'error:report': ErrorReportPayload;
  'user:login': UserLoginPayload;
  'user:logout': UserLogoutPayload;
};

/** Compile-time check: fails when an `EventMap` key does not match `EventKey`. */
type EnsureEventKeys<T extends EventKey> = T;

export type EventName = EnsureEventKeys<keyof EventMap>;
export type EventPayload<T extends EventName> = EventMap[T];
