export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request)
    if (!userPayload || userPayload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado. Solo Super Administradores pueden restaurar backups.' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('backupFile') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const walPath = dbPath + '-wal'
    const shmPath = dbPath + '-shm'
    
    // Overwrite the existing DB file
    fs.writeFileSync(dbPath, buffer)

    // Borrar los archivos de la cache de SQLite (WAL) si existen,
    // de lo contrario SQLite sobreescribirá nuestro backup con los datos viejos que estaban en memoria
    if (fs.existsSync(walPath)) {
      try { fs.unlinkSync(walPath) } catch (e) { console.warn('No se pudo borrar wal', e) }
    }
    if (fs.existsSync(shmPath)) {
      try { fs.unlinkSync(shmPath) } catch (e) { console.warn('No se pudo borrar shm', e) }
    }

    // Schedule process termination after a brief delay
    // Docker will automatically restart the container because of "restart: unless-stopped"
    setTimeout(() => {
      console.log('Reiniciando el sistema por restauración de backup...')
      process.exit(0)
    }, 1500)

    return NextResponse.json({ success: true, message: 'Backup restaurado con éxito. El sistema se reiniciará en unos segundos.' })
  } catch (error) {
    console.error('Error al restaurar backup:', error)
    return NextResponse.json({ error: 'Error interno al restaurar la base de datos.' }, { status: 500 })
  }
}
