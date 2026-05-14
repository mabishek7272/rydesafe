import * as Location from 'expo-location';
import { create } from 'zustand';
import api from '../api/client';

interface LocationState {
  isTracking: boolean;
  currentLocation: Location.LocationObject | null;
  startTracking: (tripId: string) => Promise<void>;
  stopTracking: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  isTracking: false,
  currentLocation: null,
  locationSubscription: null as any,

  startTracking: async (tripId: string) => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return;
    }

    set({ isTracking: true });

    // Track location and send to server
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Every 10 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      async (location) => {
        set({ currentLocation: location });
        
        // Send to TrackBuddy API / Firebase
        try {
          await api.post(`/trips/${tripId}/location`, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed,
            heading: location.coords.heading,
            timestamp: location.timestamp,
          });
        } catch (err) {
          console.warn('Failed to send location to server', err);
        }
      }
    );

    (get() as any).locationSubscription = subscription;
  },

  stopTracking: () => {
    const subscription = (get() as any).locationSubscription;
    if (subscription) {
      subscription.remove();
    }
    set({ isTracking: false, currentLocation: null });
  },
}));
