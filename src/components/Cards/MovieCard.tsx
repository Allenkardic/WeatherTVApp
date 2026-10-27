import { useState } from 'react';
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

type MovieCardProps = {
  movie: IMovie;
  hasTVPreferredFocus?: boolean;
  onPress?: PressableProps['onPress'];
};

const CARD_WIDTH = scaledSize(640);
const CARD_HEIGHT = scaledSize(400);

export function MovieCard({
  movie,
  hasTVPreferredFocus = false,
  onPress,
}: MovieCardProps) {
  const [focused, setFocused] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const imageUri = movie.backdropUrl ?? movie.posterUrl;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${movie.title}, ${movie.year}`}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={() => setFocused(true)}
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
}

const styles = StyleSheet.create({
  pressable: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xlarge + scaledSize(8),
    borderWidth: scaledSize(4),
    borderColor: 'transparent',
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
    backgroundColor: 'rgba(10, 16, 28, 0.12)',
  },
  shadeMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '46%',
    backgroundColor: 'rgba(10, 16, 28, 0.38)',
  },
  shadeNear: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '32%',
    backgroundColor: 'rgba(10, 16, 28, 0.62)',
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
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.white,
  },
  more: {
    letterSpacing: scaledSize(2),
    lineHeight: scaledSize(28),
  },
});
