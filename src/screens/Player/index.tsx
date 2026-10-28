import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  TVFocusGuideView,
  View,
  useTVEventHandler,
} from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import { Text } from '../../components';
import { findMovie } from '../../data/movies';
import type { RootStackParamList } from '../../navigation/types';
import {
  borderRadius,
  colors,
  formatClock,
  routes,
  scaledSize,
  spacing,
} from '../../utils';

type IPlayerRoute = RouteProp<RootStackParamList, typeof routes.PLAYER>;

const SEEK_SECONDS = 10;

export function PlayerScreen() {
  const navigation = useNavigation();
  const route = useRoute<IPlayerRoute>();
  const movie = findMovie(route.params.movieId);
  const videoRef = useRef<VideoRef>(null);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const pausedRef = useRef(false);
  const exitingRef = useRef(false);
  const ignoreProgressUntil = useRef(0);
  const seekLabelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [seekLabel, setSeekLabel] = useState<string | null>(null);

  const setPausedState = useCallback((next: boolean) => {
    pausedRef.current = next;
    setPaused(next);
  }, []);

  const exitPlayer = useCallback(() => {
    if (exitingRef.current) {
      return;
    }
    exitingRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const seekTo = useCallback((time: number) => {
    const limit = durationRef.current > 0 ? durationRef.current : time;
    const next = Math.min(Math.max(time, 0), limit);
    positionRef.current = next;
    setPosition(next);
    ignoreProgressUntil.current = Date.now() + 600;
    videoRef.current?.seek(next);
  }, []);

  const seekBy = useCallback(
    (delta: number) => {
      seekTo(positionRef.current + delta);
      setSeekLabel(delta > 0 ? `+${SEEK_SECONDS}s` : `−${SEEK_SECONDS}s`);
      if (seekLabelTimer.current) {
        clearTimeout(seekLabelTimer.current);
      }
      seekLabelTimer.current = setTimeout(() => setSeekLabel(null), 700);
    },
    [seekTo],
  );

  const togglePlayback = useCallback(() => {
    const atEnd =
      durationRef.current > 0 && positionRef.current >= durationRef.current - 1;
    if (atEnd) {
      seekTo(0);
      setPausedState(false);
      setSeekLabel(null);
      return;
    }
    setPausedState(!pausedRef.current);
    setSeekLabel(null);
  }, [seekTo, setPausedState]);

  useFocusEffect(
    useCallback(() => {
      setPausedState(false);
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          exitPlayer();
          return true;
        },
      );
      return () => {
        subscription.remove();
        if (seekLabelTimer.current) {
          clearTimeout(seekLabelTimer.current);
        }
        setPausedState(true);
      };
    }, [exitPlayer, setPausedState]),
  );

  useTVEventHandler(
    useCallback(
      event => {
        // A completed press is delivered as key-up. Key-down repeats while
        // the button is held, so acting on it toggles or seeks twice.
        if (event.eventKeyAction === 0) {
          return;
        }
        switch (event.eventType) {
          case 'select':
          case 'playPause':
            if (!failed) {
              togglePlayback();
            }
            break;
          case 'left':
          case 'rewind':
          case 'longLeft':
            if (!failed) {
              seekBy(-SEEK_SECONDS);
            }
            break;
          case 'right':
          case 'fastForward':
          case 'longRight':
            if (!failed) {
              seekBy(SEEK_SECONDS);
            }
            break;
          case 'menu':
          case 'back':
            exitPlayer();
            break;
          default:
            break;
        }
      },
      [exitPlayer, failed, seekBy, togglePlayback],
    ),
  );

  if (!movie) {
    return (
      <View style={styles.message}>
        <Text variant="headline" color={colors.white}>
          This movie is unavailable
        </Text>
        <Text variant="body" color={colors.lightText}>
          Press Back to return.
        </Text>
      </View>
    );
  }

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <TVFocusGuideView
      style={styles.screen}
      autoFocus
      trapFocusUp
      trapFocusDown
      trapFocusLeft
      trapFocusRight
    >
      {failed ? (
        <View style={styles.message}>
          <Text variant="headline" color={colors.white}>
            Playback failed
          </Text>
          <Text variant="body" color={colors.lightText} style={styles.copy}>
            {movie.title} could not be played. Press Back to return to the
            details screen.
          </Text>
        </View>
      ) : (
        <Video
          ref={videoRef}
          source={{ uri: movie.videoUrl }}
          style={styles.video}
          resizeMode="contain"
          paused={paused}
          controls={false}
          focusable={false}
          disableFocus
          progressUpdateInterval={250}
          onLoad={event => {
            durationRef.current = event.duration;
            setDuration(event.duration);
            setReady(true);
          }}
          onProgress={event => {
            if (Date.now() < ignoreProgressUntil.current) {
              return;
            }
            positionRef.current = event.currentTime;
            setPosition(event.currentTime);
          }}
          onEnd={() => {
            positionRef.current = durationRef.current;
            setPosition(durationRef.current);
            setPausedState(true);
          }}
          onError={() => setFailed(true)}
        />
      )}
      {!failed && !ready ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text variant="body" color={colors.white}>
            Loading {movie.title}
          </Text>
        </View>
      ) : null}
      {!failed && ready && (paused || seekLabel) ? (
        <View style={styles.centerStatus} pointerEvents="none">
          {seekLabel ? (
            <Text variant="display" color={colors.white} fontWeight="700">
              {seekLabel}
            </Text>
          ) : (
            <View style={styles.centerBadge}>
              <View style={styles.centerPlay} />
            </View>
          )}
        </View>
      ) : null}
      {!failed && ready ? (
        <View style={styles.controls} pointerEvents="none">
          <Text
            variant="title"
            color={colors.white}
            fontWeight="700"
            numberOfLines={1}
          >
            {movie.title}
          </Text>
          <View style={styles.statusRow}>
            {paused ? <View style={styles.playIcon} /> : <PauseIcon />}
            <Text variant="body" color={colors.white} fontWeight="600">
              {paused ? 'Paused' : 'Playing'}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Text variant="body" color={colors.white} style={styles.time}>
              {formatClock(position)}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
              <View style={[styles.knob, { left: `${progress * 100}%` }]} />
            </View>
            <Text variant="body" color={colors.white} style={styles.time}>
              {formatClock(duration)}
            </Text>
          </View>
          <Text variant="caption" color={colors.lightText}>
            Select play or pause · Left rewind {SEEK_SECONDS}s · Right
            fast-forward {SEEK_SECONDS}s · Back returns to details
          </Text>
        </View>
      ) : null}
      <Pressable style={styles.focusSink} hasTVPreferredFocus />
    </TVFocusGuideView>
  );
}

