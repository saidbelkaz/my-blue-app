// App.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import BluetoothScanner from './BluetoothScanner';

export default function App() {
  return (
    <View style={styles.container}>
      <BluetoothScanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
