import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

const SHIFT_TYPES = [
  { id: 'M_12H', name: 'Matutino 12hrs', time: '07:00 - 19:00', color: 'blue', isNight: false },
  { id: 'N_12H', name: 'Nocturno 12hrs', time: '19:00 - 07:00', color: 'indigo', isNight: true },
  { id: 'D_9H', name: 'Día 9hrs', time: '09:00 - 18:00', color: 'green', isNight: false },
  { id: 'N_9H', name: 'Noche 9hrs', time: '22:00 - 07:00', color: 'purple', isNight: true },
  { id: 'GUARD', name: 'Guardia', time: 'Variable', color: 'orange', isNight: false }
]

const AGENTS = [
  // Liderazgo
  { name: 'Carlos Mendoza', username: 'cmendoza', level: 'Gerente SOC' },
  { name: 'Ana Salazar', username: 'asalazar', level: 'Subgerente' },
  
  // Equipos Especializados
  { name: 'David Robles', username: 'drobles', level: 'Orquestación' },
  { name: 'Sofia Torres', username: 'storres', level: 'Cambios' },
  { name: 'Luis Navarro', username: 'lnavarro', level: 'Triage' },
  { name: 'Elena Vargas', username: 'evargas', level: 'Respuesta (IR)' },
  { name: 'Javier Pino', username: 'jpino', level: 'Respuesta (IR)' },

  // Nivel 3
  { name: 'Roberto Diaz', username: 'rdiaz', level: 'N3' },
  { name: 'Monica Rios', username: 'mrios', level: 'N3' },
  { name: 'Fernando Solis', username: 'fsolis', level: 'N3' },
  { name: 'Patricia Vega', username: 'pvega', level: 'N3' },

  // Nivel 2
  { name: 'Jorge Marin', username: 'jmarin', level: 'N2' },
  { name: 'Camila Reyes', username: 'creyes', level: 'N2' },
  { name: 'Diego Blanco', username: 'dblanco', level: 'N2' },
  { name: 'Valeria Luna', username: 'vluna', level: 'N2' },

  // Nivel 1
  { name: 'Andres Castro', username: 'acastro', level: 'N1' },
  { name: 'Silvia Moran', username: 'smoran', level: 'N1' },
  { name: 'Hector Salas', username: 'hsalas', level: 'N1' },
  { name: 'Raul Gomez', username: 'rgomez', level: 'N1' },
  { name: 'Carmen Rojas', username: 'crojas', level: 'N1' }
]

async function seed() {
  console.log('--- Iniciando Seed del Entorno SOC de Prueba ---')
  
  await prisma.shift.deleteMany()
  await prisma.absence.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany({
    where: { role: { not: 'SUPER_ADMIN' } }
  })
  
  const shiftTypesStr = JSON.stringify(SHIFT_TYPES)
  await prisma.setting.upsert({
    where: { key: 'shift_types' },
    update: { value: shiftTypesStr },
    create: { key: 'shift_types', value: shiftTypesStr }
  })

  const passwordHash = await hash('1234567890', 10)
  
  // Excluimos 'GUARD' de los turnos base para que nadie lo tenga como fijo todos los días
  const baseShiftIds = ['M_12H', 'N_12H', 'D_9H', 'N_9H']
  
  const profiles = [
    [1, 2, 3, 4, 5],       // Rest Sat/Sun
    [0, 1, 2, 3, 4],       // Rest Fri/Sat
    [2, 3, 4, 5, 6],       // Rest Sun/Mon
    [0, 3, 4, 5, 6],       // Rest Mon/Tue
    [0, 1, 4, 5, 6],       // Rest Tue/Wed
    [0, 1, 2, 5, 6],       // Rest Wed/Thu
    [0, 2, 3, 4, 6]        // Rest Mon/Fri
  ]
  
  for (let i = 0; i < AGENTS.length; i++) {
    const agent = AGENTS[i]
    
    let workDaysArray = profiles[i % profiles.length]
    if (agent.level === 'Gerente SOC' || agent.level === 'Subgerente') {
      workDaysArray = [1, 2, 3, 4, 5]
    }
    
    const shuffledWorkDays = [...workDaysArray].sort(() => Math.random() - 0.5)
    const homeOfficeDays = [shuffledWorkDays[0], shuffledWorkDays[1]].sort()

    const defaultShift = baseShiftIds[i % baseShiftIds.length]
    
    await prisma.user.create({
      data: {
        username: agent.username,
        name: agent.name,
        passwordHash,
        role: 'AGENT',
        level: agent.level,
        defaultShift: defaultShift,
        homeOfficeDays: JSON.stringify(homeOfficeDays),
        workDays: JSON.stringify(workDaysArray),
        email: agent.username + '@soc-test.com',
        showInCalendar: true
      }
    })
  }

  console.log('Usuarios base generados!')
}

seed()
  .catch(e => {
    console.error('Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
