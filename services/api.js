import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  personalTasks as initialPersonalTasks,
  groupTasks as initialGroupTasks,
  groups as initialGroups,
} from '../data/mockTasks';
import { USE_MOCK_API } from './config';
import { db, isFirebaseConfigured } from './firebase';
import { httpGet, httpPost } from './http';
import { geocodeAddress, searchNearbyPlaces, getDirections } from './googleMaps';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let personalTasks = [...initialPersonalTasks];
let groupTasks = [...initialGroupTasks];

const COLLECTIONS = {
  personalTasks: 'personalTasks',
  groupTasks: 'groupTasks',
  groups: 'groups',
  groupMembers: 'groupMembers',
};

const weatherCodeLabelMap = {
  0: '晴朗',
  1: '大致晴朗',
  2: '局部多雲',
  3: '陰天',
  45: '起霧',
  48: '霧凇',
  51: '毛毛雨',
  53: '毛毛雨',
  55: '毛毛雨',
  61: '小雨',
  63: '降雨',
  65: '大雨',
  71: '小雪',
  73: '降雪',
  75: '大雪',
  80: '陣雨',
  81: '陣雨',
  82: '強陣雨',
  95: '雷雨',
  96: '雷雨冰雹',
  99: '強雷雨冰雹',
};

const normalizeCoordinates = (coordinates) => {
  if (!coordinates) return null;

  const latitude = coordinates.latitude ?? coordinates.lat;
  const longitude = coordinates.longitude ?? coordinates.lng;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }

  return { latitude, longitude };
};

const sortByCreatedAtDesc = (items) =>
  [...items].sort((a, b) => {
    const aTime = a.createdAt?.seconds ?? 0;
    const bTime = b.createdAt?.seconds ?? 0;
    return bTime - aTime;
  });

const makeInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const mapFirestoreDoc = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    coordinates: normalizeCoordinates(data.coordinates),
    resolvedCoordinates: normalizeCoordinates(data.resolvedCoordinates),
  };
};

const buildGroupMemberDocId = (groupId, uid) => `${groupId}_${uid}`;

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const orderTasksByNearest = (tasks, origin) => {
  const remaining = [...tasks];
  const ordered = [];
  let current = origin;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = calculateDistanceKm(current, remaining[0].resolvedCoordinates);

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = calculateDistanceKm(current, remaining[index].resolvedCoordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    const [nextTask] = remaining.splice(nearestIndex, 1);
    ordered.push(nextTask);
    current = nextTask.resolvedCoordinates;
  }

  return ordered;
};

const decodePolyline = (encoded) => {
  if (!encoded) return [];

  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLatitude = result & 1 ? ~(result >> 1) : result >> 1;
    latitude += deltaLatitude;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLongitude = result & 1 ? ~(result >> 1) : result >> 1;
    longitude += deltaLongitude;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
};

const formatTemperature = (value) =>
  typeof value === 'number' ? `${Math.round(value)}°C` : '未知';

const formatWindSpeed = (value) =>
  typeof value === 'number' ? `${Math.round(value)} km/h` : '未知';

const formatProbability = (value) =>
  typeof value === 'number' ? `${Math.round(value)}%` : '未知';

const withResolvedCoordinates = async (task) => {
  if (task.coordinates) {
    return {
      ...task,
      coordinates: normalizeCoordinates(task.coordinates),
    };
  }

  if (task.locationMode === 'flexible') {
    return {
      ...task,
      coordinates: null,
    };
  }

  const lookupText = task.exactAddress || task.location;
  if (!lookupText) {
    return {
      ...task,
      coordinates: null,
    };
  }

  try {
    const coordinates = await geocodeAddress(lookupText);
    return {
      ...task,
      coordinates,
    };
  } catch (error) {
    console.warn('Geocode failed for task:', task.title, error.message);
    return {
      ...task,
      coordinates: null,
      geocodeError: error.message,
    };
  }
};

