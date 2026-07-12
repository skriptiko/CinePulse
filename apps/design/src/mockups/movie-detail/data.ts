// Self-contained sample data so the mockup always renders without a network call.
// When porting to a real app, replace this with @repo/api hooks (see apps/pages-mfe).

export const featured = {
  title: 'Echoes of Tomorrow',
  description:
    'A disillusioned engineer discovers a signal from her own future, forcing her to choose between the life she has and the one she was meant to live.',
  rating: 'TV-MA',
  year: '2025',
  duration: '2h 14m',
  imageUrl: '/mockups/hero-backdrop.png',
};

export const relatedMovies = [
  {
    id: 1,
    title: 'Orbital',
    imageUrl: '/mockups/poster-1.png',
    year: '2024',
    rating: '8.7',
    duration: '1h 58m',
  },
  {
    id: 2,
    title: 'Rain City',
    imageUrl: '/mockups/poster-2.png',
    year: '2023',
    rating: '7.9',
    duration: '2h 05m',
  },
  {
    id: 3,
    title: 'The Long Ascent',
    imageUrl: '/mockups/poster-3.png',
    year: '2025',
    rating: '8.2',
    duration: '2h 21m',
  },
  {
    id: 4,
    title: 'Orbital II',
    imageUrl: '/mockups/poster-1.png',
    year: '2025',
    rating: '8.0',
    duration: '2h 09m',
  },
  {
    id: 5,
    title: 'Nightfall',
    imageUrl: '/mockups/poster-2.png',
    year: '2022',
    rating: '7.4',
    duration: '1h 47m',
  },
  {
    id: 6,
    title: 'Summit',
    imageUrl: '/mockups/poster-3.png',
    year: '2024',
    rating: '8.5',
    duration: '2h 33m',
  },
];

export const castList = ['Ava Moreno', 'Daniel Frost', 'Lena Park', 'Marcus Reid', 'Sofia Vance'];
