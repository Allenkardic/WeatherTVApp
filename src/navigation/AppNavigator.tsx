import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, MovieDetailScreen } from '../screens';
import { colors, routes } from '../utils';

export type RootStackParamList = {
  [routes.HOME]: undefined;
  [routes.MOVIE_DETAILS]: { movieId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={routes.HOME}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ghostWhite },
        }}
      >
        <Stack.Screen name={routes.HOME} component={HomeScreen} />
        <Stack.Screen
          name={routes.MOVIE_DETAILS}
          component={MovieDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
