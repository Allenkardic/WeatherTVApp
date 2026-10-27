import { FlatList, StyleSheet, View } from 'react-native';
import moviesData from '../../assets/movies.json';
import { MovieCard, Text, type IMovie } from '../../components';
import { colors, spacing } from '../../utils';

const movies = moviesData as IMovie[];

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text variant="headline" color={colors.primary} style={styles.heading}>
        Movies
      </Text>
      <FlatList
        horizontal
        data={movies}
        keyExtractor={movie => movie.id}
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <MovieCard movie={item} hasTVPreferredFocus={index === 0} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ghostWhite,
    paddingTop: spacing.lg,
  },
  heading: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
});