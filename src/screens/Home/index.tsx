import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  MOVIE_CARD_WIDTH,
  MovieCard,
  Text,
  type IFocusTarget,
  type IMovie,
} from '../../components';
import { useFocusSession } from '../../context';
import { movies } from '../../data/movies';
import type { RootStackParamList } from '../../navigation/types';
import { colors, focusMovie, routes, spacing } from '../../utils';

const ITEM_STRIDE = MOVIE_CARD_WIDTH + spacing.md;

type IHomeNavigation = NativeStackNavigationProp<
  RootStackParamList,
  typeof routes.HOME
>;

export default function HomeScreen() {
  const navigation = useNavigation<IHomeNavigation>();
  const { focusedMovieId, setFocusedMovieId } = useFocusSession();
  const listRef = useRef<FlatList<IMovie>>(null);
  const cardRefs = useRef(new Map<string, IFocusTarget | null>());
  const focusedMovieIdRef = useRef(focusedMovieId);
  const hasLeftScreen = useRef(false);
  focusedMovieIdRef.current = focusedMovieId;

  const restoreFocus = useCallback((movieId: string) => {
    const index = movies.findIndex(movie => movie.id === movieId);
    if (index < 0) {
      return;
    }
    listRef.current?.scrollToIndex({
      index,
      animated: false,
      viewPosition: 0.5,
    });
    setTimeout(() => {
      focusMovie(cardRefs.current.get(movieId));
    }, 60);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const movieId = focusedMovieIdRef.current;
      if (hasLeftScreen.current && movieId) {
        timeout = setTimeout(() => restoreFocus(movieId), 80);
      }
      return () => {
        hasLeftScreen.current = true;
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }, [restoreFocus]),
  );

  const openMovie = (movie: IMovie) => {
    setFocusedMovieId(movie.id);
    navigation.navigate(routes.MOVIE_DETAILS, { movieId: movie.id });
  };

  return (
    <View style={styles.screen}>
      <Text variant="headline" color={colors.primary} style={styles.heading}>
        Movies
      </Text>
      <FlatList
        ref={listRef}
        horizontal
        data={movies}
        extraData={focusedMovieId}
        keyExtractor={movie => movie.id}
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={movies.length}
        contentContainerStyle={styles.list}
        getItemLayout={(_, index) => ({
          length: ITEM_STRIDE,
          offset: ITEM_STRIDE * index,
          index,
        })}
        onScrollToIndexFailed={info => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
        }}
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <MovieCard
              ref={node => {
                cardRefs.current.set(item.id, node);
              }}
              movie={item}
              hasTVPreferredFocus={
                focusedMovieId ? item.id === focusedMovieId : index === 0
              }
              onFocused={setFocusedMovieId}
              onPress={() => openMovie(item)}
            />
          </View>
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
  },
  item: {
    width: ITEM_STRIDE,
  },
});
