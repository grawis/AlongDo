import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { planRoute } from '../services/api';
import { colors } from '../theme/colors';

const defaultRegion = {
  latitude: 23.6978,
  longitude: 120.9605,
  latitudeDelta: 3.8,
  longitudeDelta: 3.8,
};

const buildLocationPreview = (task) => {
  if (task.locationMode === 'fixed' && task.exactAddress) {
    return `${task.location} / ${task.exactAddress}`;
  }

  if (task.locationMode === 'flexible') {
    return task.resolvedPlaceName
      ? `${task.location} -> ${task.resolvedPlaceName}`
      : `${task.location} -> 尚未解析附近地點`;
  }

  return task.location;
};

export default function RoutePlannerScreen({
  tasks,
  currentUserUid,
  groupIds,
  sharedLocation,
  sharedLocationLabel,
  onRequestLocation,
}) {
  const mapRef = useRef(null);
  const requestIdRef = useRef(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [routePlan, setRoutePlan] = useState([]);
  const [routeSummary, setRouteSummary] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const locationStatus = sharedLocation
    ? sharedLocationLabel
    : '尚未取得目前位置。建議先按下方按鈕後再開始規劃。';

  const selectableTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed'),
    [tasks]
  );

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (selectedIds.length === 0) {
      setRoutePlan([]);
      setRouteSummary(null);
      setRoutePath([]);
      setErrorMessage('');
      return;
    }

    setErrorMessage('');
    setRoutePlan([]);
    setRouteSummary(null);
    setRoutePath([]);

    const loadRoute = async () => {
      try {
        const result = await planRoute(selectedIds, currentUserUid, groupIds, sharedLocation);
        if (requestIdRef.current !== requestId) return;

        setRoutePlan(result.orderedTasks || []);
        setRouteSummary(result.summary || null);
        setRoutePath(result.routePath || []);
      } catch (error) {
        if (requestIdRef.current !== requestId) return;

        console.warn(error);
        setRoutePlan([]);
        setRouteSummary(null);
        setRoutePath([]);
        setErrorMessage(error.message);
      }
    };

    loadRoute();
  }, [selectedIds, currentUserUid, groupIds, sharedLocation]);

  const mapMarkers = useMemo(
    () => [
      ...(sharedLocation
        ? [
            {
              key: `origin-${sharedLocation.latitude}-${sharedLocation.longitude}`,
              coordinate: sharedLocation,
              title: '目前位置',
              description: '規劃起點',
              label: '起',
              isOrigin: true,
            },
          ]
        : []),
      ...routePlan
        .filter((task) => task.resolvedCoordinates)
        .map((task) => ({
          key: `${task.id}-${task.order}-${task.resolvedCoordinates.latitude}-${task.resolvedCoordinates.longitude}`,
          coordinate: task.resolvedCoordinates,
          title: `${task.order}. ${task.title}`,
          description: task.resolvedAddress || task.exactAddress || task.location,
          label: String(task.order),
          isOrigin: false,
        })),
    ],
    [routePlan, sharedLocation]
  );

  useEffect(() => {
    const coordinatesToFit =
      routePath.length > 1
        ? routePath
        : mapMarkers.map((marker) => marker.coordinate).filter(Boolean);

    if (!mapRef.current || coordinatesToFit.length === 0) return;

    const timer = setTimeout(() => {
      if (coordinatesToFit.length === 1) {
        mapRef.current?.animateToRegion(
          {
            latitude: coordinatesToFit[0].latitude,
            longitude: coordinatesToFit[0].longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          250
        );
        return;
      }

      mapRef.current?.fitToCoordinates(coordinatesToFit, {
        edgePadding: {
          top: 60,
          right: 40,
          bottom: 60,
          left: 40,
        },
        animated: true,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [routePath, mapMarkers]);

  const toggleTask = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleUseCurrentLocation = async () => {
    try {
      await onRequestLocation();
    } catch (error) {
      setErrorMessage(`取得位置失敗：${error.message}`);
    }
  };

  const handleOpenGoogleMaps = async () => {
    if (routePlan.length === 0) return;

    const origin = sharedLocation
      ? `${sharedLocation.latitude},${sharedLocation.longitude}`
      : routePlan[0]?.resolvedAddress ||
        routePlan[0]?.exactAddress ||
        `${routePlan[0]?.resolvedCoordinates?.latitude},${routePlan[0]?.resolvedCoordinates?.longitude}`;

    const destinationTask = routePlan[routePlan.length - 1];
    const destination =
      destinationTask?.resolvedAddress ||
      destinationTask?.exactAddress ||
      `${destinationTask?.resolvedCoordinates?.latitude},${destinationTask?.resolvedCoordinates?.longitude}`;

    const waypointTasks = sharedLocation ? routePlan.slice(0, -1) : routePlan.slice(1, -1);
    const waypoints = waypointTasks
      .map(
        (task) =>
          task.resolvedAddress ||
          task.exactAddress ||
          `${task.resolvedCoordinates?.latitude},${task.resolvedCoordinates?.longitude}`
      )
      .filter(Boolean)
      .join('|');

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      (waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : '') +
      '&travelmode=walking';

    await Linking.openURL(url);
  };

  const initialRegion = (() => {
    const anchor =
      sharedLocation ||
      routePlan.find((task) => task.resolvedCoordinates)?.resolvedCoordinates ||
      null;

    if (!anchor) return defaultRegion;

    return {
      latitude: anchor.latitude,
      longitude: anchor.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  })();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>路線規劃</Text>
      <Text style={styles.helpText}>
        先選幾筆任務，再決定是否使用目前位置規劃。彈性地點任務會盡量解析成附近最合適的實際地點。
      </Text>

      <View style={styles.locationBox}>
        <Text style={styles.locationText}>{locationStatus}</Text>
        <TouchableOpacity style={styles.locationButton} onPress={handleUseCurrentLocation}>
          <Text style={styles.locationButtonText}>使用目前位置規劃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={Boolean(sharedLocation)}
          showsMyLocationButton
        >
          {mapMarkers.map((marker) => (
            <Marker
              key={marker.key}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
            >
              <View
                style={[
                  styles.markerBubble,
                  marker.isOrigin ? styles.originMarkerBubble : styles.taskMarkerBubble,
                ]}
              >
                <Text style={styles.markerText}>{marker.label}</Text>
              </View>
            </Marker>
          ))}
          {routePath.length > 1 ? (
            <Polyline coordinates={routePath} strokeColor={colors.route} strokeWidth={5} />
          ) : null}
        </MapView>
      </View>

      <View style={styles.taskBlock}>
        {selectableTasks.length === 0 ? (
          <Text style={styles.emptyText}>目前沒有可規劃的未完成任務。</Text>
        ) : (
          selectableTasks.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.taskSelect, selectedIds.includes(item.id) && styles.taskSelected]}
              onPress={() => toggleTask(item.id)}
            >
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskLocation}>{buildLocationPreview(item)}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.routeBox}>
        <Text style={styles.routeTitle}>規劃結果</Text>
        {routeSummary ? (
          <Text style={styles.summaryText}>
            總距離：{routeSummary.distanceText} / 預估時間：{routeSummary.durationText}
          </Text>
        ) : null}
        {routePlan.length > 0 ? (
          <TouchableOpacity style={styles.mapsButton} onPress={handleOpenGoogleMaps}>
            <Text style={styles.mapsButtonText}>用 Google Maps 開啟導航</Text>
          </TouchableOpacity>
        ) : null}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : routePlan.length === 0 ? (
          <Text style={styles.routeText}>請先選取任務，再查看規劃結果。</Text>
        ) : (
          routePlan.map((task) => (
            <View key={task.id} style={styles.routeItem}>
              <Text style={styles.routeText}>
                {task.order}. {task.title}
              </Text>
              <Text style={styles.routeSubText}>{buildLocationPreview(task)}</Text>
              {task.resolvedAddress ? (
                <Text style={styles.routeSubText}>地址：{task.resolvedAddress}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
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
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  locationBox: {
    backgroundColor: colors.hero,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  locationText: {
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  locationButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationButtonText: {
    color: colors.surface,
    fontWeight: '700',
  },
  mapContainer: {
    height: 240,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  markerBubble: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originMarkerBubble: {
    backgroundColor: colors.primary,
  },
  taskMarkerBubble: {
    backgroundColor: colors.secondary,
  },
  markerText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  taskBlock: {
    marginBottom: 12,
  },
  taskSelect: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e8f2',
  },
  taskSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  taskLocation: {
    marginTop: 4,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  routeBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: colors.text,
  },
  summaryText: {
    color: colors.primary,
    marginBottom: 10,
    fontWeight: '600',
  },
  mapsButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  mapsButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  routeItem: {
    marginBottom: 10,
  },
  routeText: {
    color: colors.text,
    marginBottom: 4,
    fontWeight: '700',
  },
  routeSubText: {
    color: colors.textSecondary,
    lineHeight: 19,
  },
  errorText: {
    color: colors.danger,
    marginBottom: 6,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
