import { NextRequest } from 'next/server'
import { getUserFromHeaders, assertRole } from '@/lib/auth'
import { redisSubscriber } from '@/lib/redis'
import { getWialonAdapter } from '@/lib/wialon'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tracking/live?vehicleId=xxx&organisationId=xxx
 *
 * Server-Sent Events (SSE) stream for live GPS position.
 * The client connects and receives position updates in real-time
 * via Redis PubSub relay.
 */
export async function GET(request: NextRequest) {
  const user = getUserFromHeaders(request)
  const guard = assertRole(user, 'DRIVER')
  if (guard) return guard

  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  const organisationId = searchParams.get('organisationId') ?? user!.org

  if (!vehicleId || !organisationId) {
    return new Response(
      JSON.stringify({ error: 'vehicleId and organisationId are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const channel = `gps:${organisationId}:${vehicleId}`

  // Try to send last known position immediately
  const wialonAdapter = getWialonAdapter()
  const lastPosition = await wialonAdapter.getLastPosition(vehicleId)

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const send = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )
      }

      // Send last known position immediately if available
      if (lastPosition) {
        send({ type: 'position', ...lastPosition })
      }

      // Subscribe to Redis PubSub
      const sub = redisSubscriber
      await sub.subscribe(channel)

      sub.on('message', (ch: string, message: string) => {
        if (ch === channel) {
          try {
            const position = JSON.parse(message)
            send({ type: 'position', ...position })
          } catch {
            // ignore malformed messages
          }
        }
      })

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 30_000)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', async () => {
        clearInterval(heartbeat)
        await sub.unsubscribe(channel)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  })
}
