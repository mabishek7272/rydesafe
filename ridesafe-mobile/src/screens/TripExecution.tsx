import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { 
  UserCheck, 
  UserX, 
  Navigation, 
  Phone, 
  ChevronLeft,
  ShieldAlert
} from 'lucide-react-native';
import api from '../api/client';
import { MotiView, AnimatePresence } from 'moti';
import { useLocationStore } from '../store/useLocationStore';

export default function TripExecution({ route, navigation }: any) {
  const { tripId, scheduleId } = route.params;
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'LIST' | 'MAP'>('LIST');
  const { startTracking, stopTracking, currentLocation } = useLocationStore();

  const fetchTripDetails = async () => {
    try {
      const res = await api.get(`/trips/${scheduleId}/passengers`);
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSOS = () => {
    Alert.alert(
      "EMERGENCY ALERT",
      "Are you sure you want to trigger a Panic Alert? This will notify your dispatcher and emergency services immediately.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "TRIGGER SOS", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.post(`/trips/${tripId}/sos`, {
                location: currentLocation?.coords,
                timestamp: new Date()
              });
              Alert.alert("SOS Sent", "Emergency services have been notified.");
            } catch (error) {
              Alert.alert("Error", "Failed to send SOS. Please call emergency services directly.");
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchTripDetails();
    startTracking(tripId);

    return () => {
      stopTracking();
    };
  }, []);

  const updateStatus = async (studentId: string, status: string) => {
    try {
      await api.post(`/trips/${tripId}/passengers/${studentId}/event`, { 
        status,
        latitude: currentLocation?.coords.latitude,
        longitude: currentLocation?.coords.longitude
      });
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, status } : s
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update student status');
    }
  };

  const renderStudent = ({ item }: { item: any }) => (
    <MotiView 
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.studentCard}
    >
      <View style={styles.studentInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name[0]}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </View>
        <TouchableOpacity style={styles.phoneBtn}>
          <Phone size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtn, item.status === 'PICKED_UP' && styles.actionBtnActive]}
          onPress={() => updateStatus(item.id, 'PICKED_UP')}
        >
          <UserCheck size={18} color={item.status === 'PICKED_UP' ? '#fff' : '#22c55e'} />
          <Text style={[styles.actionText, item.status === 'PICKED_UP' && { color: '#fff' }]}>Boarded</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, item.status === 'ABSENT' && styles.actionBtnDanger]}
          onPress={() => updateStatus(item.id, 'ABSENT')}
        >
          <UserX size={18} color={item.status === 'ABSENT' ? '#fff' : '#ef4444'} />
          <Text style={[styles.actionText, item.status === 'ABSENT' && { color: '#fff' }]}>Absent</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Trip</Text>
        <TouchableOpacity onPress={triggerSOS}>
          <ShieldAlert color="#ef4444" size={24} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'LIST' && styles.tabActive]}
          onPress={() => setActiveTab('LIST')}
        >
          <Text style={[styles.tabText, activeTab === 'LIST' && styles.tabTextActive]}>Stop List</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'MAP' && styles.tabActive]}
          onPress={() => setActiveTab('MAP')}
        >
          <Text style={[styles.tabText, activeTab === 'MAP' && styles.tabTextActive]}>Live Map</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'LIST' ? (
        <FlatList
          data={students}
          renderItem={renderStudent}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <MapView 
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          followsUserLocation={true}
          initialRegion={{
            latitude: currentLocation?.coords?.latitude || 3.1390,
            longitude: currentLocation?.coords?.longitude || 101.6869,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* Stops Markers */}
          {students.map(s => (
            <Marker 
              key={s.id}
              coordinate={s.coords || { latitude: 3.139, longitude: 101.686 }}
              title={s.name}
            />
          ))}
        </MapView>
      )}

      {/* Complete Trip Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.completeBtn}>
          <Text style={styles.completeBtnText}>End Trip & Sync Logs</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  studentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#3b82f6',
    fontWeight: '700',
    fontSize: 18,
  },
  studentName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  address: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  phoneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionBtnActive: {
    backgroundColor: '#22c55e',
  },
  actionBtnDanger: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#94a3b8',
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  completeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  completeBtnText: {
    color: '#94a3b8',
    fontWeight: '700',
  }
});
