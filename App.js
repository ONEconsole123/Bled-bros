import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import { NavigationBar } from 'expo-navigation-bar';
import { useKeepAwake } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GAME_HTML from './src/gameHtml';

const SAVE_KEY = 'bledbros_save_v1';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useKeepAwake();
  const webRef = useRef(null);
  // undefined = still loading, null = no save yet
  const [save, setSave] = useState(undefined);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    AsyncStorage.getItem(SAVE_KEY)
      .then((s) => setSave(s))
      .catch(() => setSave(null));
  }, []);

  // Android back button goes to the game (pause / back); the game decides when to exit
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      webRef.current?.postMessage(JSON.stringify({ type: 'back' }));
      return true;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback((e) => {
    let msg;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'save' && typeof msg.data === 'string') AsyncStorage.setItem(SAVE_KEY, msg.data).catch(() => {});
    if (msg.type === 'exit') BackHandler.exitApp();
  }, []);

  if (save === undefined) return <View style={styles.root} />;

  const injected = `window.__BLED_SAVE__ = ${JSON.stringify(save || '')}; true;`;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <NavigationBar hidden />
      <WebView
        ref={webRef}
        style={styles.web}
        source={{ html: GAME_HTML, baseUrl: 'https://bledbros.local/' }}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={injected}
        onMessage={onMessage}
        onLoadEnd={() => SplashScreen.hideAsync().catch(() => {})}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setBuiltInZoomControls={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        textZoom={100}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#120a14' },
  web: { flex: 1, backgroundColor: '#120a14' },
});
