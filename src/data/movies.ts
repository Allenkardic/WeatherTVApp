import moviesData from '../assets/movies.json';
import type { IMovie } from '../components';

export const movies = moviesData as IMovie[];

export function findMovie(movieId: string) {
  return movies.find(movie => movie.id === movieId);
}
