export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/test-telegram") {
      const botToken = env.TELEGRAM_BOT_TOKEN;
      const chatId = "341580952";

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🔔 Тест подключения\n\nCloudflare → Telegram работает."
        })
      });

      const result = await response.text();

      return new Response(result, {
        status: response.ok ? 200 : 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      });
    }

    return new Response("Worker работает.");
  }
};
