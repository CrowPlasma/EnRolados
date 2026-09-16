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

    const users = await prisma.user.findMany();
    
    // Fetch available shift types to randomize
    const shiftTypesSetting = await prisma.setting.findUnique({ where: { key: 'shift_types' } });
    let availableShiftIds = ['MORNING', 'EVENING', 'NIGHT']; // default fallback
    if (shiftTypesSetting && shiftTypesSetting.value) {
      try {
        const types = JSON.parse(shiftTypesSetting.value);
        if (Array.isArray(types) && types.length > 0) {
          availableShiftIds = types.map((t: any) => t.id);
        }
      } catch(e) {}
    }

    let createdCount = 0;

    // Count users per level to calculate per-level coverage requirements
    const levelCounts = new Map<string, number>();
    for (const u of users) {
      const lvl = u.level || 'Sin Nivel';
      levelCounts.set(lvl, (levelCounts.get(lvl) || 0) + 1);
    }

    // Track how many users are off on each DAY OF WEEK *PER LEVEL* to prevent 0 coverage
    // Key: `${level}_${dayOfWeek}`
    const offCountPerLevelWeekday = new Map<string, number>();

    // Shuffle users to avoid punishing the last users in the list
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

    for (const user of shuffledUsers) {
      const lvl = user.level || 'Sin Nivel';
      const usersInLevel = levelCounts.get(lvl) || 1;
      
      // Calculate max off allowed for this specific level
      let maxOffForLevel = usersInLevel - 1; // At least 1 person working
      if (usersInLevel === 1) maxOffForLevel = 7; // If only 1 person in level, they must be allowed to rest
      else if (usersInLevel >= 3) maxOffForLevel = usersInLevel - 2; // If 3+ people, guarantee at least 2 working

      let parsedWorkDays = typeof user.workDays === 'string' ? JSON.parse(user.workDays as string) : (user.workDays || {});
      const defaultShift = user.defaultShift || 'MORNING';

      if (Array.isArray(parsedWorkDays)) {
        const legacyObj: any = {};
        parsedWorkDays.forEach((d: number) => { legacyObj[d.toString()] = defaultShift; });
        parsedWorkDays = legacyObj;
      }

      // Fetch absences for this user to avoid generating shifts on those days
      const userAbsences = await prisma.absence.findMany({
        where: { userId: user.id }
      });

      for (let mOffset = 0; mOffset <= 0; mOffset++) {
        const targetMonthDate = new Date(year, month + mOffset, 1);
        const targetYear = targetMonthDate.getFullYear();
        const targetMonth = targetMonthDate.getMonth();
        
        const workDaysCount = Object.keys(parsedWorkDays).filter(k => parsedWorkDays[k] !== 'OFF').length;
        const offDaysCount = Math.max(0, Math.min(7 - workDaysCount, 3)); // Max 3 rest days

        // Generate the 7-day pattern for this user
        const shiftType = availableShiftIds[Math.floor(Math.random() * availableShiftIds.length)];

        // Update the user's defaultShift in DB so they are correctly grouped in the calendar UI
        await prisma.user.update({
          where: { id: user.id },
          data: { defaultShift: shiftType }
        });

        const weekDays = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
        const shuffledWeekDays = [...weekDays].sort(() => Math.random() - 0.5);
        
        const userOffDays = new Set<number>();
        let pickedOff = 0;
        
        for (const d of shuffledWeekDays) {
          const key = `${lvl}_${d}`;
          const currentOffs = offCountPerLevelWeekday.get(key) || 0;
          if (currentOffs < maxOffForLevel) {
            userOffDays.add(d);
            offCountPerLevelWeekday.set(key, currentOffs + 1);
            pickedOff++;
          }
          if (pickedOff >= offDaysCount) break;
        }

        // Generate Home Office Days for this user (Max 2-3 per week)
        const workDaysOfWeek = weekDays.filter(d => !userOffDays.has(d));
        const shuffledWorkDays = [...workDaysOfWeek].sort(() => Math.random() - 0.5);
        
        const hoToPick = Math.random() > 0.5 ? 3 : 2; 
        const userHoDays = new Set<number>();
        for (let i = 0; i < Math.min(hoToPick, shuffledWorkDays.length); i++) {
          userHoDays.add(shuffledWorkDays[i]);
        }
        
        const date = new Date(Date.UTC(targetYear, targetMonth, 1, 12));
        
        // Fetch all existing shifts for this user in this month to avoid 31 DB queries
        const existingShifts = await prisma.shift.findMany({
          where: {
            userId: user.id,
            date: {
              gte: new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0)),
              lte: new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59))
            }
          },
          select: { date: true }
        });
        const existingDates = new Set(existingShifts.map(s => s.date.toISOString().split('T')[0]));

        const shiftsToCreate = [];

        while (date.getUTCMonth() === targetMonth) {
          const dayOfWeek = date.getUTCDay();
          
          const isWorkDay = !userOffDays.has(dayOfWeek);
          
          if (isWorkDay) {
            // Check if user is absent on this date
            const isAbsent = userAbsences.some(a => {
              const start = new Date(a.startDate).setUTCHours(0,0,0,0);
              const end = new Date(a.endDate).setUTCHours(23,59,59,999);
              const time = date.getTime();
              return time >= start && time <= end;
            });

            if (!isAbsent) {
              const dateStr = date.toISOString().split('T')[0];
              if (!existingDates.has(dateStr)) {
                shiftsToCreate.push({
                  userId: user.id,
                  date: new Date(date),
                  type: shiftType,
                  isHomeOffice: userHoDays.has(dayOfWeek)
                });
                createdCount++;
              }
            }
          }
          date.setUTCDate(date.getUTCDate() + 1);
        }

        // Bulk insert shifts for this user
        if (shiftsToCreate.length > 0) {
          await prisma.shift.createMany({
            data: shiftsToCreate
          });
        }
      }
    }

    return NextResponse.json({ success: true, count: createdCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
