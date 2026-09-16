export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, defaultShift: true, workDays: true, homeOfficeDays: true, showInCalendar: true, level: true, email: true, phone: true, createdAt: true }
    })
    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    console.log("POST /api/users - Session evaluated:", session);
    
    if (!session) {
      console.log("POST /api/users - NO SESSION FOUND");
      return NextResponse.json({ error: "No autorizado (Sesión no encontrada)" }, { status: 403 });
    }
    
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
      console.log("POST /api/users - BAD ROLE:", session.role);
      return NextResponse.json({ error: "No autorizado (Rol incorrecto)" }, { status: 403 });
    }

    const { username, name, role, defaultShift, workDays, homeOfficeDays, level, email, phone } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "El nombre de usuario ya existe" }, { status: 400 });
    }

    // Force default password
    const passwordHash = await bcrypt.hash("1234567890", 10);
    
    const parsedWorkDays = typeof workDays === 'string' ? JSON.parse(workDays) : (workDays || {});

    let finalRole = role || 'AGENT'
    if (session.role !== 'SUPER_ADMIN' && finalRole !== 'AGENT') {
      finalRole = 'AGENT'
    }

    const parsedHomeOfficeDays: number[] = Array.isArray(homeOfficeDays) ? homeOfficeDays : [];

    const user = await prisma.user.create({
      data: {
        username,
        name,
        passwordHash,
        role: finalRole,
        defaultShift: defaultShift || "MORNING",
        workDays: JSON.stringify(parsedWorkDays),
        homeOfficeDays: JSON.stringify(parsedHomeOfficeDays),
        level: level || "N1",
        email: email || null,
        phone: phone || null,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: 'CREATE_USER',
        details: `Nuevo usuario creado: ${username} (Rol: ${role}, Nivel: ${level})`
      }
    });

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
