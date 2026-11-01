# SEYVEO Browser — product plan, 01.11.2026

One browser, two distributions: embedded SEYVEO and standalone iOS/Android. Standalone browsing, history, favorites, and tabs must work free, without mandatory registration. A dismissible SEYVEO brand card may appear only on the standalone start page, never on third-party pages or inside embedded browser.

Cloud sync requires a verified entitlement, an account, and separate opt-in. Eligible purchases may include Browser Premium and relevant SEYVEO One/Business subscriptions. No automatic access to accounts on third-party websites.

CURRENT STATUS: assets/seyveo-browser.js and .css are a web prototype. Native web browsing and standalone app distribution are NOT implemented. mobile/src/browser/product-policy.mjs defines presentation capabilities only. It neither verifies purchases nor provides cloud sync.

NEXT: integrate real native browser with platform-approved WebViews; add shared navigation, safe local storage and clear privacy boundaries; separately build standalone app shell; verify on devices. Preserve existing Black Velvet design, tabs, plus, LED highlights, all five themes, optional automatic mode and the grey glass strip.

## Approved standalone themes (01.11.2026)

The independent SEYVEO Browser must offer all five existing app themes, with identical identity, glass, LED lighting and spacing:

| User theme | Existing stored value | Palette token | Contrast |
|---|---|---|---|
| White Velvet (default for first standalone install) | `light` | `white` | `light` |
| Classic Graphite | `graphite` | `graphite` | `dark` |
| Emerald Royale | `dark` | `emerald` | `dark` |
| Midnight Sapphire | `sapphire` | `sapphire` | `dark` |
| Copper Dune | `plum` | `plum` | `dark` |

`auto` is an additional mode, **not a sixth color theme**. It currently maps to Graphite with dark system appearance, White Velvet with light appearance, matching `index.html`'s current `applyTheme()` behavior.

The pure module `mobile/src/browser/browser-themes.mjs` represents these identities for future native and standalone shells. It is **not yet bound to a settings UI or a native render tree**, and does not duplicate the real color/glass/LED CSS tokens. A native implementation should reuse the design values established by the web prototype, including site-colored active tab LEDs, a grey glass navigation strip, and white readable text where required. Site content itself is not recolored.

No separate browser theme or palette defaults should silently override an explicit choice made by the user. For embedded Browser the theme follows SEYVEO's app settings; for standalone Browser it uses its own locally stored choice, optionally linked with SEYVEO after explicit account sync consent.

## Загрузки · первый этап (01.11.2026)

В отдельной ветке создана **нативная основа**, не выдавать за подключённую функцию действующего веб-прототипа:

- `mobile/src/browser/browser-download-core.mjs` — правила безопасного запроса, имя файла без переходов по каталогам, тип файла, состояния и реальные события прогресса; `*.d.mts` — типы.
- `mobile/src/browser/expo-browser-download-storage.mjs` — загрузка в собственную папку приложения (`Paths.document`), временный файл до успешного завершения, запись локального каталога, удаление ошибочных/неполных загрузок, список после перезапуска, открытие через системный preview **только по нажатию**.
- `mobile/src/browser/BrowserDownloadsPanel.tsx` — первый нативный интерфейс списка/ссылки/скачивания/прогресса/предпросмотра/удаления; цвета передаёт существующий тематический shell, чтобы использовать **все пять тем**, без отдельного визуального оформления.
- Размер одной загрузки для этого раннего этапа ограничен **75 МБ**. При доступных сигналах загрузки запрос прерывается при превышении лимита; после завершения размер проверяется повторно. Это не потоковая антивирусная проверка и не абсолютная защита от трафика при задержанных событиях.
- Принимаются прямые HTTPS-ссылки на обычные имена хостов. Ссылки `http:`, `file:`, `blob:`, локальные адреса и URL с учётными данными отклоняются. Авторизованные вложения/сайты, cookie-зависимые загрузки, POST, `Content-Disposition` и пересылка из WebView требуют отдельного этапа.
- Копии файлов хранятся локально в папке приложения, не передаются в облако SEYVEO автоматически. В имени файла и локальных метаданных могут содержаться чувствительные сведения. Перед публичным выпуском проверить модель шифрования, исключение из резервного копирования при необходимости, приватный режим, экспорт в «Файлы» и безопасное удаление.
- Сэйви **не получает содержимое скачанного автоматически**. Будущий анализ PDF/документа только после явного выбора пользователем, с предупреждением о возможной отправке текста в разрешённый ИИ-сервис.
- У панели нет собственного окна авторизации и подписки: локальные загрузки **бесплатны** и для гостей. Не запускать автоматически скачивания из WebView-сообщений неизвестных сайтов.