const geocodeTaskLocation = async (task) => {
  if (task.coordinates) {
    return normalizeCoordinates(task.coordinates);
  }

  return geocodeAddress(task.exactAddress || task.location);
};

const mapPlaceToTask = (place, index) => ({
  id: place.placeId ? `nearby-${place.placeId}` : `nearby-${index}`,
  title: place.name,
  location: place.name,
  exactAddress: place.address || '',
  locationMode: 'fixed',
  status: 'pending',
  coordinates: normalizeCoordinates(place.coordinates),
  googlePlaceId: place.placeId || '',
  type: 'personal',
});

const buildMockNearbyTask = (baseCoords, offset, item) => ({
  id: item.id,
  title: item.title,
  location: item.location,
  exactAddress: item.exactAddress || '',
  locationMode: item.locationMode || 'fixed',
  status: item.status,
  groupId: item.groupId,
  coordinates: {
    latitude: baseCoords.latitude + offset.latitude,
    longitude: baseCoords.longitude + offset.longitude,
  },
});

async function getGroupMemberCount(groupId) {
  if (!db) return 0;

  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.groupMembers), where('groupId', '==', groupId))
  );

  return snapshot.size;
}

async function hydrateGroupsFromMemberships(membershipDocs) {
  const groupsWithMeta = await Promise.all(
    membershipDocs.map(async (membershipDoc) => {
      const membership = membershipDoc.data();
      const groupSnapshot = await getDoc(doc(db, COLLECTIONS.groups, membership.groupId));
      if (!groupSnapshot.exists()) return null;

      const group = mapFirestoreDoc(groupSnapshot);
      const memberCount = await getGroupMemberCount(group.id);

      return {
        ...group,
        members: memberCount,
        nickname: membership.nickname,
        role: membership.role,
        inviteCode: group.inviteCode,
      };
    })
  );

  return groupsWithMeta.filter(Boolean);
}

export async function fetchGroups(uid) {
  if (!USE_MOCK_API && !isFirebaseConfigured) {
    return httpGet('/groups');
  }

  if (isFirebaseConfigured && db && uid) {
    const membershipSnapshot = await getDocs(
      query(collection(db, COLLECTIONS.groupMembers), where('uid', '==', uid))
    );

    return hydrateGroupsFromMemberships(membershipSnapshot.docs);
  }

  await delay(200);
  return initialGroups;
}

export async function fetchGroupMembers(groupId) {
  if (isFirebaseConfigured && db) {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.groupMembers), where('groupId', '==', groupId))
    );

    return snapshot.docs.map((memberDoc) => {
      const data = memberDoc.data();
      return {
        id: memberDoc.id,
        uid: data.uid,
        nickname: data.nickname || '未設定暱稱',
        role: data.role || 'member',
      };
    });
  }

  await delay(150);
  return [
    {
      id: `${groupId}-owner`,
      uid: 'local-user',
      nickname: '我',
      role: 'owner',
    },
  ];
}

export async function createGroup({ name, nickname }, uid) {
  if (!isFirebaseConfigured || !db) {
    await delay(200);
    const nextId = `grp${initialGroups.length + 1}`;
    const inviteCode = makeInviteCode();
    return {
      id: nextId,
      name,
      nickname,
      inviteCode,
      members: 1,
      enabled: true,
      role: 'owner',
    };
  }

  const inviteCode = makeInviteCode();
  const groupRef = await addDoc(collection(db, COLLECTIONS.groups), {
    name,
    inviteCode,
    createdByUid: uid,
    enabled: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, COLLECTIONS.groupMembers, buildGroupMemberDocId(groupRef.id, uid)), {
    groupId: groupRef.id,
    uid,
    nickname,
    role: 'owner',
    joinedAt: serverTimestamp(),
  });

  return {
    id: groupRef.id,
    name,
    nickname,
    inviteCode,
    members: 1,
    enabled: true,
    role: 'owner',
  };
}

