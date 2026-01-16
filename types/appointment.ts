export interface Appointment {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  status: string
  patient?: { id: string; name: string; email: string }
  provider?: { id: string; name: string; email: string }
  appointmentType?: { id: string; name: string; duration: number; price: number }
  intakeForms?: string
  notes?: string
  clinicalNotes?: string
}
