import { PrismaClient } from '@prisma/client'

// ─── Singleton Prisma Client ──────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
export default prisma

// ─── Audit Log Middleware ─────────────────────────────────────────────────────
// Automatically records mutations to AuditLog for critical entities.
// Call prisma.withAudit(actor) to get an audited client instance.

const AUDITED_MODELS = [
  'passenger',
  'guardian',
  'driverProfile',
  'vehicle',
  'schedule',
  'trip',
  'tripEvent',
  'organisation',
  'branch',
  'user',
  'vehicleAssignment',
]

export function buildAuditMiddleware(
  actorId: string,
  actorRole: string,
  organisationId: string,
  ipAddress?: string
) {
  // Returns a Prisma middleware function
  return async (params: Parameters<Parameters<typeof prisma.$use>[0]>[0], next: Function) => {
    const model = params.model?.toLowerCase() ?? ''

    if (
      AUDITED_MODELS.includes(model) &&
      ['create', 'update', 'delete', 'updateMany', 'deleteMany'].includes(params.action)
    ) {
      let oldValue = null

      // Capture old value for updates/deletes
      if (['update', 'delete'].includes(params.action) && params.args?.where?.id) {
        try {
          // @ts-ignore – dynamic model access
          oldValue = await prisma[model].findUnique({
            where: { id: params.args.where.id },
          })
        } catch {
          // ignore
        }
      }

      const result = await next(params)

      // Write audit record
      const entityId =
        typeof result?.id === 'string'
          ? result.id
          : params.args?.where?.id ?? 'unknown'

      try {
        await prisma.auditLog.create({
          data: {
            organisationId,
            actorId,
            actorRole,
            entityType: params.model ?? model,
            entityId,
            action: params.action.toUpperCase(),
            oldValueJson: oldValue ? oldValue as any : undefined,
            newValueJson: result ? result as any : undefined,
            ipAddress,
            timestamp: new Date(),
          },
        })
      } catch (auditErr) {
        // Audit failure should never block the main operation
        console.error('[AuditLog] Failed to write audit record:', auditErr)
      }

      return result
    }

    return next(params)
  }
}

