export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const monthStr = searchParams.get('month')
    const yearStr = searchParams.get('year')

    if (!monthStr || !yearStr) {
      return NextResponse.json({ error: 'Faltan parámetros de mes o año' }, { status: 400 })
    }

    const month = parseInt(monthStr, 10)
    const year = parseInt(yearStr, 10)

    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    // Fetch users (only essential info to minimize payload)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        defaultShift: true,
        workDays: true,
        homeOfficeDays: true,
        showInCalendar: true
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    })

    // Fetch all shifts for the given month
    const shifts = await prisma.shift.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        userId: true,
        date: true,
        type: true,
        isHomeOffice: true,
      }
    })

    // Fetch global shift types settings to provide color/name info
    const setting = await prisma.setting.findUnique({
      where: { key: 'shift_types' }
    })
    
    let shiftTypes = []
    if (setting && setting.value) {
      shiftTypes = JSON.parse(setting.value)
    } else {
      // Default fallback
      shiftTypes = [
        { id: 'T/12', name: 'Turno Día 12h', color: '#facc15' },
        { id: 'TN/12', name: 'Turno Noche 12h', color: '#c084fc' },
        { id: 'TM/9-6', name: 'Turno Mixto 9h', color: '#60a5fa' },
        { id: 'Guardia', name: 'Guardia', color: '#2dd4bf' }
      ]
    }

    return NextResponse.json({ users, shifts, shiftTypes })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
