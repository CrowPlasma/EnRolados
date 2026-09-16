export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const rawCookieHeader = request.headers.get('cookie') || '(vacío)'
    const session = await getUserFromRequest(request)
    const users = await prisma.user.findMany({
      select: { username: true, role: true }
    })
    
    return NextResponse.json({
      rawCookieHeader,
      sessionStatus: session ? "ACTIVA" : "NO ENCONTRADA",
      sessionPayload: session,
      allUsers: users
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) })
  }
}
