export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getUserFromRequest(request)
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Fetch absences and include user name
    const absences = await prisma.absence.findMany({
      include: {
        user: { select: { name: true, username: true } }
      },
      orderBy: { startDate: 'desc' }
    })
    
    return NextResponse.json({ absences })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request)
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { userId, startDate, endDate, type } = await request.json()

    if (!userId || !startDate || !endDate || !type) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    // Make sure end is at the very end of the day to cover the whole day
    end.setHours(23, 59, 59, 999)
    start.setHours(0, 0, 0, 0)

    const absence = await prisma.absence.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        type
      }
    })

    // Auto-delete overlapping shifts for this user
    await prisma.shift.deleteMany({
      where: {
        userId,
        date: {
          gte: start,
          lte: end
        }
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: 'CREATE_ABSENCE',
        details: `Ausencia registrada para usuario ID ${userId} del ${start.toLocaleDateString()} al ${end.toLocaleDateString()} (${type})`
      }
    })

    return NextResponse.json({ success: true, absence })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