export async function joinGroupByInviteCode({ inviteCode, nickname }, uid) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('目前尚未啟用 Firebase，無法使用邀請碼加入群組。');
  }

  const trimmedCode = inviteCode.trim().toUpperCase();
  const groupSnapshot = await getDocs(
    query(collection(db, COLLECTIONS.groups), where('inviteCode', '==', trimmedCode))
  );

  if (groupSnapshot.empty) {
    throw new Error('找不到對應的群組，請確認邀請碼是否正確。');
  }

  const groupDoc = groupSnapshot.docs[0];
  const groupId = groupDoc.id;
  const memberDocId = buildGroupMemberDocId(groupId, uid);
  const memberRef = doc(db, COLLECTIONS.groupMembers, memberDocId);
  const memberSnapshot = await getDoc(memberRef);

  if (memberSnapshot.exists()) {
    await updateDoc(memberRef, {
      nickname,
    });
  } else {
    await setDoc(memberRef, {
      groupId,
      uid,
      nickname,
      role: 'member',
      joinedAt: serverTimestamp(),
    });
  }

  const memberCount = await getGroupMemberCount(groupId);
  const group = mapFirestoreDoc(groupDoc);

  return {
    ...group,
    members: memberCount,
    nickname,
    role: memberSnapshot.exists() ? memberSnapshot.data().role || 'member' : 'member',
  };
}

export async function fetchPersonalTasks(uid) {
  if (!USE_MOCK_API && !isFirebaseConfigured) {
    return httpGet('/tasks/personal');
  }

  if (isFirebaseConfigured && db && uid) {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.personalTasks), where('ownerUid', '==', uid))
    );

    return sortByCreatedAtDesc(snapshot.docs.map(mapFirestoreDoc));
  }

  await delay(250);
  return personalTasks;
}

export async function fetchGroupTasks(groupIds = []) {
  if (!USE_MOCK_API && !isFirebaseConfigured) {
    return httpGet('/tasks/group');
  }

  if (isFirebaseConfigured && db) {
    if (groupIds.length === 0) return [];

    const tasksByGroup = await Promise.all(
      groupIds.map(async (groupId) => {
        const snapshot = await getDocs(
          query(collection(db, COLLECTIONS.groupTasks), where('groupId', '==', groupId))
        );
        return snapshot.docs.map(mapFirestoreDoc);
      })
    );

    return sortByCreatedAtDesc(tasksByGroup.flat());
  }

  await delay(250);
  return groupTasks;
}

export async function createPersonalTask(task, uid) {
  if (!USE_MOCK_API && !isFirebaseConfigured) {
    return httpPost('/tasks/personal', task);
  }

  const baseTask = {
    title: task.title,
    location: task.location,
    exactAddress: task.exactAddress || '',
    locationMode: task.locationMode || 'flexible',
    coordinates: task.coordinates || null,
    googlePlaceId: task.googlePlaceId || '',
    status: 'pending',
    selectedForRoute: false,
    type: 'personal',
    ownerUid: uid || 'local-user',
  };

  const newTask = await withResolvedCoordinates(baseTask);

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, COLLECTIONS.personalTasks), {
      ...newTask,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...newTask,
    };
  }

  await delay(250);
  const taskWithId = { id: `p${personalTasks.length + 1}`, ...newTask };
  personalTasks = [taskWithId, ...personalTasks];
  return taskWithId;
}

export async function createGroupTask(task, uid) {
  if (!USE_MOCK_API && !isFirebaseConfigured) {
    return httpPost('/tasks/group', task);
  }

  const baseTask = {
    title: task.title,
    location: task.location,
    exactAddress: task.exactAddress || '',
    locationMode: task.locationMode || 'flexible',
    coordinates: task.coordinates || null,
    googlePlaceId: task.googlePlaceId || '',
    status: 'pending',
    groupId: task.groupId,
    groupName: task.groupName || '',
    ownerName: task.ownerName || '我',
    ownerUid: uid || 'local-user',
    type: 'group',
  };

  const newTask = await withResolvedCoordinates(baseTask);

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, COLLECTIONS.groupTasks), {
      ...newTask,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...newTask,
    };
  }

  await delay(250);
  const taskWithId = { id: `g${groupTasks.length + 1}`, ...newTask };
  groupTasks = [taskWithId, ...groupTasks];
  return taskWithId;
}

