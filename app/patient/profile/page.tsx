import { requirePatient } from "@/lib/rbac"
import { redirect } from "next/navigation"
import PatientProfile from "@/components/patient-profile"

export default async function PatientProfilePage() {
  const session = await requirePatient()
  
  if (!session) {
    redirect("/login")
  }

  return <PatientProfile />
}
