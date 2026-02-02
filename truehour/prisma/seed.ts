import { prisma } from "../src/lib/prisma/client";

async function main() {
  await prisma.user.upsert({
    where: { email: "demo@truehour.local" },
    update: {},
    create: {
      email: "demo@truehour.local",
      name: "TrueHour Demo",
      defaultHourlyRate: 5000,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
