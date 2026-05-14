import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromHeaders } from '@/lib/auth';

// ─── ETA Calculation Engine ──────────────────────────────────────────────────
// Uses Haversine formula for straight-line distance + average bus speed model.
// In production, swap this with Google Maps Distance Matrix for road-based ETA.

const AVERAGE_BUS_SPEED_KMH = 30; // Conservative urban school bus speed
const STOP_DWELL_SECONDS = 45;     // Time spent per stop for boarding

/**
 * Haversine formula: calculates the great-circle distance between two lat/lng points in km.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/trips/[id]/eta
 * Returns ETA for each remaining stop in a live trip, given the bus's current location.
 * 
 * Query params:
 *   lat - current bus latitude
 *   lng - current bus longitude
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const currentLat = parseFloat(url.searchParams.get('lat') ?? '');
    const currentLng = parseFloat(url.searchParams.get('lng') ?? '');

    if (isNaN(currentLat) || isNaN(currentLng)) {
      return NextResponse.json(
        { error: 'Query params `lat` and `lng` are required' },
        { status: 400 }
      );
    }

    const tripId = params.id;

    // 1. Fetch the trip with its schedule and pending stops
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        schedule: {
          include: {
            passengers: {
              where: {
                // Only passengers who haven't boarded yet
                passenger: {
                  tripEvents: {
                    none: {
                      tripId,
                      action: { in: ['BOARDED', 'ABSENT'] }
                    }
                  }
                }
              },
              include: {
                pickupStop: true,
                passenger: true
              },
              orderBy: {
                sequence: 'asc'
              }
            }
          }
        }
      }
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.status !== 'STARTED') {
      return NextResponse.json(
        { error: 'ETA is only available for active trips' },
        { status: 400 }
      );
    }

    // 2. Build the ordered list of remaining stops with coordinates
    const pendingPassengers = trip.schedule?.passengers ?? [];
    const stopsWithCoords = pendingPassengers
      .filter(p => p.pickupStop?.latitude && p.pickupStop?.longitude)
      .map(p => ({
        passengerId: p.passengerId,
        passengerName: p.passenger.name,
        stopId: p.pickupStop!.id,
        stopName: p.pickupStop!.name,
        stopAddress: p.pickupStop!.address,
        latitude: p.pickupStop!.latitude!,
        longitude: p.pickupStop!.longitude!,
      }));

    // 3. Calculate cumulative ETA for each stop using haversine + dwell model
    let accumulatedSeconds = 0;
    let prevLat = currentLat;
    let prevLng = currentLng;
    const now = new Date();

    const etaResults = stopsWithCoords.map((stop, index) => {
      const distKm = haversineKm(prevLat, prevLng, stop.latitude, stop.longitude);
      const travelSeconds = (distKm / AVERAGE_BUS_SPEED_KMH) * 3600;
      const dwellSeconds = index > 0 ? STOP_DWELL_SECONDS : 0; // First stop: no prior dwell

      accumulatedSeconds += travelSeconds + dwellSeconds;

      const etaDate = new Date(now.getTime() + accumulatedSeconds * 1000);

      prevLat = stop.latitude;
      prevLng = stop.longitude;

      return {
        passengerId: stop.passengerId,
        passengerName: stop.passengerName,
        stopId: stop.stopId,
        stopName: stop.stopName,
        stopAddress: stop.stopAddress,
        distanceFromPreviousKm: Math.round(distKm * 100) / 100,
        etaSeconds: Math.round(accumulatedSeconds),
        etaMinutes: Math.round(accumulatedSeconds / 60),
        etaTime: etaDate.toISOString(),
        etaLabel: formatEtaLabel(Math.round(accumulatedSeconds / 60)),
      };
    });

    return NextResponse.json({
      tripId,
      currentLocation: { lat: currentLat, lng: currentLng },
      totalRemainingStops: etaResults.length,
      stops: etaResults,
      generatedAt: now.toISOString(),
      note: 'ETA based on Haversine straight-line model at 30 km/h average speed',
    });

  } catch (error: any) {
    console.error('[ETA] Error calculating ETA:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatEtaLabel(minutes: number): string {
  if (minutes < 1) return 'Arriving now';
  if (minutes === 1) return '1 min away';
  if (minutes < 60) return `${minutes} mins away`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m away`;
}
