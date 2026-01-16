import { requireProvider } from "@/lib/rbac"
import { redirect } from "next/navigation"
import AppointmentDetails from "@/components/appointment-details"

export default async function ProviderAppointmentPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireProvider()
  
  if (!session) {
    redirect("/login")
  }

  return <AppointmentDetails appointmentId={params.id} />
}
