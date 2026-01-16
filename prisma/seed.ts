import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@clinico.com" },
    update: {},
    create: {
      email: "admin@clinico.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      profileComplete: true,
    },
  })
  console.log("✅ Created admin user:", admin.email)

  // Create provider users
  const provider1Password = await bcrypt.hash("provider123", 10)
  const provider1 = await prisma.user.upsert({
    where: { email: "doctor.smith@clinico.com" },
    update: {},
    create: {
      email: "doctor.smith@clinico.com",
      name: "Dr. Sarah Smith",
      password: provider1Password,
      role: "PROVIDER",
      phone: "+1-555-0101",
      profileComplete: true,
    },
  })
  console.log("✅ Created provider 1:", provider1.email)

  const provider2Password = await bcrypt.hash("provider123", 10)
  const provider2 = await prisma.user.upsert({
    where: { email: "doctor.jones@clinico.com" },
    update: {},
    create: {
      email: "doctor.jones@clinico.com",
      name: "Dr. John Jones",
      password: provider2Password,
      role: "PROVIDER",
      phone: "+1-555-0102",
      profileComplete: true,
    },
  })
  console.log("✅ Created provider 2:", provider2.email)

  // Create patient user
  const patientPassword = await bcrypt.hash("patient123", 10)
  const patient = await prisma.user.upsert({
    where: { email: "patient@clinico.com" },
    update: {},
    create: {
      email: "patient@clinico.com",
      name: "Jane Patient",
      password: patientPassword,
      role: "PATIENT",
      phone: "+1-555-0201",
      profileComplete: true,
    },
  })
  console.log("✅ Created patient user:", patient.email)

  // Create appointment types
  const appointmentTypes = [
    {
      name: "General Consultation",
      description: "Standard 30-minute consultation",
      duration: 30,
      bufferTime: 10,
      price: 150.0,
      createdById: admin.id,
    },
    {
      name: "Follow-up Visit",
      description: "15-minute follow-up appointment",
      duration: 15,
      bufferTime: 5,
      price: 75.0,
      createdById: admin.id,
    },
    {
      name: "Annual Checkup",
      description: "Comprehensive 60-minute annual checkup",
      duration: 60,
      bufferTime: 15,
      price: 300.0,
      createdById: admin.id,
    },
  ]

  const createdTypes = []
  for (const type of appointmentTypes) {
    const existing = await prisma.appointmentType.findFirst({
      where: { name: type.name },
    })
    if (existing) {
      createdTypes.push(existing)
      console.log("✅ Appointment type already exists:", existing.name)
    } else {
      const created = await prisma.appointmentType.create({
        data: type,
      })
      createdTypes.push(created)
      console.log("✅ Created appointment type:", created.name)
    }
  }

  // Create availability for providers
  const daysOfWeek = [1, 2, 3, 4, 5] // Monday to Friday
  for (const provider of [provider1, provider2]) {
    for (const day of daysOfWeek) {
      await prisma.availability.upsert({
        where: {
          userId_dayOfWeek: {
            userId: provider.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          userId: provider.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          isAvailable: true,
        },
      })
    }
    console.log(`✅ Created availability for ${provider.name}`)
  }

  // Create sample appointments
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(14, 0, 0, 0)

  const appointments = [
    {
      patientId: patient.id,
      providerId: provider1.id,
      appointmentTypeId: createdTypes[0].id,
      title: "General Consultation",
      description: "Initial consultation with Dr. Smith",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000),
      status: "SCHEDULED",
    },
    {
      patientId: patient.id,
      providerId: provider2.id,
      appointmentTypeId: createdTypes[1].id,
      title: "Follow-up Visit",
      description: "Follow-up appointment",
      startTime: nextWeek,
      endTime: new Date(nextWeek.getTime() + 15 * 60000),
      status: "SCHEDULED",
    },
  ]

  for (const apt of appointments) {
    await prisma.appointment.create({
      data: apt,
    })
    console.log("✅ Created appointment:", apt.title)
  }

  // Create clinic policy
  await prisma.clinicPolicy.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      cancellationCutoffHours: 24,
      rescheduleCutoffHours: 12,
      officeHoursStart: "09:00",
      officeHoursEnd: "17:00",
      officeDays: "1,2,3,4,5",
    },
  })
  console.log("✅ Created clinic policy")

  console.log("\n🎉 Seeding completed!")
  console.log("\n📋 Demo Credentials:")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("Admin:")
  console.log("  Email: admin@clinico.com")
  console.log("  Password: admin123")
  console.log("\nProvider 1:")
  console.log("  Email: doctor.smith@clinico.com")
  console.log("  Password: provider123")
  console.log("\nProvider 2:")
  console.log("  Email: doctor.jones@clinico.com")
  console.log("  Password: provider123")
  console.log("\nPatient:")
  console.log("  Email: patient@clinico.com")
  console.log("  Password: patient123")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
