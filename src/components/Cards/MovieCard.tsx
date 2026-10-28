import { forwardRef, useState, type Ref } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';
import { borderRadius, colors, scaledSize, spacing } from '../../utils';
import { Text } from '../Text';

export type IMovie = {
  id: string;
  title: string;
  description: string;
  year: number;
  genre: string;
  posterUrl: string;
  backdropUrl?: string;
  videoUrl: string;
};

export type IFocusTarget = {
  requestTVFocus?: () => void;
  setNativeProps?: (props: { hasTVPreferredFocus?: boolean }) => void;
};

type IMovieCardProps = {
  movie: IMovie;
  hasTVPreferredFocus?: boolean;
  onPress?: PressableProps['onPress'];
  onFocused?: (movieId: string) => void;
};

export const MOVIE_CARD_WIDTH = scaledSize(640);
const CARD_HEIGHT = scaledSize(400);

export const MovieCard = forwardRef<IFocusTarget, IMovieCardProps>(
  function MovieCardView(
    { movie, hasTVPreferredFocus = false, onPress, onFocused },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const imageUri = movie.backdropUrl ?? movie.posterUrl;

    return (
      <Pressable
        ref={ref as Ref<View>}
        accessibilityRole="button"
        accessibilityLabel={`${movie.title}, ${movie.year}`}
        hasTVPreferredFocus={hasTVPreferredFocus}
        onPress={onPress}
        onFocus={() => {
          setFocused(true);
          onFocused?.(movie.id);
        }}
        onBlur={() => setFocused(false)}
        style={[styles.pressable, focused && styles.pressableFocused]}
      >
        <View style={styles.card}>
          {imageFailed ? (
            <View style={styles.imageFallback} />
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          )}
          <View style={styles.shadeFar} />
          <View style={styles.shadeMid} />
          <View style={styles.shadeNear} />
          <View style={styles.footer}>
            <Text
              variant="title"
              color={colors.white}
              fontWeight="600"
              numberOfLines={1}
            >
              {movie.title}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaLead}>
                <View style={styles.playIcon} />
                <Text variant="body" color={colors.white} fontWeight="500">
                  {movie.year}
                </Text>
              </View>
              <Text variant="title" color={colors.white} style={styles.more}>
                ···
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

MovieCard.displayName = 'MovieCard';

const styles = StyleSheet.create({
  pressable: {
    width: MOVIE_CARD_WIDTH,
    borderRadius: borderRadius.xlarge + scaledSize(8),
    borderWidth: scaledSize(4),
    borderColor: colors.transparent,
  },
  pressableFocused: {
    borderColor: colors.gold,
    transform: [{ scale: 1.04 }],
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xlarge,
    overflow: 'hidden',
    backgroundColor: colors.defaultBlack,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  imageFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.secondary,
  },
  shadeFar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
    backgroundColor: colors.cardShadeFar,
  },
  shadeMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: colors.cardShadeMid,
  },
  shadeNear: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '32%',
    backgroundColor: colors.cardShadeNear,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: scaledSize(9),
    borderBottomWidth: scaledSize(9),
    borderLeftWidth: scaledSize(14),
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
    borderLeftColor: colors.white,
  },
  more: {
    letterSpacing: scaledSize(2),
    lineHeight: scaledSize(28),
  },
});
