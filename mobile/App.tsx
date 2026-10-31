import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MemoryDiagnostic } from './src/core/MemoryDiagnostic';
import { OfflinePacksPanel } from './src/core/OfflinePacksPanel';
import { initializeVault, inspectVault, type VaultStatus } from './src/core/secureVault';
import { saveNote, listNotes, removeNote, type PersonalNote } from './src/core/notesRepository';

// This is a separate native M1 diagnostic in the Black Velvet HDR-like palette — NOT a replacement for the approved
// SEYVEO Home, plasma, dock, or the Black Velvet design reference.
type ScreenState = VaultStatus | 'checking';
const C = {
  bg: '#0e171a', card: '#172729', border: '#3b625b',
  text: '#f3faf7', secondary: '#b0cfc5', accent: '#94e0c4'
};

function NativeFoundation() {
  const [state, setState] = useState<ScreenState>('checking');
  const [busy, setBusy] = useState(false);
  const [draft,setDraft] = useState('');
  const [notes,setNotes] = useState<PersonalNote[]>([]);
  const [notesError,setNotesError] = useState('');
  const refreshNotes = useCallback(async()=>{
    try { setNotes(await listNotes());setNotesError(''); }
    catch { setNotesError('Не удалось прочитать защищённые заметки.'); }
  },[]);
  useEffect(()=>{if(state==='ready')void refreshNotes();},[state,refreshNotes]);
  const addNote=useCallback(async()=>{
    if(busy||!draft.trim())return;
    setBusy(true);
    try{await saveNote(draft);setDraft('');await refreshNotes();}
    catch {setNotesError('Не удалось сохранить заметку.');}
    finally {setBusy(false);}
  },[busy,draft,refreshNotes]);
  const deleteNote=useCallback(async(id:string)=>{
    if(busy)return;
    setBusy(true);
    try{await removeNote(id);await refreshNotes();}
    catch{setNotesError('Не удалось удалить заметку.');}
    finally{setBusy(false);}
  },[busy,refreshNotes]);

  const refresh = useCallback(async () => {
    setState('checking');
    setState(await inspectVault());
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async () => {
    if (busy || state !== 'needs-setup') return;
    setBusy(true);
    setState(await initializeVault());
    setBusy(false);
  }, [busy, state]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>seyveo</Text>
        <Text style={styles.subtitle}>ai automation</Text>
        <View style={styles.section}>
          <Text style={styles.eyebrow}>M1 · МОБИЛЬНАЯ ОСНОВА</Text>
          <Text style={styles.headline}>Личный интеллект. Ваши данные.</Text>
          <Text style={styles.description}>
            Мы готовим настоящее приложение SEYVEO для iOS и Android.
            Ваше личное пространство будет находиться на устройстве.
          </Text>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Personal Core</Text>
            {state === 'checking' ? (
              <View style={styles.row}>
                <ActivityIndicator color={C.accent} />
                <Text style={styles.status}>Проверяем локальное хранилище…</Text>
              </View>
            ) : null}
            {state === 'needs-setup' ? (
              <>
                <Text style={styles.status}>Защищённое хранилище ещё не создано.</Text>
                <Text style={styles.detail}>
                  Создадим зашифрованную базу непосредственно на телефоне.
                  Облако не подключается. Старые данные не переносим.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                  onPress={() => { void create(); }}
                >
                  <Text style={styles.buttonText}>
                    {busy ? 'Создаём…' : 'Создать хранилище'}
                  </Text>
                </Pressable>
              </>
            ) : null}
            {state === 'ready' ? (
              <>
                <Text style={styles.success}>Зашифрованная база проверена</Text>
                <Text style={styles.detail}>
                  SQLCipher подтверждён на этом устройстве.
                  Данные прежнего прототипа ещё не перенесены.
                </Text>
              </>
            ) : null}
            {state === 'unavailable' ? (
              <>
                <Text style={styles.warning}>Защита не подтверждена</Text>
                <Text style={styles.detail}>
                  Хранилище не открыто. Мы не будем записывать личные данные
                  в незащищённую базу. Проверьте нативную сборку.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                  onPress={() => { void refresh(); }}
                >
                  <Text style={styles.buttonText}>Повторить проверку</Text>
                </Pressable>
              </>
            ) : null}
          </View>
          {state==='ready' ? <MemoryDiagnostic onChange={()=>void refreshNotes()} /> : null}
          {state==='ready' ? <View style={styles.panel}>
            <Text style={styles.panelTitle}>Мои заметки · на этом телефоне</Text>
            <TextInput style={styles.noteInput} multiline value={draft} onChangeText={setDraft}
              placeholder="Что запомнить?" placeholderTextColor={C.secondary} maxLength={4000}/>
            <Pressable accessibilityRole="button" disabled={busy||!draft.trim()} style={styles.button} onPress={()=>{void addNote();}}>
              <Text style={styles.buttonText}>Сохранить заметку</Text>
            </Pressable>
            {notesError ? <Text style={styles.warning}>{notesError}</Text>:null}
            {notes.map(note=><View key={note.id} style={styles.noteRow}>
              <Text style={styles.detail}>{note.text}</Text>
              <Pressable accessibilityRole="button" disabled={busy} onPress={()=>{void deleteNote(note.id);}}>
                <Text style={styles.noteDelete}>Удалить</Text>
              </Pressable>
            </View>)}
          </View>:null}
          <OfflinePacksPanel />
          <Text style={styles.footnote}>
            Календарь, Блокнот, резервные копии и голос будут подключаться
            после проверки безопасности. Никакой отправки личных данных в облако.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><NativeFoundation /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 44 },
  brand: { marginTop: 26, color: C.text, fontSize: 31, letterSpacing: 4, textAlign: 'center', fontWeight: '300' },
  subtitle: { marginTop: 4, color: C.secondary, fontSize: 10, letterSpacing: 3, textAlign: 'center' },
  section: { paddingTop: 70, maxWidth: 500, alignSelf: 'center', width: '100%' },
  eyebrow: { color: C.secondary, fontSize: 11, letterSpacing: 2.2, marginBottom: 22 },
  headline: { color: C.text, fontSize: 33, fontWeight: '300', lineHeight: 42 },
  description: { color: C.secondary, fontSize: 15, lineHeight: 24, marginTop: 22, marginBottom: 35 },
  panel: { borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, padding: 24 },
  panelTitle: { color: C.text, fontSize: 17, fontWeight: '400', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  status: { color: C.text, fontSize: 15, lineHeight: 24 },
  detail: { color: C.secondary, fontSize: 13, lineHeight: 21, marginTop: 12 },
  button: { borderRadius: 16, borderColor: '#467a6d', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 18, marginTop: 24 },
  pressed: { opacity: 0.65 },
  buttonText: { color: C.text, textAlign: 'center', fontSize: 15 },
  success: { color: C.text, fontSize: 15 },
  warning: { color: C.text, fontSize: 15 },
  noteInput: {borderWidth: 1, borderColor: C.border, borderRadius: 12, color: C.text, padding: 12, minHeight: 72, marginTop: 10, textAlignVertical: 'top'},
  noteRow: {borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 12},
  noteDelete: {color: C.accent, marginTop: 10},
  footnote: { color: C.secondary, fontSize: 12, lineHeight: 21, marginTop: 26 }
});
