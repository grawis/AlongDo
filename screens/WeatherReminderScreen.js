import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fetchWeather } from '../services/api';

export default function WeatherReminderScreen() {
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [message, setMessage] = useState('按下按鈕後，我會用目前的模擬資料產生一則天氣提醒。');

  const handleWeatherSimulate = async () => {
    setMessage('正在載入天氣提醒...');
    const info = await fetchWeather();
    setWeatherInfo(info);
    setMessage(`目前 ${info.temperature}°C，${info.advice}`);
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>天氣提醒</Text>

      <View style={styles.weatherBox}>
        <Text style={styles.weatherLabel}>提醒內容</Text>
        <Text style={styles.weatherText}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={handleWeatherSimulate}>
          <Text style={styles.buttonText}>載入天氣提醒</Text>
        </TouchableOpacity>
      </View>

      {weatherInfo ? (
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>天氣建議</Text>
          <Text style={styles.tipText}>天氣狀態：{weatherInfo.condition}</Text>
          <Text style={styles.tipText}>溫度：{weatherInfo.temperature}°C</Text>
          <Text style={styles.tipText}>{weatherInfo.advice}</Text>
        </View>
      ) : (
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>目前說明</Text>
          <Text style={styles.tipText}>這一頁目前仍使用模擬天氣資料。</Text>
          <Text style={styles.tipText}>之後可以再接上真實天氣 API。</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2340',
    marginBottom: 12,
  },
  weatherBox: {
    backgroundColor: '#eef3ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  weatherLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1f2340',
  },
  weatherText: {
    fontSize: 14,
    color: '#4d567a',
    marginBottom: 14,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4a67ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  tipBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e6e8f5',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2340',
  },
  tipText: {
    color: '#5f6477',
    marginBottom: 6,
    lineHeight: 20,
  },
});
