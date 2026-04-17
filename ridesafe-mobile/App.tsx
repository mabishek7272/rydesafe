import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Bus, ShieldCheck } from 'lucide-react-native';
// Ensure Reanimated initializes
import 'react-native-reanimated';

export default function App() {
  const initialRegion = {
    latitude: 3.1390,
    longitude: 101.6869, // Dummy KL Coordinates
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* 1. Full Screen Map View */}
      <MapView 
        style={styles.map} 
        initialRegion={initialRegion}
        provider={PROVIDER_GOOGLE}
      >
        <Marker coordinate={{ latitude: 3.1390, longitude: 101.6869 }}>
          {/* Animated Pulsing Bus Marker */}
          <MotiView
            from={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ loop: true, type: 'timing', duration: 2000 }}
            style={styles.markerContainer}
          >
            <View style={styles.markerGlow} />
            <View style={styles.iconCircle}>
              <Bus size={20} color="#EAB308" />
            </View>
          </MotiView>
        </Marker>
      </MapView>

      {/* 2. Frosted Glass Animated Header */}
      <MotiView 
        from={{ translateY: -100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'spring', delay: 300, damping: 15 }}
        style={styles.headerContainer}
      >
        <BlurView intensity={80} tint="light" style={styles.glassHeader}>
          <ShieldCheck size={28} color="#1E3A8A" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.title}>RideSafe Live Track</Text>
            <Text style={styles.subtitle}>Connecting to Firebase...</Text>
          </View>
        </BlurView>
      </MotiView>

      {/* 3. Bottom Glass Panel for Status */}
      <MotiView
        from={{ translateY: 200, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: 'spring', delay: 600, damping: 15 }}
        style={styles.bottomSheet}
      >
        <BlurView intensity={90} tint="light" style={styles.glassSheet}>
          <Text style={styles.sheetTitle}>Bus 402 - Route A</Text>
          <Text style={styles.sheetStatus}>Awaiting driver connection.</Text>
        </BlurView>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  glassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  glassSheet: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  sheetStatus: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 4
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  markerGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 58, 138, 0.2)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A8A', // Academic Navy
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  }
});
