import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Subscription to Redis PubSub
      // Note: In standard Node.js Next.js, we would use ioredis
      // In Edge/Serverless, we poll or use a dedicated service
      // For this demo, we'll simulate a live feed by checking the trip_updates log
      
      const sendUpdate = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Poll Redis for latest updates (Simple implementation for demo)
      const interval = setInterval(async () => {
        try {
          // This is a placeholder for actual PubSub logic which requires a persistent connection
          // For now, we'll return a keep-alive
          sendUpdate({ type: 'HEARTBEAT', timestamp: new Date() });
        } catch (e) {
          console.error('SSE Error:', e);
        }
      }, 5000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
