/**
 * BullMQ Job Queue Infrastructure
 * Queues: notifications, imports, ocr, bulk-insert
 */

import { Queue, Worker, QueueEvents, ConnectionOptions } from 'bullmq'

// ─── Connection ───────────────────────────────────────────────────────────────

const connection: ConnectionOptions = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
}

// ─── Queue Names ──────────────────────────────────────────────────────────────

export const QUEUES = {
  NOTIFICATION: 'notifications',
  IMPORT:       'imports',
  OCR:          'ocr',
  BULK_INSERT:  'bulk-insert',
  GPS_EVENT:    'gps-events',
} as const

// ─── Job Payload Types ────────────────────────────────────────────────────────

export interface NotificationJobData {
  organisationId: string
  recipientId: string
  channel: 'FCM' | 'WHATSAPP' | 'EMAIL'
  templateKey: string
  payload: Record<string, unknown>
  fcmToken?: string
  phone?: string
  email?: string
}

export interface ImportJobData {
  importJobId: string
  organisationId: string
  type: 'EXCEL' | 'CSV' | 'OCR'
  fileUrl: string
}

export interface OcrJobData {
  importJobId: string
  organisationId: string
  fileUrl: string
  extractionSchema: 'PASSENGERS' | 'SCHEDULES' | 'ROUTES'
}

export interface BulkInsertJobData {
  importJobId: string
  organisationId: string
  entityType: 'PASSENGER' | 'SCHEDULE' | 'PASSENGER_GUARDIAN'
  rows: Record<string, unknown>[]
}

export interface GpsEventJobData {
  organisationId: string
  vehicleId: string
  eventType: 'GEOFENCE_ENTER' | 'GEOFENCE_EXIT' | 'TRIP_STARTED' | 'TRIP_ENDED'
  lat: number
  lng: number
  timestamp: number
  metadata?: Record<string, unknown>
}

// ─── Queue Singletons ─────────────────────────────────────────────────────────

const queues = new Map<string, Queue>()

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 86400 }, // keep 24h
          removeOnFail: { age: 604800 },    // keep 7 days
        },
      })
    )
  }
  return queues.get(name)!
}

// ─── Job Producers ────────────────────────────────────────────────────────────

export async function enqueueNotification(data: NotificationJobData) {
  const q = getQueue(QUEUES.NOTIFICATION)
  return q.add('send', data, { priority: 1 })
}

export async function enqueueImport(data: ImportJobData) {
  const q = getQueue(QUEUES.IMPORT)
  return q.add('process', data)
}

export async function enqueueOcr(data: OcrJobData) {
  const q = getQueue(QUEUES.OCR)
  return q.add('extract', data)
}

export async function enqueueBulkInsert(data: BulkInsertJobData) {
  const q = getQueue(QUEUES.BULK_INSERT)
  return q.add('insert', data)
}

export async function enqueueGpsEvent(data: GpsEventJobData) {
  const q = getQueue(QUEUES.GPS_EVENT)
  return q.add('handle', data, { priority: 2 })
}
