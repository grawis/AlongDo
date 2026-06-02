import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { fetchWeather } from '../services/api';

const modeLabel = {
  fixed: '固定地址',
  flexible: '彈性地點',
};

export default function WeatherReminderScreen({
  tasks = [],
  sharedLocation,
  sharedLocationLabel,
  onRequestLocation,
}) {
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [message, setMessage] = useState(
    '你可以先按下方按鈕，依目前位置取得天氣提醒，並根據未完成任務安排今天行程。'
  );
  const [areaLabel, setAreaLabel] = useState('');

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed'),
    [tasks]
  );

  const handleWeatherReminder = async () => {
    try {
      setMessage('正在取得目前位置與天氣資料...');
      const coords = sharedLocation || (await onRequestLocation());
      const reverseGeocode = await Location.reverseGeocodeAsync(coords);
      const place = reverseGeocode?.[0];
      const regionText = [place?.region, place?.city || place?.district].filter(Boolean).join('');
      const nextAreaLabel = regionText ? `${regionText}附近` : '';

      setAreaLabel(nextAreaLabel);
      const info = await fetchWeather(coords, pendingTasks);

      setWeatherInfo(info);
      setMessage(`目前天氣：${info.condition}，${info.temperatureText}。${info.advice}`);
    } catch (error) {
      console.warn(error);
      setWeatherInfo(null);
      setMessage(`取得天氣失敗：${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>天氣提醒</Text>

      <View style={styles.weatherBox}>
        <Text style={styles.weatherLabel}>目前提醒</Text>
        <Text style={styles.weatherText}>{message}</Text>
        <Text style={styles.sharedLocationText}>{sharedLocationLabel}</Text>
        <TouchableOpacity style={styles.button} onPress={handleWeatherReminder}>
          <Text style={styles.buttonText}>取得目前位置天氣提醒</Text>
        </TouchableOpacity>
      </View>

      {weatherInfo ? (
        <>
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>天氣概況</Text>
            {areaLabel ? <Text style={styles.tipText}>地區：{areaLabel}</Text> : null}
            <Text style={styles.tipText}>時區：{weatherInfo.locationLabel}</Text>
            <Text style={styles.tipText}>天氣：{weatherInfo.condition}</Text>
            <Text style={styles.tipText}>目前溫度：{weatherInfo.temperatureText}</Text>
            <Text style={styles.tipText}>體感溫度：{weatherInfo.apparentTemperatureText}</Text>
            <Text style={styles.tipText}>降雨機率：{weatherInfo.precipitationProbabilityText}</Text>
            <Text style={styles.tipText}>風速：{weatherInfo.windSpeedText}</Text>
            <Text style={styles.tipText}>建議：{weatherInfo.advice}</Text>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>出門前建議</Text>
            {weatherInfo.checklist.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.tipText}>
                {index + 1}. {item}
              </Text>
            ))}
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>受影響任務</Text>
            {weatherInfo.impactedTasks.length ? (
              weatherInfo.impactedTasks.map((item) => (
                <View key={item.id} style={styles.taskRow}>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <Text style={styles.taskMeta}>
                    {item.location} / {modeLabel[item.locationMode] || item.locationMode}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.tipText}>目前沒有需要特別提醒的未完成任務。</Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>目前任務概況</Text>
          <Text style={styles.tipText}>未完成任務數：{pendingTasks.length}</Text>
          <Text style={styles.tipText}>
            取得目前位置與天氣後，系統會依照你的未完成任務提供更貼近情境的提醒。
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 24,
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
    marginBottom: 10,
    lineHeight: 22,
  },
  sharedLocationText: {
    fontSize: 12,
    color: '#5f6477',
    marginBottom: 14,
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
    marginBottom: 12,
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
  taskRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f7',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2340',
    marginBottom: 4,
  },
  taskMeta: {
    color: '#5f6477',
    lineHeight: 20,
  },
});
