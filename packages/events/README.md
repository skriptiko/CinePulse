# @repo/events

The only channel between micro-frontends: a typed event bus and a shared Zustand store. Both are singletons on `window`, so every MFE sees the same instance.

## Public API

- **Events:** `createTypedEmitter`, `createTypedListener`, `eventBus`, `EventMap`.
- **Store:** `useGlobalStore(selector)` in React, `globalStore` outside it. It holds `theme`, `user` and `authStatus`.
- **Errors:** `serializeError` for payloads that leave the page.

```ts
import { createTypedEmitter, useGlobalStore } from '@repo/events';

const emitNotification = createTypedEmitter('notification:show');
const theme = useGlobalStore((state) => state.theme);
```

A selector must return a stable value; wrap one that builds an object in `useShallow`.

## Dependencies

`zustand` and `react` are peers. It depends on no other `@repo/*` package.
