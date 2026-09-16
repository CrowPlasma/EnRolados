import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generate() {
  const users = await prisma.user.findMany({
    where: { role: 'AGENT' }
  })
  
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  console.log(`Generando turnos con cobertura 24/7 para ${users.length} agentes para el mes ${month + 1}/${year}`)
  
  let createdCount = 0;
  
  for (const user of users) {
    const defaultShift = user.defaultShift || 'M_12H'
    
    let homeOfficeDays = []
    let workDays = [1,2,3,4,5] // default to Mon-Fri if error
    
    try {
      homeOfficeDays = JSON.parse(user.homeOfficeDays || '[]')
      const pWork = JSON.parse(user.workDays || '[]')
      if (Array.isArray(pWork) && pWork.length > 0) {
        workDays = pWork
      }
    } catch(e) {}
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const weekDay = date.getDay() // 0=Sunday, 1=Monday...
      
      if (workDays.includes(weekDay)) {
        let actualShift = defaultShift
        
        // Asignar guardias de forma esporádica SÓLO en fines de semana
        // con un 30% de probabilidad (para que no sea todos los fines de semana).
        if ((weekDay === 0 || weekDay === 6) && Math.random() < 0.3) {
          actualShift = 'GUARD'
        }
        
        // Evitar que el Gerente o Subgerente hagan guardias
        if ((user.level === 'Gerente SOC' || user.level === 'Subgerente') && actualShift === 'GUARD') {
           actualShift = defaultShift
        }

        const isHomeOffice = homeOfficeDays.includes(weekDay)
        
        await prisma.shift.upsert({
          where: {
            userId_date_type: {
              userId: user.id,
              date: date,
              type: actualShift
            }
          },
          update: {
            isHomeOffice
          },
          create: {
            userId: user.id,
            date: date,
            type: actualShift,
            isHomeOffice,
            isManual: false
          }
        })
        createdCount++
      }
    }
  }
  
  console.log(`Se han creado o actualizado ${createdCount} turnos. Cobertura de fin de semana y guardias esporádicas aplicadas.`)
}

generate()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
