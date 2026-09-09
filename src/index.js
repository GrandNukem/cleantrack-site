export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Получение заявок с лендинга
    if (url.pathname === "/api/lead" && request.method === "POST") {
      try {
        const data = await request.json();

        const name = String(data.name || "").trim();
        const phone = String(data.phone || "").trim();
        const message = String(data.message || "").trim();

        if (!name || !phone) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Не заполнены обязательные поля."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json; charset=utf-8"
              }
            }
          );
        }

        const telegramText =
          "🔔 Новая заявка с сайта\n\n" +
          "👤 Имя: " + name + "\n" +
          "📞 Телефон: " + phone + "\n" +
          (message
            ? "💬 Комментарий: " + message + "\n"
            : "") +
          "\n🌐 Чистый след";

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: "341580952",
              text: telegramText
            })
          }
        );

        const telegramResult = await telegramResponse.json();

        if (!telegramResponse.ok || !telegramResult.ok) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Не удалось отправить заявку в Telegram."
            }),
            {
              status: 502,
              headers: {
                "Content-Type": "application/json; charset=utf-8"
              }
            }
          );
        }

        return new Response(
          JSON.stringify({
            ok: true
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Ошибка обработки заявки."
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json; charset=utf-8"
            }
          }
        );
      }
    }

    // Все остальные запросы отдаём обычному сайту
    return env.ASSETS.fetch(request);
  }
};
