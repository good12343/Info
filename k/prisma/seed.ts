import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.task.createMany({
    data: [
      {
        id: 'task_x_follow',
        title: 'Follow us on X',
        description: 'Follow our official account on X (Twitter)',
        points: 10,
        platform: 'X',
        category: 'SOCIAL',
        url: 'https://x.com/yourproject',
        isActive: true,
      },
      {
        id: 'task_telegram_join',
        title: 'Join Telegram Group',
        description: 'Join our official Telegram community',
        points: 10,
        platform: 'TELEGRAM',
        category: 'SOCIAL',
        url: 'https://t.me/yourproject',
        isActive: true,
      },
      {
        id: 'task_youtube_sub',
        title: 'Subscribe on YouTube',
        description: 'Subscribe to our YouTube channel',
        points: 15,
        platform: 'YOUTUBE',
        category: 'VIDEO',
        url: 'https://youtube.com/@yourproject',
        isActive: true,
      },
      {
        id: 'task_read_article',
        title: 'Read Project Article',
        description: 'Read our official documentation article',
        points: 20,
        platform: 'ARTICLE',
        category: 'ARTICLE',
        url: 'https://yourproject.com/docs',
        isActive: true,
      },
      {
        id: 'task_retweet',
        title: 'Retweet Announcement',
        description: 'Retweet pinned announcement on X',
        points: 12,
        platform: 'X',
        category: 'SOCIAL',
        url: 'https://x.com/yourproject/status/1',
        isActive: true,
      },
    ],
  });

  console.log('Tasks seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });