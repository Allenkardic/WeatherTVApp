import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Image, StyleSheet, Text as RNText } from 'react-native';
import { movies } from '../../data/movies';
import { colors, routes } from '../../utils';
import { MovieDetailScreen } from '.';

const mockNavigate = jest.fn();
const mockRoute = { params: { movieId: movies[0].id } };
const mockNavigation = { navigate: mockNavigate };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

async function renderDetails() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<MovieDetailScreen />);
  });
  return renderer;
}

function textContent(children: unknown): string {
  if (children == null || typeof children === 'boolean') {
    return '';
  }
  if (Array.isArray(children)) {
    return children.map(textContent).join('');
  }
  return String(children);
}

function renderedText(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root
    .findAllByType(RNText)
    .map(node => textContent(node.props.children));
}

function playButton(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findByProps({
    accessibilityLabel: `Play ${
      movies.find(movie => movie.id === mockRoute.params.movieId)?.title
    }`,
  });
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockRoute.params.movieId = movies[0].id;
});

test('shows the poster, backdrop, and movie details', async () => {
  const movie = movies[1];
  mockRoute.params.movieId = movie.id;
  const renderer = await renderDetails();
  const images = renderer.root.findAllByType(Image);

  expect(renderedText(renderer)).toEqual(
    expect.arrayContaining([
      movie.genre,
      movie.title,
      String(movie.year),
      movie.description,
      'Play',
    ]),
  );
  expect(images.map(image => image.props.source.uri)).toEqual([
    movie.backdropUrl,
    movie.posterUrl,
  ]);
  expect(playButton(renderer).props.hasTVPreferredFocus).toBe(true);
});

test('opens the player for the current movie', async () => {
  const renderer = await renderDetails();

  await ReactTestRenderer.act(() => {
    playButton(renderer).props.onPress();
  });

  expect(mockNavigate).toHaveBeenCalledWith(routes.PLAYER, {
    movieId: movies[0].id,
  });
});

test('fills the play button while it is focused', async () => {
  const renderer = await renderDetails();
  const play = () => playButton(renderer);

  await ReactTestRenderer.act(() => {
    play().props.onFocus();
  });

  expect(StyleSheet.flatten(play().props.style)).toMatchObject({
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  });
  expect(renderedText(renderer).filter(text => text === 'Play')).toHaveLength(
    1,
  );

  await ReactTestRenderer.act(() => {
    play().props.onBlur();
  });

  expect(StyleSheet.flatten(play().props.style).backgroundColor).toBe(
    colors.transparent,
  );
});

test('replaces a failed poster with the movie title', async () => {
  const renderer = await renderDetails();
  const poster = renderer.root
    .findAllByType(Image)
    .find(image => image.props.source.uri === movies[0].posterUrl);

  await ReactTestRenderer.act(() => {
    poster?.props.onError();
  });

  const images = renderer.root.findAllByType(Image);
  expect(images).toHaveLength(1);
  expect(images[0].props.source.uri).toBe(movies[0].backdropUrl);
  expect(
    renderedText(renderer).filter(text => text === movies[0].title),
  ).toHaveLength(2);
});

test('keeps the details visible when the backdrop fails', async () => {
  const renderer = await renderDetails();
  const backdrop = renderer.root
    .findAllByType(Image)
    .find(image => image.props.source.uri === movies[0].backdropUrl);

  await ReactTestRenderer.act(() => {
    backdrop?.props.onError();
  });

  expect(renderer.root.findAllByType(Image)).toHaveLength(1);
  expect(renderedText(renderer)).toContain(movies[0].description);
  expect(renderedText(renderer)).toContain('Play');
});

test('explains when the movie cannot be found', async () => {
  mockRoute.params.movieId = 'missing-movie';
  const renderer = await renderDetails();

  expect(renderedText(renderer)).toEqual(
    expect.arrayContaining([
      'This movie is unavailable',
      'Press Back to return to the movie list.',
    ]),
  );
  expect(renderedText(renderer)).not.toContain('Play');
  expect(renderer.root.findAllByType(Image)).toHaveLength(0);
});
