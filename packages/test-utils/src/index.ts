/// <reference types="@testing-library/jest-dom/vitest" />

export { screen, waitFor, within } from '@testing-library/react';
export { expectNoA11yViolations } from './axe';
export { buildMovie, buildPaginated } from './factories/movie';
export { buildTv } from './factories/tv';
export { handlers } from './msw/handlers';
export { server } from './msw/server';
export type { RenderWithProvidersOptions } from './render';
export { createTestQueryClient, renderWithProviders } from './render';
