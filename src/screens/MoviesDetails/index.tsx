import { StyleSheet, View } from 'react-native';
import { Text } from '../../components';
import { colors } from '../../utils';

export function MovieDetailScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headline" color={colors.white}>
        Movie details
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
