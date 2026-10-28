import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ActivityIndicator, BackHandler, Text as RNText } from 'react-native';
import { movies } from '../../data/movies';
import { SEEK_SECONDS, formatClock, seekStepLabel } from '../../utils';
import { PlayerScreen } from '.';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSeek = jest.fn();
const mockNavigation = { navigate: mockNavigate, goBack: mockGoBack };
const mockRoute = { params: { movieId: movies[0].id } };
const mockTV = {
  handler: (_event: { eventType: string; eventKeyAction?: number }) => {},
};

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');
  return {
    useNavigation: () => mockNavigation,
    useRoute: () => mockRoute,
    useFocusEffect: (effect: () => void | (() => void)) => {
      ReactLib.useEffect(() => effect(), [effect]);
    },
  };
});

jest.mock('react-native/Libraries/Components/TV/useTVEventHandler', () => {
  const hook = (handler: typeof mockTV.handler) => {
    mockTV.handler = handler;
  };
  return { __esModule: true, default: hook };
});

jest.mock('react-native-video', () => {
  const ReactLib = require('react');
  const { View } = jest.requireActual('react-native');
  const Video = ReactLib.forwardRef((props: any, ref: any) => {
    ReactLib.useImperativeHandle(ref, () => ({ seek: mockSeek }));
    return <View testID="player-video" {...props} />;
  });
  return { __esModule: true, default: Video };
});

async function renderPlayer() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<PlayerScreen />);
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

function video(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findByProps({ testID: 'player-video' });
}

function emit(eventType: string, eventKeyAction = 1) {
  mockTV.handler({ eventType, eventKeyAction });
}

async function loadVideo(
  renderer: ReactTestRenderer.ReactTestRenderer,
  duration = 125,
) {
  await ReactTestRenderer.act(() => {
    video(renderer).props.onLoad({ duration, currentTime: 0 });
  });
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockGoBack.mockClear();
  mockSeek.mockClear();
  mockRoute.params.movieId = movies[0].id;
  mockTV.handler = () => {};
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('shows a loading state until the video is ready', async () => {
  const renderer = await renderPlayer();

  expect(renderedText(renderer)).toContain(`Loading ${movies[0].title}`);
  expect(renderer.root.findAllByType(ActivityIndicator)).toHaveLength(1);
  expect(video(renderer).props).toMatchObject({
    source: { uri: movies[0].videoUrl },
    paused: false,
    controls: false,
  });

  await loadVideo(renderer, 125);

  expect(renderedText(renderer)).not.toContain(`Loading ${movies[0].title}`);
  expect(renderedText(renderer)).toEqual(
    expect.arrayContaining([
      movies[0].title,
      'Playing',
      formatClock(0),
      formatClock(125),
      `Select play or pause · Left rewind ${SEEK_SECONDS}s · Right fast-forward ${SEEK_SECONDS}s · Back returns to details`,
    ]),
  );
});

test('updates the clock as playback progresses', async () => {
  const renderer = await renderPlayer();
  await loadVideo(renderer, 125);

  await ReactTestRenderer.act(() => {
    video(renderer).props.onProgress({ currentTime: 40 });
  });

  expect(renderedText(renderer)).toContain(formatClock(40));
});

test('pauses and resumes from select and play/pause', async () => {
  const renderer = await renderPlayer();
  await loadVideo(renderer);

  await ReactTestRenderer.act(() => {
    emit('select', 0);
  });
  expect(renderedText(renderer)).toContain('Playing');

  await ReactTestRenderer.act(() => {
    emit('select');
  });
  expect(renderedText(renderer)).toContain('Paused');

  await ReactTestRenderer.act(() => {
    emit('playPause');
  });
  expect(renderedText(renderer)).toContain('Playing');
});

test('rewinds and fast-forwards in ten second steps', async () => {
  jest.useFakeTimers();
  try {
    const renderer = await renderPlayer();
    await loadVideo(renderer, 125);
    await ReactTestRenderer.act(() => {
      video(renderer).props.onProgress({ currentTime: 40 });
    });

    await ReactTestRenderer.act(() => {
      emit('right');
    });

    expect(mockSeek).toHaveBeenCalledWith(50);
    expect(renderedText(renderer)).toContain(formatClock(50));
    expect(renderedText(renderer)).toContain(seekStepLabel(SEEK_SECONDS));

    await ReactTestRenderer.act(() => {
      emit('longLeft');
    });

    expect(mockSeek).toHaveBeenLastCalledWith(40);
    expect(renderedText(renderer)).toContain(seekStepLabel(-SEEK_SECONDS));

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(renderedText(renderer)).not.toContain(seekStepLabel(-SEEK_SECONDS));
  } finally {
    jest.useRealTimers();
  }
});

test('clamps a seek to the start and end of the video', async () => {
  jest.useFakeTimers();
  try {
    const renderer = await renderPlayer();
    await loadVideo(renderer, 30);
    await ReactTestRenderer.act(() => {
      video(renderer).props.onProgress({ currentTime: 25 });
      emit('fastForward');
    });
    expect(mockSeek).toHaveBeenLastCalledWith(30);

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(600);
      video(renderer).props.onProgress({ currentTime: 4 });
      emit('rewind');
    });
    expect(mockSeek).toHaveBeenLastCalledWith(0);
  } finally {
    jest.useRealTimers();
  }
});

