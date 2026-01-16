import { requireAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import AppointmentTypeManagement from "@/components/admin-appointment-types"

export default async function AdminAppointmentTypesPage() {
  const session = await requireAdmin()
  
  if (!session) {
    redirect("/login")
  }

  return <AppointmentTypeManagement />
}
