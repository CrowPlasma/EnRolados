'use client'

import { useAuth } from '@/components/AuthProvider'
import { useLanguage } from '@/i18n/LanguageProvider'
import MonthlyCalendar from '@/components/MonthlyCalendar'

export default function CalendarPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  if (!user) {
    return <div className="content-area">{t.common.loading}</div>
  }

  return (
    <div className="content-area">
      <h1>{t.calendar.title}</h1>
      <p className="subtitle">{t.calendar.subtitle}</p>
      
      <MonthlyCalendar />
    </div>
  )
}
