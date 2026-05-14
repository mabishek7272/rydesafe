import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MapPin, Bell, User, Bus, ChevronRight, Activity } from 'lucide-react-native';
import api from '../services/api';

export default function ParentDashboard({ navigation }: any) {
  const [children, setChildren] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/parent/children');
      setChildren(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, []);

  const renderChildCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => item.activeTrip && navigation.navigate('LiveTrack', { tripId: item.activeTrip.id, studentName: item.name })}
    >
      <View className="flex-row items-center">
        <View style={styles.avatarContainer}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User color="#94a3b8" size={32} />
            </View>
          )}
          {item.activeTrip && (
            <View style={styles.activeIndicator} />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.name}</Text>
          {item.activeTrip ? (
            <View style={styles.statusRow}>
              <Activity size={14} color="#10b981" />
              <Text style={styles.statusTextActive}>In Transit • {item.activeTrip.vehiclePlate}</Text>
            </View>
          ) : (
            <Text style={styles.statusTextInactive}>Next trip scheduled at 2:00 PM</Text>
          )}
        </View>

        <View style={styles.chevron}>
          {item.activeTrip ? (
            <View style={styles.trackBtn}>
               <Text style={styles.trackBtnText}>Track</Text>
               <ChevronRight size={16} color="#fff" />
            </View>
          ) : (
            <ChevronRight size={20} color="#cbd5e1" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.parentName}>Guardian Account</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Bell color="#fff" size={24} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={children}
        keyExtractor={item => item.id}
        renderItem={renderChildCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Students</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Manage</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <User color="#475569" size={64} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No students linked yet</Text>
          </View>
        }
      />

      {/* Safety Alert Banner */}
      <View style={styles.safetyCard}>
        <View style={styles.safetyIcon}>
          <Shield color="#ef4444" size={24} />
        </View>
        <View style={styles.safetyContent}>
          <Text style={styles.safetyTitle}>Safety Protocol Active</Text>
          <Text style={styles.safetyDesc}>Live tracking is encrypted and only visible to authorized guardians.</Text>
        </View>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 16,
  },
  parentName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  notifBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusTextActive: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextInactive: {
    color: '#64748b',
    fontSize: 14,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  trackBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 16,
    fontSize: 16,
  },
  safetyCard: {
    margin: 24,
    marginTop: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  safetyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyContent: {
    flex: 1,
  },
  safetyTitle: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  safetyDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  }
});