export async function updateGroupEnabled(groupId, enabled) {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTIONS.groups, groupId), {
      enabled,
      updatedAt: serverTimestamp(),
    });
  }

  return { id: groupId, enabled };
}

export async function updateGroupTaskStatus(taskId, status) {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTIONS.groupTasks, taskId), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  return { id: taskId, status };
}

export async function updatePersonalTaskStatus(taskId, status) {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTIONS.personalTasks, taskId), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  return { id: taskId, status };
}

export async function deletePersonalTask(taskId) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COLLECTIONS.personalTasks, taskId));
    return { id: taskId };
  }

  await delay(150);
  personalTasks = personalTasks.filter((task) => task.id !== taskId);
  return { id: taskId };
}

export async function deleteGroupTask(taskId) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COLLECTIONS.groupTasks, taskId));
    return { id: taskId };
  }

  await delay(150);
  groupTasks = groupTasks.filter((task) => task.id !== taskId);
  return { id: taskId };
}

export async function resolveTaskDestination(task, currentCoords) {
  if (!currentCoords) return task;

  if (task.locationMode === 'fixed') {
    const resolvedCoordinates = task.coordinates
      ? normalizeCoordinates(task.coordinates)
      : task.exactAddress
      ? await geocodeTaskLocation(task).catch(() => null)
      : null;

    return {
      ...task,
      resolvedCoordinates,
      resolvedAddress: task.exactAddress || '',
    };
  }

  if (!task.location) return task;

  try {
    const places = await searchNearbyPlaces(currentCoords, {
      keyword: task.location,
    });
    const nearest = places[0];

    if (!nearest) return task;

    return {
      ...task,
      resolvedPlaceName: nearest.name || task.location,
      resolvedAddress: nearest.address || '',
      resolvedCoordinates: normalizeCoordinates(nearest.coordinates),
      resolvedPlaceId: nearest.placeId || '',
    };
  } catch (error) {
    return {
      ...task,
      resolveError: error.message,
    };
  }
}

export async function resolveTasksForCurrentLocation(tasks, currentCoords) {
  return Promise.all(tasks.map((task) => resolveTaskDestination(task, currentCoords)));
}

export async function fetchNearbyTasks(coords) {
  if (!USE_MOCK_API && !isFirebaseConfigured) {
    const places = await searchNearbyPlaces(coords);
    return places.slice(0, 6).map(mapPlaceToTask);
  }

  if (isFirebaseConfigured) {
    const places = await searchNearbyPlaces(coords);
    return places.slice(0, 6).map(mapPlaceToTask);
  }

  await delay(300);
  const baseLocation = coords || { latitude: 25.0375, longitude: 121.5637 };

  return [
    buildMockNearbyTask(baseLocation, { latitude: 0.0022, longitude: 0.0015 }, {
      id: 'p-nearby-1',
      title: '順路買生活用品',
      location: '超市',
      exactAddress: '',
      locationMode: 'flexible',
      status: 'pending',
    }),
    buildMockNearbyTask(baseLocation, { latitude: -0.0017, longitude: 0.0021 }, {
      id: 'g-nearby-1',
      title: '幫群組採買共用物資',
      location: '便利商店',
      exactAddress: '台南市東區大學路 1 號',
      locationMode: 'fixed',
      status: 'in_progress',
      groupId: 'grp1',
    }),
  ];
}