### Ещё НЕ сделано

Нативный браузер `mobile/App.tsx` пока не использует WebView, и панель загрузок пока не подключена к навигации. Текущий красивый встроенный веб-прототип (`assets/seyveo-browser.*`) намеренно **не изменён**. Прямая работа с реальными ссылками, кнопка скачивания в открытом сайте, системное сохранение/экспорт в папки пользователя, загрузки из сайтов с авторизацией и проверки на реальных устройствах остаются в очереди. Модульные smoke-проверки чистой модели **не заменяют** тест на iPhone и Android. Будущая интеграция с `react-native-webview` должна соблюдать ограничения платформ и учитывать, что `onFileDownload` доступен на iOS, а Android требует отдельной реализации.

## «Сэйви, посмотри» — подготовленный безопасный сценарий (01.11.2026)

В нативную панель «Загрузки» добавлено действие **«✦ Сэйви, посмотри»** на документах. Оно **ещё не видно в текущем браузере веб-прототипа**, потому что нативная панель не подключена к `mobile/App.tsx`.

- Для **TXT/CSV размером до 128 КБ** пользователь сначала подтверждает *локальное чтение*. Фрагмент до 6000 символов отображается на экране, ничего в облако не отправляется.
- Извлечение и анализ **PDF, DOCX, XLSX и других форматов** пока не выполнены: система честно предлагает только открыть файл.
- Функция `onSayviReview` — *необязательный будущий* адаптер ИИ. Пока он отсутствует, кнопка отправки отключена, а текст остаётся только в памяти экрана.
- При будущем подключении адаптера пользователь увидит передаваемый фрагмент и должен **отдельно** подтвердить его отправку в Сэйви. Протокол не передаёт `file://` URI или бинарное содержимое файла, только просмотренный текст. Backend должен заново проверять согласие, права доступа и не выполнять команды из непроверенного текста документа.
- При закрытии предпросмотра текст очищается из состояния интерфейса; он не записывается в журнал/историю/синхронизацию. Код не создаёт фоновую индексацию документов.
- Режимы и цвета родительского браузера сохраняются, дополнительных тем и декоративных экранов не создано.

Новые файлы: `mobile/src/browser/browser-document-review.mjs`, его декларация типов, автоматические проверки в `mobile/tests/browser-document-review.test.mjs`. Метод `readLocalTextPreview()` добавлен к `expo-browser-download-storage.mjs` только для файлов из управляемого хранилища.

**ВНИМАНИЕ:** это не рабочее объяснение PDF с помощью ИИ. Для него ещё потребуются проверенное извлечение текста или OCR, разрешённый AI-провайдер, отдельный выбор облачной/локальной обработки, защита от prompt injection и испытания на реальных iPhone/Android.

## PDF: локальное чтение с явным согласием — заготовка (01.11.2026)

**Подготовлено в отдельной ветке, не входит в действующий веб-прототип:**

