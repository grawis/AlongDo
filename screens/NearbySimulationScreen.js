import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import TaskCard from '../components/TaskCard';
import { fetchNearbyTasks, resolveTasksForCurrentLocation } from '../services/api';

const defaultRegion = {
  latitude: 25.0375,
  longitude: 121.5637,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const getCoordinate = (task) => {
  const coordinates = task?.resolvedCoordinates || task?.coordinates;
  if (!coordinates) {
    return null;
  }

  return {
    latitude: coordinates.latitude ?? coordinates.lat,
    longitude: coordinates.longitude ?? coordinates.lng,
  };
};

const assignCoordinatesIfMissing = (tasks) =>
  tasks.map((task, index) => {
    if (task.coordinates || task.resolvedCoordinates) {
      return task;
    }

    return {
      ...task,
      coordinates: {
        latitude: defaultRegion.latitude + (index + 1) * 0.002,
        longitude: defaultRegion.longitude + (index + 1) * 0.0025,
      },
    };
  });

export default function NearbySimulationScreen({ personalTasks, groupTasks }) {
  const [message, setMessage] = useState('先取得目前位置，系統就能幫你把彈性地點任務對應到最近的實際地點。');
  const [coordsLabel, setCoordsLabel] = useState('');
  const [nearbyTasks, setNearbyTasks] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const sourceTasks = useMemo(() => [...personalTasks, ...groupTasks].slice(0, 8), [personalTasks, groupTasks]);
  const fallbackTasks = useMemo(() => assignCoordinatesIfMissing(sourceTasks.slice(0, 8)), [sourceTasks]);
  const displayTasks = nearbyTasks.length > 0 ? nearbyTasks : fallbackTasks;

  const mapRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : defaultRegion;

  const handleLocateAndSearch = async () => {
    try {
      setMessage('正在要求定位權限...');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setMessage('沒有定位權限，暫時無法依目前位置更新任務地點。');
        return;
      }

      setMessage('正在取得目前位置...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      const currentCoords = { latitude, longitude };

      setUserLocation(currentCoords);
      setCoordsLabel(`目前座標：${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

      if (sourceTasks.length > 0) {
        setMessage('正在依目前位置更新任務地點...');
        const resolvedTasks = await resolveTasksForCurrentLocation(sourceTasks, currentCoords);
        setNearbyTasks(resolvedTasks);
        setMessage(`已依目前位置更新 ${resolvedTasks.length} 筆任務。`);
      } else {
        setMessage('正在查詢附近地點...');
        const tasks = await fetchNearbyTasks(currentCoords);
        setNearbyTasks(tasks);
        setMessage(`已找到 ${tasks.length} 筆附近地點。`);
      }
    } catch (error) {
      console.warn(error);
      setMessage(`附近任務查詢失敗：${error.message}`);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>附近任務</Text>

      <View style={styles.simulationBox}>
        <Text style={styles.simulationText}>{message}</Text>
        {coordsLabel ? <Text style={styles.coordsText}>{coordsLabel}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleLocateAndSearch}>
          <Text style={styles.buttonText}>取得目前位置並更新任務</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          region={mapRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {userLocation ? <Marker coordinate={userLocation} title="我的位置" pinColor="#4a67ff" /> : null}
          {displayTasks.map((task) => {
            const coordinate = getCoordinate(task);
            if (!coordinate) {
              return null;
            }

            return (
              <Marker
                key={task.id}
                coordinate={coordinate}
                title={task.resolvedPlaceName || task.title}
                description={task.resolvedAddress || task.exactAddress || task.location}
              />
            );
          })}
        </MapView>
      </View>

      <Text style={styles.subtitle}>附近任務清單</Text>
      <FlatList
        data={displayTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <TaskCard task={item} />}
      />
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
  simulationBox: {
    backgroundColor: '#eef3ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  simulationText: {
    fontSize: 14,
    color: '#4d567a',
    marginBottom: 12,
    lineHeight: 20,
  },
  coordsText: {
    fontSize: 12,
    color: '#5f6477',
    marginBottom: 10,
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
  mapContainer: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#eef2ff',
  },
  map: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1f2340',
  },
  list: {
    paddingBottom: 12,
  },
});
