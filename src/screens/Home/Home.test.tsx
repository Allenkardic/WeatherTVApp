import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text as RNText } from 'react-native';
import { FocusProvider } from '../../context';
import { movies } from '../../data/movies';
import { routes } from '../../utils';
import HomeScreen from '.';

const mockNavigate = jest.fn();
const mockScrollToIndex = jest.fn();
const mockScrollToOffset = jest.fn();
const mockFocus = {
  effect: undefined as undefined | (() => void | (() => void)),
  cleanup: undefined as undefined | (() => void),
};

const mockNavigation = { navigate: mockNavigate };

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');
  return {
    useNavigation: () => mockNavigation,
    useFocusEffect: (effect: () => void | (() => void)) => {
      mockFocus.effect = effect;
      ReactLib.useEffect(() => {
        const cleanup = effect();
        mockFocus.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
        return () => mockFocus.cleanup?.();
      }, [effect]);
    },
  };
});

jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const ReactLib = require('react');
  const { View } = jest.requireActual('react-native');
  const FlatList = ReactLib.forwardRef((props: any, ref: any) => {
    ReactLib.useImperativeHandle(ref, () => ({
      scrollToIndex: mockScrollToIndex,
      scrollToOffset: mockScrollToOffset,
    }));
    return (
      <View>
        {props.data.map((item: { id: string }, index: number) => (
          <View key={props.keyExtractor(item, index)}>
            {props.renderItem({ item, index })}
          </View>
        ))}
      </View>
    );
  });
  return Object.assign(FlatList, { __esModule: true, default: FlatList });
});

async function renderHome() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <FocusProvider>
        <HomeScreen />
      </FocusProvider>,
    );
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

function cards(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityLabel === 'string',
  );
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockScrollToIndex.mockClear();
  mockScrollToOffset.mockClear();
  mockFocus.effect = undefined;
  mockFocus.cleanup = undefined;
});

test('renders the heading and every movie', async () => {
  const renderer = await renderHome();
  const text = renderedText(renderer);

  expect(text).toContain('Movies');
  movies.forEach(movie => {
    expect(text).toContain(movie.title);
    expect(text).toContain(String(movie.year));
  });
});

test('prefers focus on the first movie before one has been saved', async () => {
  const renderer = await renderHome();
  const preferred = cards(renderer).filter(
    card => card.props.hasTVPreferredFocus,
  );

  expect(preferred).toHaveLength(1);
  expect(preferred[0].props.accessibilityLabel).toBe(
    `${movies[0].title}, ${movies[0].year}`,
  );
});

test('moves preferred focus when another movie is focused', async () => {
  const renderer = await renderHome();
  const next = movies[2];

  await ReactTestRenderer.act(() => {
    cards(renderer)[2].props.onFocus();
  });

  const preferred = cards(renderer).filter(
    card => card.props.hasTVPreferredFocus,
  );
  expect(preferred).toHaveLength(1);
  expect(preferred[0].props.accessibilityLabel).toBe(
    `${next.title}, ${next.year}`,
  );
});

test('opens movie details for the selected card', async () => {
  const renderer = await renderHome();
  const selected = movies[3];

  await ReactTestRenderer.act(() => {
    cards(renderer)[3].props.onPress();
  });

  expect(mockNavigate).toHaveBeenCalledWith(routes.MOVIE_DETAILS, {
    movieId: selected.id,
  });
  const preferred = cards(renderer).filter(
    card => card.props.hasTVPreferredFocus,
  );
  expect(preferred[0].props.accessibilityLabel).toBe(
    `${selected.title}, ${selected.year}`,
  );
});

test('scrolls the saved movie back into view after returning', async () => {
  jest.useFakeTimers();
  try {
    const renderer = await renderHome();
    const selected = movies[4];

    await ReactTestRenderer.act(() => {
      cards(renderer)[4].props.onPress();
    });
    await ReactTestRenderer.act(() => {
      mockFocus.cleanup?.();
    });
    await ReactTestRenderer.act(() => {
      mockFocus.effect?.();
    });
    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockScrollToIndex).toHaveBeenCalledWith({
      index: 4,
      animated: false,
      viewPosition: 0.5,
    });
    expect(
      cards(renderer).find(card => card.props.hasTVPreferredFocus)?.props
        .accessibilityLabel,
    ).toBe(`${selected.title}, ${selected.year}`);
  } finally {
    jest.useRealTimers();
  }
});
