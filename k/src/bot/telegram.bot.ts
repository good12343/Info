// src/bot/telegram.bot.ts
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN!;

export const bot = new TelegramBot(token, {
  polling: true, // هذا أهم شيء
});

bot.on("message", async (msg) => {
  const userId = msg.from?.id;
  const username = msg.from?.username;

  console.log("NEW USER:");
  console.log("ID:", userId);
  console.log("USERNAME:", username);

  if (msg.text === "/start") {
    bot.sendMessage(
      msg.chat.id,
      "✅ تم ربط حسابك بنجاح، يمكنك العودة للموقع"
    );
  }
});