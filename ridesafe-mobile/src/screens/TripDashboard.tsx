import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight, 
  Play, 
  LogOut,
  Calendar as CalendarIcon
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import { MotiView } from 'moti';

export default function TripDashboard({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/driver/trips');
      setTrips(response.data);
    } catch (error) {
      console.error('Failed to fetch trips', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color="#f87171" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <CalendarIcon size={20} color="#3b82f6" />
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statLabel}>Trips Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
            <Users size={20} color="#22c55e" />
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Schedule</Text>

        {loading ? (
          <View style={styles.center}>
            <Text style={{ color: '#94a3b8' }}>Loading schedule...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={40} color="#64748b" />
            <Text style={styles.emptyText}>No trips assigned for today</Text>
          </View>
        ) : (
          trips.map((trip, index) => (
            <MotiView
              key={trip.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: index * 100 }}
              style={styles.tripCard}
            >
              <View style={styles.tripHeader}>
                <View style={styles.tripTypeTag}>
                  <Text style={styles.tripTypeText}>{trip.type}</Text>
                </View>
                <Text style={styles.tripTime}>{trip.startTime}</Text>
              </View>
              
              <Text style={styles.tripName}>{trip.name || `Route ${trip.routeId}`}</Text>
              
              <View style={styles.tripDetails}>
                <View style={styles.detailItem}>
                  <MapPin size={14} color="#94a3b8" />
                  <Text style={styles.detailText}>{trip.stopCount} Stops</Text>
                </View>
                <View style={styles.detailItem}>
                  <Users size={14} color="#94a3b8" />
                  <Text style={styles.detailText}>{trip.passengerCount} Students</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.startBtn}
                onPress={async () => {
                  try {
                    const res = await api.post('/trips/start', { scheduleId: trip.id });
                    navigation.navigate('TripExecution', { tripId: res.data.id, scheduleId: trip.id });
                  } catch (err) {
                    Alert.alert('Error', 'Failed to start trip');
                  }
                }}
              >
                <Text style={styles.startBtnText}>Start Trip</Text>
                <Play size={16} color="#fff" fill="#fff" />
              </TouchableOpacity>
            </MotiView>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  tripCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripTypeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
  },
  tripTypeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tripTime: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  tripName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  startBtn: {
    backgroundColor: '#3b82f6',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
    fontSize: 14,
  },
  center: {
    padding: 40,
    alignItems: 'center',
  }
});