function PauseIcon() {
  return (
    <View style={styles.pauseIcon}>
      <View style={styles.pauseBar} />
      <View style={styles.pauseBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  focusSink: {
    ...StyleSheet.absoluteFill,
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.overlay,
  },
  centerStatus: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    width: scaledSize(140),
    height: scaledSize(140),
    borderRadius: borderRadius.round,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlay: {
    marginLeft: scaledSize(8),
    width: 0,
    height: 0,
    borderTopWidth: scaledSize(28),
    borderBottomWidth: scaledSize(28),
    borderLeftWidth: scaledSize(44),
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
    borderLeftColor: colors.white,
  },
  controls: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.xlarge,
    backgroundColor: colors.controlsScrim,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  time: {
    minWidth: scaledSize(110),
    textAlign: 'center',
  },
  track: {
    flex: 1,
    height: scaledSize(10),
    borderRadius: borderRadius.round,
    backgroundColor: colors.progressTrack,
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.round,
    backgroundColor: colors.gold,
  },
  knob: {
    position: 'absolute',
    width: scaledSize(22),
    height: scaledSize(22),
    marginLeft: scaledSize(-11),
    borderRadius: scaledSize(11),
    backgroundColor: colors.white,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: scaledSize(10),
    borderBottomWidth: scaledSize(10),
    borderLeftWidth: scaledSize(16),
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
    borderLeftColor: colors.white,
  },
  pauseIcon: {
    width: scaledSize(16),
    height: scaledSize(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pauseBar: {
    width: scaledSize(5),
    height: '100%',
    borderRadius: scaledSize(2),
    backgroundColor: colors.white,
  },
  message: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.black,
  },
  copy: {
    maxWidth: scaledSize(900),
  },
});
