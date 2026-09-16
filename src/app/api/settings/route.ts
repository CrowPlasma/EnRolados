export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    let settings = await prisma.setting.findMany()
    
    // Auto-migration for dynamic shifts
    let hasShiftTypes = settings.some(s => s.key === 'shift_types')
    if (!hasShiftTypes) {
      // Find old settings
      const getOld = (key: string, def: string) => settings.find(s => s.key === key)?.value || def
      
      const defaultShifts = [
        { id: 'MORNING', name: 'Matutino', time: getOld('shift_MORNING_time', '07:00 - 15:00'), color: 'blue' },
        { id: 'EVENING', name: 'Vespertino', time: getOld('shift_EVENING_time', '15:00 - 23:00'), color: 'orange' },
        { id: 'NIGHT', name: 'Nocturno', time: getOld('shift_NIGHT_time', '23:00 - 07:00'), color: 'purple' },
        { id: 'GUARD', name: 'Guardia', time: 'Turno de Guardia', color: 'green' }
      ]
      
      const newValue = JSON.stringify(defaultShifts)
      
      const newSetting = await prisma.setting.upsert({
        where: { key: 'shift_types' },
        update: { value: newValue },
        create: { key: 'shift_types', value: newValue }
      })
      
      settings.push(newSetting)
    }

    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { settings } = await request.json(); // Array of { key, value }
    
    for (const s of settings) {
      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
