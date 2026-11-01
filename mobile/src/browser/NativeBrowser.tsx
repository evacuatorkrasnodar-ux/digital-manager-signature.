import React from 'react';
import { View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
export function NativeBrowser(){return <View style={{flex:1}}><Text>SEYVEO Browser · Native Preview</Text><WebView source={{uri:'https://www.wikipedia.org/'}} style={{flex:1}} /></View>}
