export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { signToken, verifyToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { tempToken, newPassword, email, phone } = await request.json()

    if (!tempToken || !newPassword || !email) {
      return NextResponse.json({ error: 'Faltan datos requeridos (incluyendo correo)' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    if (newPassword === '1234567890') {
      return NextResponse.json({ error: 'No puedes usar la contraseña por defecto' }, { status: 400 })
    }

    const payload = verifyToken(tempToken)
    if (!payload || !payload.id || !payload.isTemp) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const updatedUser = await prisma.user.update({
      where: { id: payload.id },
      data: { 
        passwordHash,
        email,
        phone: phone || null
      }
    })

    const token = signToken({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      name: updatedUser.name
    })

    const response = NextResponse.json({
      message: 'Contraseña actualizada y sesión iniciada',
      user: { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role, name: updatedUser.name }
    })

    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: false, // Disabling secure to allow login over HTTP on local network
      maxAge: 60 * 60 * 12 // 12 hours
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
