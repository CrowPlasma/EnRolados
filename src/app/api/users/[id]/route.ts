export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserFromRequest(request);
    
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { role, defaultShift, workDays, homeOfficeDays, showInCalendar, level, email, phone, targetMonth, targetYear } = body;

    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const dataToUpdate: any = {};
    if (role && session.role === "SUPER_ADMIN") dataToUpdate.role = role;
    if (defaultShift) dataToUpdate.defaultShift = defaultShift;
    if (workDays) dataToUpdate.workDays = JSON.stringify(workDays);
    if (homeOfficeDays !== undefined) dataToUpdate.homeOfficeDays = JSON.stringify(homeOfficeDays);
    if (showInCalendar !== undefined) dataToUpdate.showInCalendar = showInCalendar;
    if (level !== undefined) dataToUpdate.level = level;
    if (email !== undefined) dataToUpdate.email = email;
    if (phone !== undefined) dataToUpdate.phone = phone;

    // Detect changes
    const changes: string[] = [];
    for (const key in dataToUpdate) {
      if ((oldUser as any)[key] !== dataToUpdate[key]) {
        changes.push(`${key}: ${(oldUser as any)[key]} -> ${dataToUpdate[key]}`);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    // Auto-generate or update shifts for the specified month if workDays was updated
    if (workDays) {
      const now = new Date();
      const tYear = targetYear !== undefined ? parseInt(targetYear, 10) : now.getFullYear();
      const tMonth = targetMonth !== undefined ? parseInt(targetMonth, 10) : now.getMonth();
      
      const shiftsToCreate = [];
      const shiftIdsToDelete = [];
      const shiftsToUpdate = [];

      let parsedWorkDays = typeof workDays === 'string' ? JSON.parse(workDays) : workDays;
      const parsedHoDays: number[] = Array.isArray(homeOfficeDays) ? homeOfficeDays : [];

      // Handle legacy array format if somehow passed
      if (Array.isArray(parsedWorkDays)) {
        const legacyShift = user.defaultShift || 'MORNING';
        const newObj: any = {};
        parsedWorkDays.forEach((d: number) => { newObj[d.toString()] = legacyShift; });
        parsedWorkDays = newObj;
      }

      // Fetch absences for this user to avoid generating shifts on those days
      const userAbsences = await prisma.absence.findMany({
        where: { userId: id }
      });

      const date = new Date(Date.UTC(tYear, tMonth, 1, 12));
      while (date.getUTCMonth() === tMonth) {
          const dayOfWeek = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
          
          const shiftType = parsedWorkDays[dayOfWeek.toString()];
          const isWorkDay = shiftType && shiftType !== "OFF";

          // Check if user is absent on this date
          const isAbsent = userAbsences.some(a => {
            const start = new Date(a.startDate).setUTCHours(0,0,0,0);
            const end = new Date(a.endDate).setUTCHours(23,59,59,999);
            const time = date.getTime();
            return time >= start && time <= end;
          });

          const existing = await prisma.shift.findFirst({
            where: { userId: id, date: date }
          });

          if (isWorkDay && !isAbsent) {
            const isHO = parsedHoDays.includes(dayOfWeek);
            if (!existing) {
              shiftsToCreate.push({
                userId: id,
                date: new Date(date),
                type: shiftType,
                isHomeOffice: isHO
              });
            } else if (!existing.isManual && (existing.type !== shiftType || existing.isHomeOffice !== isHO)) {
              shiftsToUpdate.push({
                id: existing.id,
                type: shiftType,
                isHomeOffice: isHO
              });
            }
          } else {
            // Not a work day or absent. If an auto-generated shift exists, delete it.
            if (existing && !existing.isManual) {
              shiftIdsToDelete.push(existing.id);
            }
          }

          date.setUTCDate(date.getUTCDate() + 1);
        }

      if (shiftsToCreate.length > 0) {
        await prisma.shift.createMany({ data: shiftsToCreate });
      }
      
      if (shiftIdsToDelete.length > 0) {
        await prisma.shift.deleteMany({
          where: { id: { in: shiftIdsToDelete } }
        });
      }

      for (const s of shiftsToUpdate) {
        await prisma.shift.update({
          where: { id: s.id },
          data: { type: s.type, isHomeOffice: s.isHomeOffice }
        });
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: 'UPDATE_USER',
        details: `Usuario actualizado: ${user.username} (ID: ${user.id})`
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getUserFromRequest(request);
    
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (session.id === id) {
      return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
    }

    // Delete associated shifts first to respect foreign keys (Prisma might cascade, but it's safer)
    await prisma.shift.deleteMany({
      where: { userId: id }
    });

    const deletedUser = await prisma.user.delete({
      where: { id }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: 'DELETE_USER',
        details: `Usuario eliminado: ${deletedUser.username} (ID: ${deletedUser.id})`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
