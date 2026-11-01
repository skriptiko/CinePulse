/// <reference types="@testing-library/jest-dom/vitest" />

export { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
export { expectNoA11yViolations } from './axe';
export { buildMovie, buildMovieDetails, buildPaginated } from './factories/movie';
export { buildTv, buildTvDetails } from './factories/tv';
export { handlers } from './msw/handlers';
export { server } from './msw/server';
export type { RenderWithProvidersOptions } from './render';
export { createTestQueryClient, renderWithProviders } from './render';
