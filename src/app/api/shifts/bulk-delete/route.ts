export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { month, year } = await request.json();

    if (month === undefined || year === undefined) {
      return NextResponse.json({ error: "Mes y año requeridos" }, { status: 400 });
    }

    // Calcular las fechas de inicio y fin del mes (usando UTC 12 para alinearnos con nuestra lógica de turnos)
    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    // Siguiente mes, día 1, restando 1 milisegundo nos da el fin del mes
    const endDate = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));

    const { count } = await prisma.shift.deleteMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: 'BULK_DELETE_SHIFTS',
        details: `Se eliminaron masivamente ${count} turnos del mes ${month + 1}/${year}`
      }
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
