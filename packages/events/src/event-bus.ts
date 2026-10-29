import type { EventName, EventPayload } from './types';

type Listener<T extends EventName> = (payload: EventPayload<T>) => void;

type Unsubscribe = () => void;

type EmitArgs<T extends EventName> = EventPayload<T> extends undefined ? [] : [EventPayload<T>];

export function createTypedEmitter<T extends EventName>(event: T): (...args: EmitArgs<T>) => void {
  return (...args) => {
    eventBus.emit(event, ...args);
  };
}

export function createTypedListener<T extends EventName>(
  event: T
): (listener: Listener<T>) => Unsubscribe {
  return (listener) => eventBus.on(event, listener);
}

declare global {
  interface Window {
    __CINEPULSE_EVENT_BUS__?: TypedEventBus;
  }
}

class TypedEventBus {
  private listeners = new Map<EventName, Set<Listener<EventName>>>();

  on<T extends EventName>(event: T, listener: Listener<T>): Unsubscribe {
    let eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(event, eventListeners);
    }
    eventListeners.add(listener as Listener<EventName>);

    return () => {
      this.off(event, listener);
    };
  }

  off<T extends EventName>(event: T, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener<EventName>);
  }

  once<T extends EventName>(event: T, listener: Listener<T>): Unsubscribe {
    const unsubscribe = this.on(event, (payload: EventPayload<T>) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  emit<T extends EventName>(event: T, ...args: EmitArgs<T>): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    // A copy: listeners added or removed while emitting do not affect this round.
    for (const listener of [...eventListeners]) {
      listener(args[0] as EventPayload<EventName>);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** One bus per page, shared by every MFE bundle through `window`. */
function getEventBus(): TypedEventBus {
  if (typeof window === 'undefined') {
    return new TypedEventBus();
  }

  window.__CINEPULSE_EVENT_BUS__ ??= new TypedEventBus();
  return window.__CINEPULSE_EVENT_BUS__;
}

// Last: the class above is not hoisted.
export const eventBus = getEventBus();
