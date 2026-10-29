import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTypedEmitter, createTypedListener, eventBus } from '../event-bus';
import type { NotificationPayload } from '../types';

const NOTIFICATION: NotificationPayload = { type: 'error', message: 'Something went wrong' };

afterEach(() => {
  eventBus.clear();
});

describe('eventBus', () => {
  it('delivers the payload to every listener of the event', () => {
    const first = vi.fn();
    const second = vi.fn();
    eventBus.on('notification:show', first);
    eventBus.on('notification:show', second);

    eventBus.emit('notification:show', NOTIFICATION);

    expect(first).toHaveBeenCalledWith(NOTIFICATION);
    expect(second).toHaveBeenCalledWith(NOTIFICATION);
  });

  it('does not call listeners of other events', () => {
    const listener = vi.fn();
    eventBus.on('error:report', listener);

    eventBus.emit('notification:show', NOTIFICATION);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling a listener after off()', () => {
    const listener = vi.fn();
    eventBus.on('notification:show', listener);

    eventBus.off('notification:show', listener);
    eventBus.emit('notification:show', NOTIFICATION);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling a listener after the unsubscribe returned by on()', () => {
    const listener = vi.fn();
    const unsubscribe = eventBus.on('notification:show', listener);

    unsubscribe();
    eventBus.emit('notification:show', NOTIFICATION);

    expect(listener).not.toHaveBeenCalled();
  });

  it('calls a once() listener a single time', () => {
    const listener = vi.fn();
    eventBus.once('notification:show', listener);

    eventBus.emit('notification:show', NOTIFICATION);
    eventBus.emit('notification:show', NOTIFICATION);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('cancels a once() listener before it fires', () => {
    const listener = vi.fn();
    const unsubscribe = eventBus.once('notification:show', listener);

    unsubscribe();
    eventBus.emit('notification:show', NOTIFICATION);

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not call a listener added while emitting in the same round', () => {
    const late = vi.fn();
    eventBus.on('notification:show', () => {
      eventBus.on('notification:show', late);
    });

    eventBus.emit('notification:show', NOTIFICATION);

    expect(late).not.toHaveBeenCalled();
  });

  it('emits without listeners', () => {
    expect(() => eventBus.emit('notification:show', NOTIFICATION)).not.toThrow();
  });
});

describe('createTypedEmitter / createTypedListener', () => {
  it('bind an emitter and a listener to one event', () => {
    const emitReport = createTypedEmitter('error:report');
    const onReport = createTypedListener('error:report');
    const listener = vi.fn();
    const error = new Error('boom');

    const unsubscribe = onReport(listener);
    emitReport({ error, source: 'query' });
    unsubscribe();
    emitReport({ error, source: 'query' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ error, source: 'query' });
  });
});
