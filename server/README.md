# SEYVEO Intelligence · Hybrid Core

Подготовлено **собственное серверное ядро** SEYVEO. Владелец установил `qwen3:4b-instruct` в Ollama на Windows и получил настоящий локальный ответ; **подключение нового кода на его ПК ещё не проверено**. Облачный GPT-6 по-прежнему не подключён.

- `hybrid-core.mjs`: локальный / облачный маршрут и защита.
- `providers.mjs`: собственная Ollama / OpenAI GPT-6 Responses API.
- `brain.mjs`: единый ответ без изменения данных.
- `chat-local.mjs` и `start-felix-local.cmd`: локальный чат SEYVEO на Windows через Ollama без облака, требуется Node.js 22+.
- `http.mjs`: приватный сервер только на 127.0.0.1; токен обязателен.
- `tests/core.test.mjs`: проверки маршрутов без реальных запросов к ИИ.

Документация: [SEYVEO-HYBRID-CORE.md](../docs/SEYVEO-HYBRID-CORE.md).

Проверка: `node --test server/tests/*.test.mjs` из корня репозитория.

**Не открывать порт в интернет; не вставлять API-ключ в PWA или репозиторий.**
