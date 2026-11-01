# SEYVEO Browser — Native background audio implementation contract

Status: planned, NOT running. 2026-11-01.

Existing WebView media buttons control accessible HTML audio/video only. They do not constitute background playback, operating-system lock-screen controls or Android media service.

## Native path
- Expo SDK 58: adopt expo-audio at the SDK-compatible version through expo install.
- Only when a real native player is used, enable expo-audio config-plugin enableBackgroundPlayback. Keep enableBackgroundRecording=false.
- At playback start, configure the audio session with shouldPlayInBackground=true and relevant interruption behavior.
- Register lock-screen media metadata/actions for actual native tracks. Android requires the foreground media playback service and lock-screen controls for sustained playback.
- Respect headphones disconnection, incoming calls, focus changes and user stop.
- Never claim arbitrary cross-origin WebView/YouTube streams can be captured and moved to a native player; this depends on site support and rights.
- App UI should show a mini-player only when the playback engine reports a real active session. Native dock and browser must share the same player state, not duplicated buttons.
- Do not request microphone or recording permissions for playback.
- Test on physical iPhone (including older supported OS) and Android; verify locked screen, interruption, stop, navigation, background return and battery behavior.
- Browser currently has no validated persistent native playback session. Keep it labeled prototype.

Official guidance: https://docs.expo.dev/versions/v58.0.0/sdk/audio/ .
