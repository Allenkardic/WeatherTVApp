import routes from '../utils/routes';

export type RootStackParamList = {
  [routes.HOME]: undefined;
  [routes.MOVIE_DETAILS]: { movieId: string };
  [routes.PLAYER]: { movieId: string };
};
