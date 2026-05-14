/**
 * Notification Worker
 * Processes jobs from the 'notifications' BullMQ queue.
 * Supports FCM (Firebase), WhatsApp Business API, and AWS SES Email.
 *
 * Run as a standalone Node.js process:
 *   npx tsx src/workers/notification.worker.ts
 */

import { Worker, Job } from 'bullmq'
import { QUEUES, NotificationJobData } from '../lib/queue'
import prisma from '../lib/prisma'

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' }

// ─── FCM ──────────────────────────────────────────────────────────────────────

async function sendFcm(data: NotificationJobData) {
  const { fcmToken, payload, templateKey } = data
  if (!fcmToken) throw new Error('FCM token missing')

  const fcmUrl = 'https://fcm.googleapis.com/v1/projects/' +
    process.env.FIREBASE_PROJECT_ID +
    '/messages:send'

  const body = {
    message: {
      token: fcmToken,
      notification: {
        title: (payload.title as string) ?? templateKey,
        body: (payload.body as string) ?? '',
      },
      data: Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, String(v)])
      ),
    },
  }

  const res = await fetch(fcmUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FIREBASE_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`FCM error: ${err}`)
  }
}

// ─── WhatsApp Business API ────────────────────────────────────────────────────

async function sendWhatsApp(data: NotificationJobData) {
  const { phone, payload, templateKey } = data
  if (!phone) throw new Error('Phone number missing for WhatsApp')

  const waUrl = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`

  const body = {
    messaging_product: 'whatsapp',
    to: phone.replace(/\D/g, ''), // strip non-digits
    type: 'template',
    template: {
      name: templateKey,
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: Object.values(payload).map(v => ({
            type: 'text',
            text: String(v),
          })),
        },
      ],
    },
  }

  const res = await fetch(waUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp error: ${err}`)
  }
}

// ─── AWS SES Email ────────────────────────────────────────────────────────────

async function sendEmail(data: NotificationJobData) {
  const { email, payload, templateKey } = data
  if (!email) throw new Error('Email address missing')

  // Using AWS SES v2 REST API (avoid SDK dependency in worker)
  const sesUrl = `https://email.${process.env.AWS_REGION ?? 'ap-southeast-1'}.amazonaws.com/v2/email/outbound-emails`

  const body = {
    FromEmailAddress: process.env.SES_FROM_EMAIL ?? 'admin@ridesafe.com.my',
    Destination: { ToAddresses: [email] },
    Content: {
      Simple: {
        Subject: { Data: (payload.title as string) ?? templateKey },
        Body: {
          Html: { Data: (payload.htmlBody as string) ?? (payload.body as string) ?? '' },
          Text: { Data: (payload.body as string) ?? '' },
        },
      },
    },
  }

  const res = await fetch(sesUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // AWS SigV4 signing should be handled by a signer lib in production
      // For simplicity here — use AWS SDK in production: @aws-sdk/client-sesv2
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`SES error: ${err}`)
  }
}

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker<NotificationJobData>(
  QUEUES.NOTIFICATION,
  async (job: Job<NotificationJobData>) => {
    const { data } = job
    console.log(`[NotificationWorker] Processing job ${job.id}: ${data.channel} → ${data.templateKey}`)

    try {
      switch (data.channel) {
        case 'FCM':       await sendFcm(data); break
        case 'WHATSAPP':  await sendWhatsApp(data); break
        case 'EMAIL':     await sendEmail(data); break
        default: throw new Error(`Unknown channel: ${data.channel}`)
      }

      // Update notification log → SENT
      await prisma.notificationLog.updateMany({
        where: {
          organisationId: data.organisationId,
          recipientId: data.recipientId,
          templateKey: data.templateKey,
          status: 'PENDING',
        },
        data: { status: 'SENT', sentAt: new Date() },
      })
    } catch (err: any) {
      console.error(`[NotificationWorker] Job ${job.id} failed:`, err.message)

      // Update notification log → FAILED
      await prisma.notificationLog.updateMany({
        where: {
          organisationId: data.organisationId,
          recipientId: data.recipientId,
          templateKey: data.templateKey,
          status: 'PENDING',
        },
        data: { status: 'FAILED', errorMessage: err.message },
      })

      throw err // Let BullMQ handle retry
    }
  },
  { connection, concurrency: 10 }
)

worker.on('completed', job => {
  console.log(`[NotificationWorker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[NotificationWorker] Job ${job?.id} permanently failed:`, err.message)
})

console.log('[NotificationWorker] Started. Listening for jobs...')
