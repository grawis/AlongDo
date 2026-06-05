import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import TaskCard from '../components/TaskCard';
import { fetchNearbyTasks, resolveTasksForCurrentLocation } from '../services/api';
import { colors } from '../theme/colors';

const defaultRegion = {
  latitude: 25.0375,
  longitude: 121.5637,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const getCoordinate = (task) => {
  const coordinates = task?.resolvedCoordinates || task?.coordinates;
  if (!coordinates) return null;

  return {
    latitude: coordinates.latitude ?? coordinates.lat,
    longitude: coordinates.longitude ?? coordinates.lng,
  };
};

const assignCoordinatesIfMissing = (tasks) =>
  tasks.map((task, index) => {
    if (task.coordinates || task.resolvedCoordinates) return task;

    return {
      ...task,
      coordinates: {
        latitude: defaultRegion.latitude + (index + 1) * 0.002,
        longitude: defaultRegion.longitude + (index + 1) * 0.0025,
      },
    };
  });

export default function NearbySimulationScreen({
  personalTasks,
  groupTasks,
  sharedLocation,
  sharedLocationLabel,
  onRequestLocation,
}) {
  const mapRef = useRef(null);
  const [message, setMessage] = useState('你可以先按下方按鈕取得目前位置，再更新附近任務。');
  const [nearbyTasks, setNearbyTasks] = useState([]);

  const sourceTasks = useMemo(
    () => [...personalTasks, ...groupTasks].filter((task) => task.status !== 'completed').slice(0, 8),
    [personalTasks, groupTasks]
  );
  const fallbackTasks = useMemo(() => assignCoordinatesIfMissing(sourceTasks), [sourceTasks]);
  const displayTasks = nearbyTasks.length > 0 ? nearbyTasks : fallbackTasks;

  const mapRegion = sharedLocation
    ? {
        latitude: sharedLocation.latitude,
        longitude: sharedLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : defaultRegion;

  const mapCoordinates = useMemo(() => {
    const taskCoordinates = displayTasks.map((task) => getCoordinate(task)).filter(Boolean);
    return sharedLocation ? [sharedLocation, ...taskCoordinates] : taskCoordinates;
  }, [displayTasks, sharedLocation]);

  useEffect(() => {
    if (!sharedLocation) return;

    const refreshNearbyTasks = async () => {
      try {
        if (sourceTasks.length > 0) {
          const resolvedTasks = await resolveTasksForCurrentLocation(sourceTasks, sharedLocation);
          setNearbyTasks(resolvedTasks);
          setMessage(`已根據共用位置解析 ${resolvedTasks.length} 筆附近任務。`);
        } else {
          const tasks = await fetchNearbyTasks(sharedLocation);
          setNearbyTasks(tasks);
          setMessage(`已找到 ${tasks.length} 筆附近任務。`);
        }
      } catch (error) {
        console.warn(error);
        setMessage(`更新附近任務失敗：${error.message}`);
      }
    };

    refreshNearbyTasks();
  }, [sharedLocation, sourceTasks]);

  useEffect(() => {
    if (!mapRef.current || mapCoordinates.length === 0) return;

    const timer = setTimeout(() => {
      if (mapCoordinates.length === 1) {
        mapRef.current?.animateToRegion(
          {
            latitude: mapCoordinates[0].latitude,
            longitude: mapCoordinates[0].longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          300
        );
        return;
      }

      mapRef.current?.fitToCoordinates(mapCoordinates, {
        edgePadding: {
          top: 50,
          right: 40,
          bottom: 50,
          left: 40,
        },
        animated: true,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [mapCoordinates]);

  const handleLocateAndSearch = async () => {
    try {
      setMessage('正在取得目前位置...');
      const coords = await onRequestLocation();

      if (sourceTasks.length > 0) {
        setMessage('正在解析附近任務...');
        const resolvedTasks = await resolveTasksForCurrentLocation(sourceTasks, coords);
        setNearbyTasks(resolvedTasks);
        setMessage(`已根據共用位置解析 ${resolvedTasks.length} 筆附近任務。`);
      } else {
        setMessage('正在查詢附近任務...');
        const tasks = await fetchNearbyTasks(coords);
        setNearbyTasks(tasks);
        setMessage(`已找到 ${tasks.length} 筆附近任務。`);
      }
    } catch (error) {
      console.warn(error);
      setMessage(`更新附近任務失敗：${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>附近任務</Text>

      <View style={styles.simulationBox}>
        <Text style={styles.simulationText}>{message}</Text>
        <Text style={styles.coordsText}>{sharedLocationLabel}</Text>
        <TouchableOpacity style={styles.button} onPress={handleLocateAndSearch}>
          <Text style={styles.buttonText}>取得目前位置並更新附近任務</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          showsUserLocation={Boolean(sharedLocation)}
          showsMyLocationButton
        >
          {sharedLocation ? (
            <Marker coordinate={sharedLocation} title="目前位置" pinColor={colors.primary} />
          ) : null}
          {displayTasks.map((task) => {
            const coordinate = getCoordinate(task);
            if (!coordinate) return null;

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
      {displayTasks.length === 0 ? (
        <Text style={styles.emptyText}>目前沒有可顯示的附近任務。</Text>
      ) : (
        displayTasks.map((item) => <TaskCard key={item.id} task={item} />)
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
    color: colors.text,
    marginBottom: 12,
  },
  simulationBox: {
    backgroundColor: colors.hero,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  simulationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  coordsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: colors.surface,
    fontWeight: '700',
  },
  mapContainer: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: colors.text,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