test('ignores stale progress until the seek settles', async () => {
  jest.useFakeTimers();
  try {
    const renderer = await renderPlayer();
    await loadVideo(renderer, 125);
    await ReactTestRenderer.act(() => {
      video(renderer).props.onProgress({ currentTime: 40 });
      emit('right');
      video(renderer).props.onProgress({ currentTime: 41 });
    });

    expect(renderedText(renderer)).toContain(formatClock(50));
    expect(renderedText(renderer)).not.toContain(formatClock(41));

    await ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(600);
      video(renderer).props.onProgress({ currentTime: 52 });
    });
    expect(renderedText(renderer)).toContain(formatClock(52));
  } finally {
    jest.useRealTimers();
  }
});

test('restarts from the beginning when select is pressed at the end', async () => {
  const renderer = await renderPlayer();
  await loadVideo(renderer, 125);

  await ReactTestRenderer.act(() => {
    video(renderer).props.onEnd();
  });
  expect(renderedText(renderer)).toContain('Paused');
  expect(renderedText(renderer)).toContain(formatClock(125));

  await ReactTestRenderer.act(() => {
    emit('select');
  });

  expect(mockSeek).toHaveBeenCalledWith(0);
  expect(renderedText(renderer)).toContain('Playing');
  expect(renderedText(renderer)).toContain(formatClock(0));
});

test('leaves the player once from the remote and the back button', async () => {
  const handlers: Array<() => boolean | null | undefined> = [];
  jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation((_event, handler) => {
      handlers.push(handler);
      return { remove: jest.fn() };
    });
  const renderer = await renderPlayer();
  await loadVideo(renderer);

  await ReactTestRenderer.act(() => {
    emit('menu');
  });
  expect(mockGoBack).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(() => {
    emit('back');
    expect(handlers[0]()).toBe(true);
  });
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

test('reports playback failure and ignores transport keys', async () => {
  const renderer = await renderPlayer();

  await ReactTestRenderer.act(() => {
    video(renderer).props.onError();
  });

  expect(renderedText(renderer)).toEqual(
    expect.arrayContaining([
      'Playback failed',
      `${movies[0].title} could not be played. Press Back to return to the details screen.`,
    ]),
  );
  expect(renderer.root.findAllByProps({ testID: 'player-video' })).toHaveLength(
    0,
  );

  await ReactTestRenderer.act(() => {
    emit('select');
    emit('right');
  });
  expect(mockSeek).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => {
    emit('back');
  });
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

test('explains when the movie cannot be found', async () => {
  mockRoute.params.movieId = 'missing-movie';
  const renderer = await renderPlayer();

  expect(renderedText(renderer)).toEqual(
    expect.arrayContaining([
      'This movie is unavailable',
      'Press Back to return.',
    ]),
  );
  expect(renderer.root.findAllByProps({ testID: 'player-video' })).toHaveLength(
    0,
  );
  expect(mockNavigate).not.toHaveBeenCalled();
});
