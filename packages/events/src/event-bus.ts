import type { EventName, EventPayload } from './types';

type Listener<T extends EventName> = (payload: EventPayload<T>) => void;

type EmitArgs<T extends EventName> = EventPayload<T> extends undefined ? [] : [EventPayload<T>];

class TypedEventBus {
  private listeners = new Map<EventName, Set<Listener<EventName>>>();

  on<T extends EventName>(event: T, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.add(listener as Listener<EventName>);
    }

    return () => {
      eventListeners?.delete(listener as Listener<EventName>);
    };
  }

  off<T extends EventName>(event: T, listener: Listener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as Listener<EventName>);
    }
  }

  emit<T extends EventName>(event: T, ...args: EmitArgs<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(args[0] as EventPayload<EventName>);
      }
    }
  }

  once<T extends EventName>(event: T, listener: Listener<T>): () => void {
    const unsubscribe = this.on(event, ((payload: EventPayload<T>) => {
      unsubscribe();
      listener(payload);
    }) as Listener<T>);
    return unsubscribe;
  }

  clear(): void {
    this.listeners.clear();
  }
}

declare global {
  interface Window {
    __CINEPULSE_EVENT_BUS__?: TypedEventBus;
  }
}

function getEventBus(): TypedEventBus {
  if (typeof window === 'undefined') {
    return new TypedEventBus();
  }

  if (!window.__CINEPULSE_EVENT_BUS__) {
    window.__CINEPULSE_EVENT_BUS__ = new TypedEventBus();
  }

  return window.__CINEPULSE_EVENT_BUS__;
}

export const eventBus = getEventBus();

export function createTypedEmitter<T extends EventName>(event: T) {
  return (...args: EmitArgs<T>): void => {
    eventBus.emit(event, ...args);
  };
}

export function createTypedListener<T extends EventName>(event: T) {
  return (listener: Listener<T>): (() => void) => {
    return eventBus.on(event, listener);
  };
}
