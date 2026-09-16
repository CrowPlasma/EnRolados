export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserFromRequest(request);
    
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const absence = await prisma.absence.findUnique({ where: { id } });
    if (!absence) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    await prisma.absence.delete({
      where: { id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: 'DELETE_ABSENCE',
        details: `Ausencia eliminada para usuario ID ${absence.userId}`
      }
    })

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
