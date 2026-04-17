import { katsanaAdapter } from '../adapters/katsana'
import prisma from '../prisma'

export class TrackingService {
  /**
   * Orchestrates fetching location with Katsana as primary and Mobile DB as fallback.
   * Based on the architectural Integration Plan.
   */
  async getLiveLocation(busId: string, driverId: string) {
    // 1. Try fetching from Katsana Primary Hardware
    let location = await katsanaAdapter.fetchLocation(busId);

    // 2. Katsana Failover -> Fallback to Mobile GPS
    if (!location) {
      console.warn(`[TrackingService] Katsana unavailable for Bus ${busId}. Failing over to Mobile GPS.`);
      
      const mobileData = await prisma.user.findUnique({
        where: { id: driverId },
        select: { lastLatitude: true, lastLongitude: true, currentSpeedKmH: true, lastLocationUpdate: true }
      });

      if (mobileData?.lastLatitude && mobileData?.lastLongitude) {
        location = {
          lat: mobileData.lastLatitude,
          lng: mobileData.lastLongitude,
          speed_kmh: mobileData.currentSpeedKmH || 0,
          timestamp: mobileData.lastLocationUpdate?.toISOString() || new Date().toISOString()
        };
      }
    }

    return location;
  }
}

export const trackingService = new TrackingService();
