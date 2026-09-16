export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user || user.role === "AGENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, type } = await request.json();

    // date is expected to be "yyyy-MM-dd"
    const [y, m, d] = date.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(y, m - 1, d, 12));

    const shift = await prisma.shift.update({
      where: { id: id },
      data: { date: parsedDate, type, isManual: true }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'MOVE_SHIFT',
        details: `Turno movido: ID ${shift.id} a ${parsedDate.toLocaleDateString()} (${type})`
      }
    });

    return NextResponse.json({ success: true, shift });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "El agente ya tiene un turno de este tipo asignado en esta fecha." }, { status: 400 });
    }
    return NextResponse.json({ error: "Error updating shift" }, { status: 500 });
  }
}
