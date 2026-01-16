import { requirePatient } from "@/lib/rbac"
import { redirect } from "next/navigation"
import PatientDashboard from "@/components/patient-dashboard"

export default async function PatientPage() {
  const session = await requirePatient()
  
  if (!session) {
    redirect("/login")
  }

  return <PatientDashboard />
}
