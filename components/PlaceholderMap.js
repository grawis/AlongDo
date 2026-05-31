import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlaceholderMap() {
  return (
    <View style={styles.mapBox}>
      <Text style={styles.mapLabel}>地圖預留區塊</Text>
      <Text style={styles.mapNote}>目前先顯示定位與附近任務流程，之後再接上正式地圖畫面</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7dffa',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2f356b',
    marginBottom: 8,
  },
  mapNote: {
    fontSize: 14,
    color: '#5f657e',
    textAlign: 'center',
    lineHeight: 20,
  },
});
