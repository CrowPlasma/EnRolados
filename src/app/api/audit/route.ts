export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getUserFromRequest(request)
    // Only super admin can view audit logs
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const auditLogs = await prisma.auditLog.findMany({
      include: {
        actor: { select: { name: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // limit to last 100 for now
    })
    
    return NextResponse.json({ auditLogs })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
