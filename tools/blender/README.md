# Cinematic Plasma Signature — Blender prototype

Исходник: `create_signature_scene.py`.

Это **настоящая параметрическая 3D-сцена, но пока не проверенный рендер**. Blender отсутствует в среде сборки, поэтому визуальную точность и работоспособность рендера нужно проверить в Blender 4.x на компьютере.

Сцена включает пять широких объёмных преломляющих стеклянных лент, тёмный центр, мягкие студийные отражатели и очень медленную циклическую анимацию.

### Запуск

```bash
blender --background --python tools/blender/create_signature_scene.py -- --quality draft
```

Файлы появятся в папке `blender-renders/`: редактируемая `.blend`-сцена и по одному PNG для Black Velvet / White Velvet.

Финальная версия:

```bash
blender --background --python tools/blender/create_signature_scene.py -- --quality final
```

Анимированные кадры для оценки плавности:

```bash
blender --background --python tools/blender/create_signature_scene.py -- --quality draft --frames 48
```

**Важно:** символ PW и уведомления будут добавляться отдельно в интерфейсе и не должны запекаться в 3D-рендер. После просмотра результатов оценим сходство с утверждённым эталоном и лишь потом заменим временную SVG-плазму на сайте. Старый репозиторий не затронут.
