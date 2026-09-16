export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Optional: filter by date range
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, username: true, role: true, level: true, email: true, phone: true } }
      }
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload || (userPayload.role !== 'SUPER_ADMIN' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { userId, date, type, isHomeOffice } = await request.json()

    if (!userId || !date || !type) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    // date is expected to be "yyyy-MM-dd"
    const [y, m, d] = date.split('-').map(Number);
    const targetDate = new Date(Date.UTC(y, m - 1, d, 12));

    // Check if shift already exists for this user, date and type.
    const existing = await prisma.shift.findUnique({
      where: {
        userId_date_type: {
          userId,
          date: targetDate,
          type
        }
      }
    })

    if (existing) {
      return NextResponse.json({ shift: existing }, { status: 200 })
    }

    const newShift = await prisma.shift.create({
      data: {
        userId,
        date: targetDate,
        type,
        isHomeOffice: Boolean(isHomeOffice)
      },
      include: {
        user: { select: { id: true, name: true, username: true, role: true } }
      }
    })

    return NextResponse.json({ shift: newShift }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload || (userPayload.role !== 'SUPER_ADMIN' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { shiftId } = await request.json()

    if (!shiftId) {
      return NextResponse.json({ error: 'Falta el ID del turno' }, { status: 400 })
    }

    await prisma.shift.delete({
      where: { id: shiftId }
    })

    return NextResponse.json({ message: 'Turno eliminado' })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