- `mobile/src/browser/browser-pdf-review.mjs` — ограниченный разбор **настоящего текста PDF**, если нативный модуль передан в интерфейс через интерфейс `pdfExtractor`. Для корректного чтения используются методы `getPageCount(uri)`, `extractTextFromPage(uri,page)` и, опционально, `isAvailable()`. Нет встроенного OCR, облака или ИИ.
- Для первой версии ограничиваем локальное чтение PDF размером до **10 МБ**, не более **первых 8 страниц** и до **6000 символов** показываемого текста. Если прочитан только фрагмент, честно отмечаем его неполноту. **Это не проверка всего многостраничного договора.**
- Модуль `expo-browser-download-storage.mjs` проверяет, что документ скачан именно через SEYVEO и существует в локальном хранилище, создаёт временную `.pdf` копию внутри sandbox cache для native PDFKit/PDFBox, считывает текст и удаляет временную копию в `finally`. При входе в экран автоматически удаляются возможные временные копии, оставшиеся после аварийного завершения. Исходный скачанный файл не удаляется.
- При нажатии на «✦ Сэйви, посмотри» сначала требуется **согласие на локальное чтение**. Только после предпросмотра текста и нового разрешения может быть вызван внешний `onSayviReview`. Без этого адаптера никакой отправки нет; PDF никогда не загружается автоматически.
- Если PDF представляет собой скан без текстового слоя, показываем сообщение «нет распознаваемого текста», вместо выдуманного анализа. OCR — отдельное направление.
- Для безопасного нативного извлечения ещё нужно выбрать, изучить и установить библиотеку, испытать её с **Expo SDK 58 / React Native 0.88** и проверить права/подпись/производительность на iOS и Android. Например, `expo-pdf-text-extract` документирует нужный интерфейс на базе PDFKit/PDFBox, но **не установлен** здесь и не одобрен как производственная зависимость.
- В `mobile/tests/browser-pdf-review.test.mjs` добавлены тесты с подставным локальным извлекателем (без реальных PDF-файлов); команда `mobile/package.json` включает их при запуске `npm test`.

**Никаких изменений исходной геометрии, серой полоски, подсветки, вкладок и пяти тем браузера нет.** Полностью работающее чтение PDF на реальном устройстве требует дальнейшего подключения и сборки.

## 01.11.2026 — интеграция реального нативного PDF-модуля (этап 2)

В черновой ветке внедрено **подключение библиотеки**, но ещё не подтверждена сборка APK/IPA и работоспособность на реальных устройствах:

- В `mobile/package.json` закреплена версия **`expo-pdf-text-extract@1.1.0`** (MIT; PDFKit для iOS, Apache PDFBox для Android). Документация обещает поддержку Expo SDK 49+ / RN 0.72+, но полная совместимость с текущими Expo SDK 58 / RN 0.88 требует реальной проверки сборки и нативных тестов.
- `mobile/src/browser/expo-browser-pdf-extractor.ts` — интеграция реального импорта `getPageCount`, `extractTextFromPage`, `isAvailable`.
- `mobile/src/browser/native-pdf-extractor-core.mjs` — проверка доступности и защищённый адаптер, который не пытается извлекать текст при отсутствии нативного модуля.
- `mobile/src/browser/BrowserDownloadsPanel.tsx` — использует этот адаптер по умолчанию; без установленной нативной сборки показывает честную альтернативу открыть файл. Сначала отдельное согласие на локальное чтение PDF, затем отдельное согласие на передачу отрывка в Сэйви. Поддержаны понятные сообщения о PDF, защищённых паролем.
- Добавлен `mobile/tests/native-pdf-extractor-core.test.mjs`, подключён к `npm test`; кодовая логика проверена с имитированным нативным модулем.
- **Нет автоматических облачных вызовов, OCR, ИИ-анализа и обработки целого договора.** До подключения `onSayviReview` фрагмент PDF остаётся в локальном экране.

**Неподключённые части:** `mobile/App.tsx` — диагностический нативный экран, нативный Browser/WebView и переход в Downloads ещё не интегрированы. Пользователь в работающем GitHub Pages браузере изменений не увидит. Для первого теста на Android/iOS: в `mobile/` выполнить `npm install`, `npm test`, `npm run check`, затем подготовить development build и проверить реальный цифровой PDF, скан без OCR, PDF с паролем, восьмистраничный лимит и удаление локального кэша. **Не объявлять опубликованной или полностью проверенной функцией до этих шагов.**
