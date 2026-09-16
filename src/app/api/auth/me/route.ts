export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)

    if (!userPayload) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.id },
      select: { id: true, username: true, name: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
