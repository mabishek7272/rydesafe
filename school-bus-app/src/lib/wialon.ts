/**
 * Wialon GPS Adapter
 * Connects to Wialon Hosting API (hosting.wialon.com)
 * and relays live vehicle positions to Redis PubSub.
 *
 * Wialon SDK reference: https://sdk.wialon.com/wiki/en/sidebar/remoteapi/apiref/apiref
 */

import { redis, redisPublisher } from '@/lib/redis'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WialonPosition {
  unitId: string
  lat: number
  lng: number
  speed: number       // km/h
  heading: number     // degrees 0-360
  altitude: number
  timestamp: number   // Unix timestamp
  ignition: boolean
}

export interface WialonGeofenceEvent {
  unitId: string
  zoneId: string
  zoneName: string
  eventType: 'ENTER' | 'EXIT'
  lat: number
  lng: number
  timestamp: number
}

// ─── Redis Channel Helpers ────────────────────────────────────────────────────

export function gpsChannel(organisationId: string, vehicleId: string): string {
  return `gps:${organisationId}:${vehicleId}`
}

export function geofenceChannel(organisationId: string): string {
  return `geofence:${organisationId}`
}

// ─── Wialon Adapter ───────────────────────────────────────────────────────────

export class WialonAdapter {
  private baseUrl: string
  private token: string
  private sessionId: string | null = null
  private pollInterval: NodeJS.Timeout | null = null
  private retryCount = 0
  private readonly MAX_RETRIES = 5
  private readonly POLL_INTERVAL_MS = 5000 // 5s position update

  // Map: wialonUnitId → { organisationId, vehicleId }
  private unitMap: Map<string, { organisationId: string; vehicleId: string }> = new Map()

  constructor(token: string, baseUrl = 'https://hst-api.wialon.com/wialon/ajax.html') {
    this.token = token
    this.baseUrl = baseUrl
  }

  // ─── Authentication ─────────────────────────────────────────────────────────

  async authenticate(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        svc: 'token/login',
        params: JSON.stringify({ token: this.token }),
      })

      const res = await fetch(`${this.baseUrl}?${params}`)
      const data = await res.json()

      if (data.error) {
        console.error('[Wialon] Auth failed:', data.error)
        return false
      }

      this.sessionId = data.eid
      this.retryCount = 0
      console.log('[Wialon] Authenticated. Session:', this.sessionId)
      return true
    } catch (err) {
      console.error('[Wialon] Auth error:', err)
      return false
    }
  }

  // ─── Unit Registration ──────────────────────────────────────────────────────

  registerUnit(wialonUnitId: string, organisationId: string, vehicleId: string) {
    this.unitMap.set(wialonUnitId, { organisationId, vehicleId })
  }

  unregisterUnit(wialonUnitId: string) {
    this.unitMap.delete(wialonUnitId)
  }

  // ─── Position Polling ───────────────────────────────────────────────────────

  async startPolling() {
    if (!this.sessionId) {
      const ok = await this.authenticate()
      if (!ok) throw new Error('Wialon authentication failed')
    }

    this.pollInterval = setInterval(async () => {
      await this.fetchPositions()
    }, this.POLL_INTERVAL_MS)

    console.log('[Wialon] Polling started')
  }

  stopPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval)
    this.sessionId = null
    console.log('[Wialon] Polling stopped')
  }

  private async fetchPositions() {
    const unitIds = Array.from(this.unitMap.keys())
    if (unitIds.length === 0) return

    try {
      const params = new URLSearchParams({
        svc: 'core/search_items',
        params: JSON.stringify({
          spec: {
            itemsType: 'avl_unit',
            propName: 'sys_id',
            propValueMask: unitIds.join(','),
            sortType: 'sys_id',
          },
          force: 1,
          flags: 1025, // include last message
          from: 0,
          to: 0,
        }),
        sid: this.sessionId!,
      })

      const res = await fetch(`${this.baseUrl}?${params}`)
      const data = await res.json()

      if (data.error === 1) {
        // Session expired — re-authenticate
        console.warn('[Wialon] Session expired. Re-authenticating...')
        await this.retryAuthentication()
        return
      }

      const items: any[] = data?.items ?? []

      for (const item of items) {
        const wialonUnitId = String(item.id)
        const mapping = this.unitMap.get(wialonUnitId)
        if (!mapping) continue

        const lastMsg = item.pos
        if (!lastMsg) continue

        const position: WialonPosition = {
          unitId: wialonUnitId,
          lat: lastMsg.y,
          lng: lastMsg.x,
          speed: lastMsg.s ?? 0,
          heading: lastMsg.c ?? 0,
          altitude: lastMsg.z ?? 0,
          timestamp: lastMsg.t,
          ignition: !!(item.prms?.ign?.v),
        }

        await this.publishPosition(mapping.organisationId, mapping.vehicleId, position)
      }

      this.retryCount = 0
    } catch (err) {
      console.error('[Wialon] Fetch error:', err)
      await this.retryAuthentication()
    }
  }

  // ─── Publish to Redis ───────────────────────────────────────────────────────

  private async publishPosition(
    organisationId: string,
    vehicleId: string,
    position: WialonPosition
  ) {
    const channel = gpsChannel(organisationId, vehicleId)
    const payload = JSON.stringify(position)

    await redisPublisher.publish(channel, payload)

    // Cache last known position (30 min TTL)
    await redis.set(
      `gps:last:${vehicleId}`,
      payload,
      'EX',
      1800
    )
  }

  // ─── Retry Logic ────────────────────────────────────────────────────────────

  private async retryAuthentication() {
    if (this.retryCount >= this.MAX_RETRIES) {
      console.error('[Wialon] Max retries reached. Stopping polling.')
      this.stopPolling()
      return
    }

    this.retryCount++
    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000)
    console.log(`[Wialon] Retry ${this.retryCount}/${this.MAX_RETRIES} in ${delay}ms`)

    await new Promise(r => setTimeout(r, delay))
    await this.authenticate()
  }

  // ─── Last Known Position ────────────────────────────────────────────────────

  async getLastPosition(vehicleId: string): Promise<WialonPosition | null> {
    const raw = await redis.get(`gps:last:${vehicleId}`)
    if (!raw) return null
    return JSON.parse(raw) as WialonPosition
  }
}

// ─── Singleton Adapter ────────────────────────────────────────────────────────

let _wialonAdapter: WialonAdapter | null = null

export function getWialonAdapter(): WialonAdapter {
  if (!_wialonAdapter) {
    const token = process.env.WIALON_TOKEN
    if (!token) throw new Error('WIALON_TOKEN environment variable is not set')
    _wialonAdapter = new WialonAdapter(token)
  }
  return _wialonAdapter
}
