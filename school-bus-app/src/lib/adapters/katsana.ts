// Katsana API Adapter Formatter and Mock Client

export class KatsanaAdapter {
  private apiKey: string;

  constructor(apiKey: string = process.env.KATSANA_API_KEY || 'MOCK_KEY') {
    this.apiKey = apiKey;
  }

  /**
   * Mock fetching the latest location for a bus/vehicle.
   */
  async fetchLocation(vehicleId: string) {
    if (this.apiKey === 'MOCK_KEY' || !process.env.KATSANA_API_KEY) {
      console.log(`[KatsanaAdapter] Simulating location fetch for ${vehicleId}`);
      // Simulate fake coordinate near KL / active school geofence
      return {
        lat: 3.14 + (Math.random() * 0.02 - 0.01),
        lng: 101.68 + (Math.random() * 0.02 - 0.01),
        speed_kmh: Math.floor(Math.random() * 60) + 10,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Stub integration to actual Katsana API
      const res = await fetch(`https://api.katsana.com/v1/vehicles/${vehicleId}/location`, {
        headers: {
          'Accept': 'application/vnd.KATSANA.v1+json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (!res.ok) throw new Error('Katsana API Error');
      const data = await res.json();
      
      // Normalize to RideSafe standard format
      return {
        lat: data.latitude,
        lng: data.longitude,
        speed_kmh: data.speed * 1.852, // Convert knot to km/h per plan
        timestamp: data.time // Assumes standard parsing, can convert MYT etc.
      };
    } catch (e) {
      console.error('[KatsanaAdapter] Fetch Failed', e);
      return null;
    }
  }
}

export const katsanaAdapter = new KatsanaAdapter();
