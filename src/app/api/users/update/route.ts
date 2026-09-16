export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload || (userPayload.role !== 'SUPER_ADMIN' && userPayload.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { userId, newPassword, newRole } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID de usuario' }, { status: 400 })
    }

    const dataToUpdate: any = {}

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
      }
      dataToUpdate.passwordHash = await bcrypt.hash(newPassword, 10)
    }

    if (newRole && userPayload.role === 'SUPER_ADMIN') {
      dataToUpdate.role = newRole
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: { id: true, username: true, name: true, role: true }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
