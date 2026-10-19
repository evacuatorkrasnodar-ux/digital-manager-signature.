# SEYVEO Intelligence · Hybrid Core

Сегодня подготовлено **собственное серверное ядро** SEYVEO, но **ни одна языковая модель ещё не подключена**.

- `hybrid-core.mjs`: локальный / облачный маршрут и защита.
- `providers.mjs`: собственная Ollama / OpenAI GPT-6 Responses API.
- `brain.mjs`: единый ответ без изменения данных.
- `http.mjs`: приватный сервер только на 127.0.0.1; токен обязателен.
- `tests/core.test.mjs`: проверки маршрутов без реальных запросов к ИИ.

Документация: [SEYVEO-HYBRID-CORE.md](../docs/SEYVEO-HYBRID-CORE.md).

Проверка: `node --test server/tests/*.test.mjs` из корня репозитория.

**Не открывать порт в интернет; не вставлять API-ключ в PWA или репозиторий.**
