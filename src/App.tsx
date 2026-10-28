/**
 * @format
 */

import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FocusProvider } from './context';
import { AppNavigator } from './navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <FocusProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppNavigator />
      </FocusProvider>
    </SafeAreaProvider>
  );
}

export default App;
