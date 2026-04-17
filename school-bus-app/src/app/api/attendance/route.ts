import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromSession()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Primarily drivers will POST attendance logs
        if (user.role !== 'DRIVER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const data = await request.json()
        if (!data.tripId || !data.studentId || !data.action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

        const attendance = await prisma.attendance.create({
            data: {
                tripId: data.tripId,
                studentId: data.studentId,
                stopId: data.stopId, // Optional
                action: data.action,
                latitude: dbUser?.lastLatitude || null,
                longitude: dbUser?.lastLongitude || null
            }
        })

        // Auto-create a notification for the parent
        const student = await prisma.student.findUnique({ where: { id: data.studentId } })
        if (student?.parentId) {
            const verb = data.action === 'PICKED_UP' ? 'picked up' : (data.action === 'DROPPED_OFF' ? 'dropped off' : 'marked absent')
            await prisma.notification.create({
                data: {
                    userId: student.parentId,
                    title: `Student Update`,
                    body: `${student.name} was ${verb}.`,
                    type: 'INFO'
                }
            })
        }

        // ── Bus Capacity / Overcrowding Alert ────────────────────────────
        if (data.action === 'PICKED_UP') {
            const trip = await prisma.trip.findUnique({ where: { id: data.tripId }, select: { busId: true } })
            if (trip?.busId) {
                const bus = await prisma.bus.findUnique({ where: { id: trip.busId }, select: { capacity: true, plateNumber: true } })
                if (bus) {
                    const onBoard = await prisma.attendance.count({
                        where: { tripId: data.tripId, action: 'PICKED_UP' }
                    })
                    const droppedOff = await prisma.attendance.count({
                        where: { tripId: data.tripId, action: 'DROPPED_OFF' }
                    })
                    const currentOnBoard = onBoard - droppedOff
                    const ratio = currentOnBoard / bus.capacity

                    if (ratio >= 1) {
                        // OVER CAPACITY
                        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
                        await prisma.notification.createMany({
                            data: admins.map(a => ({
                                userId: a.id,
                                title: '🚨 Overcrowding Alert',
                                body: `Bus ${bus.plateNumber} has ${currentOnBoard}/${bus.capacity} passengers — OVER CAPACITY!`,
                                type: 'EMERGENCY',
                            }))
                        }).catch(() => {})
                    } else if (ratio >= 0.9) {
                        // 90% warning
                        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
                        await prisma.notification.createMany({
                            data: admins.map(a => ({
                                userId: a.id,
                                title: '⚠️ Bus Nearly Full',
                                body: `Bus ${bus.plateNumber} is at ${currentOnBoard}/${bus.capacity} capacity (${Math.round(ratio * 100)}%).`,
                                type: 'WARNING',
                            }))
                        }).catch(() => {})
                    }
                }
            }
        }

        return NextResponse.json({ attendance })
    } catch (error) {
        console.error('Attendance POST Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
