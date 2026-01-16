import { requirePatient } from "@/lib/rbac"
import { redirect } from "next/navigation"
import BookAppointment from "@/components/book-appointment"

export default async function BookAppointmentPage() {
  const session = await requirePatient()
  
  if (!session) {
    redirect("/login")
  }

  return <BookAppointment />
}
