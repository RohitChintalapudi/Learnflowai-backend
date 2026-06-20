import { prisma } from "./database/prisma";
import { AnalyticsEventType } from "./modules/analytics/analytics.tracker";

async function main() {
  console.log("Seeding Analytics Data...");
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found. Please login and create an account first.");
    return;
  }
  const userId = user.id;

  // Clear existing analytics for user
  await prisma.analyticsEvent.deleteMany({ where: { userId } });
  await prisma.userTopic.deleteMany({ where: { userId } });

  console.log(`Seeding for user: ${userId}`);

  // Create Topics
  const topics = [
    "Machine Learning Basics", "Neural Networks", "Calculus", 
    "Linear Algebra", "Data Structures", "React Hooks",
    "PostgreSQL", "Docker", "Kubernetes", "TypeScript"
  ];

  for (let i = 0; i < topics.length; i++) {
    const lastStudied = new Date();
    // Some dormant, some recent
    lastStudied.setDate(lastStudied.getDate() - (i % 2 === 0 ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 3)));
    
    await prisma.userTopic.create({
      data: {
        userId,
        topic: topics[i],
        frequency: Math.floor(Math.random() * 15) + 2,
        lastStudiedAt: lastStudied
      }
    });
  }

  // Create Events
  const eventsToCreate: any[] = [];
  const now = new Date();
  
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    
    // Simulating random activity for each day
    const numEvents = Math.floor(Math.random() * 10); 
    
    for (let j = 0; j < numEvents; j++) {
      const eventTime = new Date(d);
      eventTime.setHours(Math.floor(Math.random() * 8) + 12); // Between 12 PM and 8 PM
      
      const eventTypes = Object.values(AnalyticsEventType);
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      eventsToCreate.push({
        userId,
        eventType: randomEvent,
        createdAt: eventTime
      });
    }
  }

  if (eventsToCreate.length > 0) {
    await prisma.analyticsEvent.createMany({
      data: eventsToCreate
    });
  }

  console.log(`Successfully seeded ${eventsToCreate.length} analytics events and ${topics.length} topics!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
