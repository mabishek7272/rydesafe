import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const auth = await getUserFromSession()
        if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
                bus: { select: { id: true, plateNumber: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ users })
    } catch (error) {
        console.error('User list error:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const auth = await getUserFromSession()
        if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, email, password, role, phone } = await request.json()

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 })
        }

        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: passwordHash,
                role,
                phone: phone || null
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true
            }
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error('User create error:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}
