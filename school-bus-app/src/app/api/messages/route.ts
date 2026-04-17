import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromSession()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Find all messages involving this user (either sent or received)
        const messages = await prisma.message.findMany({
            where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                recipient: { select: { id: true, name: true, role: true } }
            }
        })

        return NextResponse.json({ messages })
    } catch (error) {
        console.error('Messages GET Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromSession()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const data = await request.json()
        if (!data.recipientId || !data.content) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        const message = await prisma.message.create({
            data: {
                senderId: user.id,
                recipientId: data.recipientId,
                content: data.content
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                recipient: { select: { id: true, name: true, role: true } }
            }
        })

        return NextResponse.json({ message })
    } catch (error) {
        console.error('Messages POST Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
