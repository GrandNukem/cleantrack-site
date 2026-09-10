export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // Форма: POST /api/lead
    // ==========================================
    if (url.pathname === "/api/lead") {
      // Разрешаем только POST
      if (request.method !== "POST") {
        return json(
          { ok: false, error: "Метод не поддерживается." },
          405
        );
      }

      // Проверяем Content-Type
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        return json(
          { ok: false, error: "Неверный формат данных." },
          415
        );
      }

      // Получаем IP посетителя от Cloudflare
      const clientIp =
        request.headers.get("CF-Connecting-IP") || "unknown";

      // Базовая защита от повторных отправок:
      // один IP — одна заявка примерно раз в 60 секунд.
      const cache = caches.default;
      const rateKey = new Request(
        `https://rate-limit.local/${encodeURIComponent(clientIp)}`
      );

      const alreadySent = await cache.match(rateKey);

      if (alreadySent) {
        return json(
          {
            ok: false,
            error: "Слишком много отправок. Попробуйте ещё раз через минуту."
          },
          429
        );
      }

      try {
        const data = await request.json();

        const name = String(data.name || "").trim();
        const phone = String(data.phone || "").trim();
        const message = String(data.message || "").trim();
        const website = String(data.website || "").trim();

if (website) {
  return json({ ok: true }, 200);
}

        // Обязательные поля
        if (!name || !phone) {
          return json(
            {
              ok: false,
              error: "Не заполнены обязательные поля."
            },
            400
          );
        }

        // Защита от слишком длинного мусора
        if (name.length > 100) {
          return json(
            {
              ok: false,
              error: "Слишком длинное имя."
            },
            400
          );
        }

        if (phone.length > 30) {
          return json(
            {
              ok: false,
              error: "Некорректный телефон."
            },
            400
          );
        }

        if (message.length > 1000) {
          return json(
            {
              ok: false,
              error: "Слишком длинный комментарий."
            },
            400
          );
        }

        // Проверяем, что телефон похож на настоящий номер.
        const phoneDigits = phone.replace(/\D/g, "");

        if (phoneDigits.length < 10 || phoneDigits.length > 15) {
          return json(
            {
              ok: false,
              error: "Проверьте номер телефона."
            },
            400
          );
        }

        // Формируем сообщение для Telegram
        const telegramText =
          "🔔 Новая заявка с сайта\n\n" +
          "👤 Имя: " + name + "\n" +
          "📞 Телефон: " + phone + "\n" +
          (message
            ? "💬 Комментарий: " + message + "\n"
            : "") +
          "\n🌐 Чистый след";

        // Отправляем в Telegram
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
          return json(
            {
              ok: false,
              error: "Не удалось отправить заявку."
            },
            502
          );
        }

        // Ставим cooldown только после успешной отправки
        const lockResponse = new Response("1", {
          headers: {
            "Cache-Control": "max-age=60"
          }
        });

        ctx.waitUntil(cache.put(rateKey, lockResponse));

        return json({ ok: true }, 200);

      } catch (error) {
        return json(
          {
            ok: false,
            error: "Ошибка обработки заявки."
          },
          500
        );
      }
    }

    // Всё остальное отдаём статическому сайту
    return env.ASSETS.fetch(request);
  }
};


function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