export async function fetchWeather(currentCoords, tasks = []) {
  if (!currentCoords?.latitude || !currentCoords?.longitude) {
    throw new Error('缺少目前位置座標，無法查詢天氣。');
  }

  const activeTasks = tasks.filter((task) => task.status !== 'completed');
  const flexibleTasks = activeTasks.filter((task) => task.locationMode === 'flexible');
  const fixedTasks = activeTasks.filter((task) => task.locationMode === 'fixed');

  try {
    const params = new URLSearchParams({
      latitude: String(currentCoords.latitude),
      longitude: String(currentCoords.longitude),
      current: [
        'temperature_2m',
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m',
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
      ].join(','),
      timezone: 'auto',
      forecast_days: '1',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};
    const daily = data.daily || {};
    const weatherCode = current.weather_code ?? daily.weather_code?.[0] ?? null;
    const precipitationProbability = daily.precipitation_probability_max?.[0] ?? null;
    const condition = weatherCodeLabelMap[weatherCode] || '天氣資料更新中';
    const checklist = [];

    if (precipitationProbability !== null && precipitationProbability >= 50) {
      checklist.push('今天有明顯降雨機率，建議攜帶雨具並優先處理室內任務。');
    }

    if (typeof current.temperature_2m === 'number' && current.temperature_2m >= 30) {
      checklist.push('氣溫偏高，外出任務請補充水分並盡量避開正中午。');
    }

    if (typeof current.wind_speed_10m === 'number' && current.wind_speed_10m >= 28) {
      checklist.push('風勢較強，騎車或步行前往任務地點時請多留意安全。');
    }

    if (flexibleTasks.length > 0) {
      checklist.push('彈性地點任務可視天氣調整到較近的門市或延後處理。');
    }

    if (fixedTasks.length > 0) {
      checklist.push('固定地址任務建議先確認交通與降雨狀況，避免白跑一趟。');
    }

    if (activeTasks.length === 0) {
      checklist.push('目前沒有未完成任務，可以把今天當成彈性安排日。');
    }

    const advice =
      checklist[0] || '目前天氣大致穩定，可依原定節奏安排外出任務。';

    return {
      condition,
      locationLabel:
        data.timezone ||
        `${currentCoords.latitude.toFixed(3)}, ${currentCoords.longitude.toFixed(3)}`,
      temperature: current.temperature_2m ?? null,
      apparentTemperature: current.apparent_temperature ?? null,
      windSpeed: current.wind_speed_10m ?? null,
      precipitationProbability,
      advice,
      temperatureText: formatTemperature(current.temperature_2m),
      apparentTemperatureText: formatTemperature(current.apparent_temperature),
      windSpeedText: formatWindSpeed(current.wind_speed_10m),
      precipitationProbabilityText: formatProbability(precipitationProbability),
      impactedTasks: activeTasks.slice(0, 4).map((task) => ({
        id: task.id,
        title: task.title,
        location: task.location,
        locationMode: task.locationMode,
      })),
      checklist,
    };
  } catch (error) {
    await delay(200);

    const fallbackChecklist = [];

    if (flexibleTasks.length > 0) {
      fallbackChecklist.push('彈性地點任務建議優先選近一點的門市，減少天候風險。');
    }

    if (fixedTasks.length > 0) {
      fallbackChecklist.push('固定地址任務出門前建議再確認一下交通與天氣狀況。');
    }

    if (activeTasks.length === 0) {
      fallbackChecklist.push('目前沒有未完成任務，不受天氣提醒影響。');
    }

    return {
      condition: '天氣資料暫時無法更新',
      locationLabel: `${currentCoords.latitude.toFixed(3)}, ${currentCoords.longitude.toFixed(3)}`,
      temperature: null,
      apparentTemperature: null,
      windSpeed: null,
      precipitationProbability: null,
      advice: `已改用離線提醒邏輯。${error.message}`,
      temperatureText: '未知',
      apparentTemperatureText: '未知',
      windSpeedText: '未知',
      precipitationProbabilityText: '未知',
      impactedTasks: activeTasks.slice(0, 4).map((task) => ({
        id: task.id,
        title: task.title,
        location: task.location,
        locationMode: task.locationMode,
      })),
      checklist:
        fallbackChecklist.length > 0
          ? fallbackChecklist
          : ['目前無法取得即時天氣，建議外出前先查看天氣狀況。'],
    };
  }
}

export async function planRoute(selectedIds, uid, groupIds = [], currentCoords = null) {
  if (isFirebaseConfigured || !USE_MOCK_API) {
    const [personal, group] = isFirebaseConfigured
      ? await Promise.all([fetchPersonalTasks(uid), fetchGroupTasks(groupIds)])
      : [personalTasks, groupTasks];

    const tasks = [...personal, ...group].filter((task) => selectedIds.includes(task.id));
    const selectedTasks = selectedIds
      .map((id) => tasks.find((task) => task.id === id))
      .filter(Boolean);

    const resolvedTasks = await Promise.all(
      selectedTasks.map(async (task) => {
        const resolved = currentCoords
          ? await resolveTaskDestination(task, currentCoords)
          : { ...task };
        const coordinates =
          resolved.resolvedCoordinates ||
          resolved.coordinates ||
          (resolved.locationMode === 'fixed'
            ? await geocodeTaskLocation(resolved).catch(() => null)
            : null);

        return {
          ...resolved,
          resolvedCoordinates: normalizeCoordinates(coordinates),
        };
      })
    );

    const plannableTasks = resolvedTasks.filter((task) => task.resolvedCoordinates);

    if (plannableTasks.length === 0) {
      throw new Error('目前選取的任務都沒有可用座標，請先確認固定地址或目前位置。');
    }

    const routeOrigin = currentCoords || plannableTasks[0].resolvedCoordinates;
    const orderedTasks = currentCoords
      ? orderTasksByNearest(plannableTasks, currentCoords)
      : [
          plannableTasks[0],
          ...orderTasksByNearest(
            plannableTasks.slice(1),
            plannableTasks[0].resolvedCoordinates
          ),
        ];

    const tasksWithOrder = orderedTasks.map((task, index) => ({
      ...task,
      order: index + 1,
    }));

    if (tasksWithOrder.length === 1) {
      return {
        orderedTasks: tasksWithOrder,
        summary: {
          distanceText: '單一任務',
          durationText: currentCoords ? '依目前位置前往' : '請直接前往該任務地點',
        },
        routePath: currentCoords ? [currentCoords, tasksWithOrder[0].resolvedCoordinates] : [],
      };
    }

    const origin = routeOrigin;
    const destination = tasksWithOrder[tasksWithOrder.length - 1].resolvedCoordinates;
    const waypoints = currentCoords
      ? tasksWithOrder.slice(0, -1).map((task) => task.resolvedCoordinates)
      : tasksWithOrder.slice(1, -1).map((task) => task.resolvedCoordinates);

    const directions = await getDirections(origin, destination, waypoints);
    const totalMeters =
      directions.legs?.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0) || 0;
    const totalSeconds =
      directions.legs?.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) || 0;
    const routePath = decodePolyline(directions.overview_polyline?.points);

    return {
      orderedTasks: tasksWithOrder,
      summary: {
        distanceText: `${(totalMeters / 1000).toFixed(1)} 公里`,
        durationText:
          totalSeconds > 0 ? `${Math.round(totalSeconds / 60)} 分鐘` : '無法估算時間',
      },
      routePath,
    };
  }

  await delay(250);
  const tasks = [...personalTasks, ...groupTasks];

  return {
    orderedTasks: selectedIds
      .map((id) => tasks.find((task) => task.id === id))
      .filter(Boolean)
      .map((task, index) => ({
        ...task,
        order: index + 1,
      })),
    summary: {
      distanceText: '模擬模式',
      durationText: '依選取順序顯示',
    },
    routePath: [],
  };
}
