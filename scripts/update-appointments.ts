import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateAppointmentDates() {
  // Get today and tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all appointments
  const appointments = await prisma.appointment.findMany({
    orderBy: { scheduledStart: "asc" },
  });

  console.log(`Found ${appointments.length} appointments`);

  if (appointments.length === 0) {
    console.log("No appointments to update");
    return;
  }

  // Update appointments - spread them across today and tomorrow
  const half = Math.ceil(appointments.length / 2);

  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i];
    const originalStart = new Date(apt.scheduledStart);
    const originalEnd = new Date(apt.scheduledEnd);

    // Calculate duration
    const duration = originalEnd.getTime() - originalStart.getTime();

    // Keep the same time of day, just change the date
    const baseDate = i < half ? today : tomorrow;

    const newStart = new Date(baseDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

    const newEnd = new Date(newStart.getTime() + duration);

    await prisma.appointment.update({
      where: { id: apt.id },
      data: {
        scheduledStart: newStart,
        scheduledEnd: newEnd,
      },
    });

    console.log(`Updated appointment ${apt.id}: ${newStart.toISOString()} - ${newEnd.toISOString()}`);
  }

  console.log("Done updating appointments!");
}

updateAppointmentDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
