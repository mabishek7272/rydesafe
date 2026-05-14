import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppNavigation from './src/navigation';
import 'react-native-reanimated';

export default function App() {
  return (
    <View style={styles.container}>
      <AppNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
