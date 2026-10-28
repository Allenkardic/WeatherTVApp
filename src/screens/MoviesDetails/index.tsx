import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components';
import { findMovie } from '../../data/movies';
import type { RootStackParamList } from '../../navigation/types';
import { borderRadius, colors, routes, scaledSize, spacing } from '../../utils';

type IDetailsNavigation = NativeStackNavigationProp<
  RootStackParamList,
  typeof routes.MOVIE_DETAILS
>;
type IDetailsRoute = RouteProp<RootStackParamList, typeof routes.MOVIE_DETAILS>;

const POSTER_WIDTH = scaledSize(460);
const POSTER_HEIGHT = scaledSize(690);

export function MovieDetailScreen() {
  const navigation = useNavigation<IDetailsNavigation>();
  const route = useRoute<IDetailsRoute>();
  const movie = findMovie(route.params.movieId);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [playFocused, setPlayFocused] = useState(false);

  if (!movie) {
    return (
      <View style={styles.missing}>
        <Text variant="headline" color={colors.white}>
          This movie is unavailable
        </Text>
        <Text
          variant="body"
          color={colors.lightText}
          style={styles.missingCopy}
        >
          Press Back to return to the movie list.
        </Text>
      </View>
    );
  }

  const backdropUri = movie.backdropUrl ?? movie.posterUrl;

  return (
    <View style={styles.screen}>
      {backdropFailed ? (
        <View style={styles.backdropFallback} />
      ) : (
        <Image
          source={{ uri: backdropUri }}
          style={styles.backdrop}
          resizeMode="cover"
          blurRadius={18}
          onError={() => setBackdropFailed(true)}
        />
      )}
      <View style={styles.scrim} />
      <View style={styles.content}>
        {posterFailed ? (
          <View style={styles.posterFallback}>
            <Text
              variant="title"
              color={colors.white}
              style={styles.posterLabel}
            >
              {movie.title}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: movie.posterUrl }}
            style={styles.poster}
            resizeMode="cover"
            onError={() => setPosterFailed(true)}
          />
        )}
        <View style={styles.copy}>
          <View style={styles.genrePill}>
            <Text variant="caption" color={colors.primary} fontWeight="700">
              {movie.genre}
            </Text>
          </View>
          <Text variant="display" color={colors.white} fontWeight="700">
            {movie.title}
          </Text>
          <Text variant="title" color={colors.gold} fontWeight="600">
            {movie.year}
          </Text>
          <Text
            variant="body"
            color="rgba(255,255,255,0.86)"
            style={styles.description}
          >
            {movie.description}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Play ${movie.title}`}
            hasTVPreferredFocus
            onPress={() =>
              navigation.navigate(routes.PLAYER, { movieId: movie.id })
            }
            onFocus={() => setPlayFocused(true)}
            onBlur={() => setPlayFocused(false)}
            style={[styles.play, playFocused && styles.playFocused]}
          >
            <View
              style={[
                styles.playIcon,
                {
                  borderLeftColor: playFocused ? colors.primary : colors.white,
                },
              ]}
            />
            <Text
              variant="title"
              color={playFocused ? colors.primary : colors.white}
              fontWeight="700"
            >
              Play
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 9, 50, 0.72)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: borderRadius.xlarge,
    backgroundColor: colors.defaultBlack,
  },
  posterFallback: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: borderRadius.xlarge,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  posterLabel: {
    textAlign: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  genrePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  description: {
    maxWidth: scaledSize(980),
    marginTop: spacing.xs,
  },
  play: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    minWidth: scaledSize(320),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    borderWidth: scaledSize(3),
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent',
  },
  playFocused: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    transform: [{ scale: 1.06 }],
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: scaledSize(12),
    borderBottomWidth: scaledSize(12),
    borderLeftWidth: scaledSize(18),
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.white,
  },
  missing: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  missingCopy: {
    maxWidth: scaledSize(800),
  },
});
