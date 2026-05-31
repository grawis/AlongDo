import {
  personalTasks as initialPersonalTasks,
  groupTasks as initialGroupTasks,
  groups as initialGroups,
} from '../data/mockTasks';
import { USE_MOCK_API } from './config';
import { httpGet, httpPost } from './http';
import { geocodeAddress, searchNearbyPlaces, getDirections } from './googleMaps';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let personalTasks = [...initialPersonalTasks];
let groupTasks = [...initialGroupTasks];

const normalizeCoordinates = (coordinates) => {
  if (!coordinates) {
    return null;
  }

  return {
    latitude: coordinates.latitude ?? coordinates.lat,
    longitude: coordinates.longitude ?? coordinates.lng,
  };
};

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

const mapPlaceToTask = (place, index) => ({
  id: place.placeId ? `nearby-${place.placeId}` : `nearby-${index}`,
  title: place.name,
  location: place.name,
  exactAddress: place.address || '',
  locationMode: 'fixed',
  status: 'pending',
  coordinates: normalizeCoordinates(place.coordinates),
  googlePlaceId: place.placeId,
  type: 'personal',
});

const geocodeTaskLocation = async (task) => {
  if (task.coordinates) {
    return normalizeCoordinates(task.coordinates);
  }

  return geocodeAddress(task.exactAddress || task.location);
};

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

export async function fetchPersonalTasks() {
  if (!USE_MOCK_API) {
    return httpGet('/tasks/personal');
  }

  await delay(250);
  return personalTasks;
}

export async function fetchGroupTasks() {
  if (!USE_MOCK_API) {
    return httpGet('/tasks/group');
  }

  await delay(250);
  return groupTasks;
}

export async function fetchGroups() {
  if (!USE_MOCK_API) {
    return httpGet('/groups');
  }

  await delay(200);
  return initialGroups;
}

export async function createPersonalTask(task) {
  if (!USE_MOCK_API) {
    return httpPost('/tasks/personal', task);
  }

  await delay(250);
  const nextId = `p${personalTasks.length + 1}`;
  const baseTask = {
    id: nextId,
    title: task.title,
    location: task.location,
    exactAddress: task.exactAddress || '',
    locationMode: task.locationMode || 'flexible',
    coordinates: task.coordinates || null,
    googlePlaceId: task.googlePlaceId || '',
    status: 'pending',
    selectedForRoute: false,
    type: 'personal',
  };

  const newTask = await withResolvedCoordinates(baseTask);
  personalTasks = [newTask, ...personalTasks];
  return newTask;
}

export async function createGroupTask(task) {
  if (!USE_MOCK_API) {
    return httpPost('/tasks/group', task);
  }

  await delay(250);
  const nextId = `g${groupTasks.length + 1}`;
  const baseTask = {
    id: nextId,
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
    type: 'group',
  };

  const newTask = await withResolvedCoordinates(baseTask);
  groupTasks = [newTask, ...groupTasks];
  return newTask;
}

export async function resolveTaskDestination(task, currentCoords) {
  if (!currentCoords) {
    return task;
  }

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

  if (!task.location) {
    return task;
  }

  try {
    const places = await searchNearbyPlaces(currentCoords, {
      keyword: task.location,
      rankByDistance: true,
    });

    const nearest = places[0];
    if (!nearest) {
      return task;
    }

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
  if (!USE_MOCK_API) {
    const places = await searchNearbyPlaces(coords);
    return places.slice(0, 6).map(mapPlaceToTask);
  }

  await delay(300);
  const baseLocation = coords || { latitude: 25.0375, longitude: 121.5637 };

  return [
    buildMockNearbyTask(baseLocation, { latitude: 0.0022, longitude: 0.0015 }, {
      id: 'p-nearby-1',
      title: '順路買生活用品',
      location: '全聯',
      exactAddress: '',
      locationMode: 'flexible',
      status: 'pending',
    }),
    buildMockNearbyTask(baseLocation, { latitude: -0.0017, longitude: 0.0021 }, {
      id: 'g-nearby-1',
      title: '幫群組採買共用物資',
      location: '便利商店',
      exactAddress: '台南市東區勝利路 118 號',
      locationMode: 'fixed',
      status: 'in_progress',
      groupId: 'grp1',
    }),
  ];
}

export async function fetchWeather() {
  if (!USE_MOCK_API) {
    return httpGet('/weather');
  }

  await delay(250);
  return {
    condition: '晴天',
    temperature: 22,
    advice: '今天適合安排外出任務，記得補充水分。',
  };
}

export async function planRoute(selectedIds) {
  if (!USE_MOCK_API) {
    const tasks = [...personalTasks, ...groupTasks].filter((task) => selectedIds.includes(task.id));
    const sortedTasks = selectedIds
      .map((id) => tasks.find((task) => task.id === id))
      .filter(Boolean);

    const geocodedTasks = await Promise.all(
      sortedTasks.map(async (task) => ({
        ...task,
        coordinates: await geocodeTaskLocation(task),
      }))
    );

    if (geocodedTasks.length < 2) {
      return geocodedTasks.map((task, index) => ({ ...task, order: index + 1 }));
    }

    const origin = geocodedTasks[0].coordinates;
    const destination = geocodedTasks[geocodedTasks.length - 1].coordinates;
    const waypoints = geocodedTasks.slice(1, -1).map((task) => task.coordinates);
    await getDirections(origin, destination, waypoints);

    return geocodedTasks.map((task, index) => ({
      ...task,
      order: index + 1,
    }));
  }

  await delay(250);
  const tasks = [...personalTasks, ...groupTasks];

  return selectedIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter(Boolean)
    .map((task, index) => ({
      ...task,
      order: index + 1,
    }));
}
