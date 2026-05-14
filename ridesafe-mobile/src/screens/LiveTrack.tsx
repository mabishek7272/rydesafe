import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  ScrollView
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { X, Navigation, Phone, MessageSquare, Clock, MapPin } from 'lucide-react-native';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

export default function LiveTrack({ route, navigation }: any) {
  const { tripId, studentName } = route.params;
  const [location, setLocation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [etaData, setEtaData] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  const fetchLocation = async () => {
    try {
      const res = await api.get(`/trips/${tripId}/location`);
      if (res.data) {
        const { latitude, longitude } = res.data;
        setLocation(res.data);
        setHistory(prev => [...prev, { latitude, longitude }].slice(-20));
        
        // Auto-center map on first point
        if (!location) {
          mapRef.current?.animateToRegion({
            latitude, longitude,
            latitudeDelta: 0.01, longitudeDelta: 0.01,
          }, 1000);
        }

        // Fetch live ETA for all remaining stops using current bus position
        try {
          const etaRes = await api.get(`/trips/${tripId}/eta`, {
            params: { lat: latitude, lng: longitude }
          });
          setEtaData(etaRes.data);
        } catch {
          // ETA is non-fatal — silently fail
        }
      }
    } catch (err) {
      console.error('Fetch location error:', err);
    }
  };

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Find the ETA for the student being tracked specifically
  const studentEta = etaData?.stops?.find((s: any) => s.passengerName === studentName);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: 3.1390, // Default to KL
          longitude: 101.6869,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {location && (
          <>
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude
              }}
              title="School Bus"
              description={studentName}
            >
              <View style={styles.busMarker}>
                <Navigation size={24} color="#fff" style={{ transform: [{ rotate: `${location.heading || 0}deg` }] }} />
              </View>
            </Marker>
            
            <Polyline
              coordinates={history}
              strokeColor="#3b82f6"
              strokeWidth={4}
            />

            {/* ETA stop markers */}
            {etaData?.stops?.map((stop: any, i: number) => (
              <Marker
                key={stop.stopId}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                title={stop.stopName}
                description={stop.etaLabel}
                pinColor={stop.passengerName === studentName ? '#f59e0b' : '#64748b'}
              />
            ))}
          </>
        )}
      </MapView>

      {/* Floating Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <X color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.titleCard}>
          <Text style={styles.title}>Tracking {studentName}</Text>
          <View style={styles.liveBadge}>
             <View style={styles.pulseDot} />
             <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Info Card */}
      <View style={styles.bottomCard}>
        <View style={styles.handle} />
        <View style={styles.driverRow}>
          <View style={styles.driverInfo}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>JD</Text>
            </View>
            <View>
              <Text style={styles.driverName}>John Driver</Text>
              <Text style={styles.vehicleInfo}>Bus 102 • KL-9988</Text>
            </View>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1e293b' }]}>
              <MessageSquare size={20} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3b82f6' }]}>
              <Phone size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live ETA Card */}
        <View style={styles.etaContainer}>
           <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>ETA to Your Stop</Text>
              <Text style={styles.etaValue}>
                {studentEta ? studentEta.etaLabel : (etaData ? 'Calculating...' : '-- mins')}
              </Text>
           </View>
           <View style={styles.divider} />
           <View style={styles.etaBox}>
              <Text style={styles.etaLabel}>Current Speed</Text>
              <Text style={styles.etaValue}>{location?.speed ? Math.round(location.speed) : 0} km/h</Text>
           </View>
        </View>

        {/* Remaining Stops List */}
        {etaData?.stops && etaData.stops.length > 0 && (
          <View style={styles.stopsContainer}>
            <View style={styles.stopsHeader}>
              <Clock size={14} color="#94a3b8" />
              <Text style={styles.stopsTitle}>
                {etaData.totalRemainingStops} stop{etaData.totalRemainingStops !== 1 ? 's' : ''} remaining
              </Text>
            </View>
            <ScrollView style={styles.stopsList} showsVerticalScrollIndicator={false}>
              {etaData.stops.slice(0, 4).map((stop: any) => (
                <View 
                  key={stop.stopId} 
                  style={[
                    styles.stopItem,
                    stop.passengerName === studentName && styles.stopItemHighlighted
                  ]}
                >
                  <MapPin 
                    size={16} 
                    color={stop.passengerName === studentName ? '#f59e0b' : '#64748b'} 
                  />
                  <View style={styles.stopItemContent}>
                    <Text style={[
                      styles.stopItemName,
                      stop.passengerName === studentName && styles.stopItemNameHighlighted
                    ]}>
                      {stop.passengerName}
                    </Text>
                    <Text style={styles.stopItemAddress} numberOfLines={1}>
                      {stop.stopName}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stopItemEta,
                    stop.passengerName === studentName && styles.stopItemEtaHighlighted
                  ]}>
                    {stop.etaLabel}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "feature": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "feature": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "feature": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "feature": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "feature": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "feature": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  map: { width, height },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10,
    alignItems: 'center', gap: 12,
  },
  backBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  titleCard: {
    flex: 1, height: 48, backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 24, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
  },
  title: { color: '#fff', fontWeight: '700', fontSize: 16 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontSize: 10, fontWeight: '900' },
  busMarker: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6',
    borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3b82f6', shadowRadius: 10, shadowOpacity: 0.5,
  },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0f172a', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  driverRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  driverName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  vehicleInfo: { color: '#94a3b8', fontSize: 12 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  etaContainer: {
    flexDirection: 'row', backgroundColor: '#1e293b',
    borderRadius: 20, padding: 20, marginBottom: 16,
  },
  etaBox: { flex: 1, alignItems: 'center' },
  etaLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  etaValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  divider: { width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)' },
  stopsContainer: {
    backgroundColor: '#1e293b', borderRadius: 16,
    padding: 12, maxHeight: 180,
  },
  stopsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  stopsTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  stopsList: { flex: 1 },
  stopItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 8,
  },
  stopItemHighlighted: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8,
  },
  stopItemContent: { flex: 1 },
  stopItemName: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  stopItemNameHighlighted: { color: '#f59e0b' },
  stopItemAddress: { color: '#475569', fontSize: 11, marginTop: 1 },
  stopItemEta: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  stopItemEtaHighlighted: { color: '#f59e0b' },
});
