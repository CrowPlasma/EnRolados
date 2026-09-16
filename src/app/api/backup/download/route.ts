export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload || userPayload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Solo Super Administradores pueden descargar backups.' }, { status: 403 })
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    
    // Forzar a que SQLite escriba todos los cambios del archivo WAL a dev.db
    // para que el backup esté 100% completo y actualizado.
    try {
      await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);')
    } catch (e) {
      console.warn('No se pudo ejecutar wal_checkpoint, ignorando:', e)
    }

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Base de datos no encontrada.' }, { status: 404 })
    }

    const stat = fs.statSync(dbPath)
    
    const stream = new ReadableStream({
      start(controller) {
        const downloadStream = fs.createReadStream(dbPath)
        downloadStream.on('data', (chunk: any) => controller.enqueue(new Uint8Array(chunk)))
        downloadStream.on('end', () => controller.close())
        downloadStream.on('error', (error) => controller.error(error))
      }
    })
    
    const date = new Date()
    const dateString = date.toISOString().split('T')[0]
    const filename = `backup-enrolados-${dateString}.db`

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size.toString(),
      },
    })
  } catch (error) {
    console.error('Error al descargar backup:', error)
    return NextResponse.json({ error: 'Error interno del servidor al procesar la descarga.' }, { status: 500 })
  }
}
