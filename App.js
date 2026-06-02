import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import HomeScreen from './screens/HomeScreen';
import MyTasksScreen from './screens/MyTasksScreen';
import GroupTasksScreen from './screens/GroupTasksScreen';
import GroupsScreen from './screens/GroupsScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import NearbySimulationScreen from './screens/NearbySimulationScreen';
import RoutePlannerScreen from './screens/RoutePlannerScreen';
import WeatherReminderScreen from './screens/WeatherReminderScreen';
import { ensureAnonymousAuth } from './services/auth';
import {
  createGroup,
  createGroupTask,
  createPersonalTask,
  deleteGroupTask,
  deletePersonalTask,
  fetchGroupTasks,
  fetchGroups,
  fetchPersonalTasks,
  joinGroupByInviteCode,
  updateGroupEnabled,
  updateGroupTaskStatus,
  updatePersonalTaskStatus,
} from './services/api';

const tabs = [
  { key: 'home', label: '首頁' },
  { key: 'myTasks', label: '我的任務' },
  { key: 'groupTasks', label: '團隊任務' },
  { key: 'groups', label: '群組' },
  { key: 'add', label: '新增任務' },
  { key: 'nearby', label: '附近任務' },
  { key: 'route', label: '路線規劃' },
  { key: 'weather', label: '天氣提醒' },
];

const getNextTaskStatus = (status) => {
  if (status === 'pending') return 'in_progress';
  if (status === 'in_progress') return 'completed';
  return 'pending';
};

const shortUid = (uid) => (uid ? `${uid.slice(0, 6)}...` : '');

const formatCoordsLabel = (coords) => `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;

const buildSharedLocationLabel = (coords, place) => {
  const regionText = [place?.region, place?.city || place?.district].filter(Boolean).join('');
  const areaLabel = regionText ? `${regionText}附近` : '目前位置';
  return `${areaLabel}（${formatCoordsLabel(coords)}）`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [personalTasks, setPersonalTasks] = useState([]);
  const [groupTasks, setGroupTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharedLocation, setSharedLocation] = useState(null);
  const [sharedLocationLabel, setSharedLocationLabel] = useState('尚未取得目前位置');

  useEffect(() => {
    initializeAppData();
  }, []);

  const loadData = async (uid) => {
    setLoading(true);

    try {
      const [personal, groupList] = await Promise.all([fetchPersonalTasks(uid), fetchGroups(uid)]);
      const groupIds = groupList.map((group) => group.id);
      const groupTaskList = await fetchGroupTasks(groupIds);

      setPersonalTasks(personal);
      setGroups(groupList);
      setGroupTasks(groupTaskList);
    } finally {
      setLoading(false);
    }
  };

  const initializeAppData = async () => {
    setLoading(true);
    const user = await ensureAnonymousAuth();
    setCurrentUser(user);
    await loadData(user.uid);
  };

  const requestSharedLocation = async () => {
    const hasServicesEnabled = await Location.hasServicesEnabledAsync();
    if (!hasServicesEnabled) {
      throw new Error('裝置定位服務尚未開啟。');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('尚未取得定位權限。');
    }

    let position = null;

    try {
      position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch (error) {
      const fallback = await Location.getLastKnownPositionAsync({
        maxAge: 60 * 1000,
        requiredAccuracy: 200,
      });

      if (!fallback) {
        throw error;
      }

      position = fallback;
    }

    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    let place = null;
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync(coords);
      place = reverseGeocode?.[0] || null;
    } catch (error) {
      console.warn('Reverse geocode failed:', error);
    }

    setSharedLocation(coords);
    setSharedLocationLabel(buildSharedLocationLabel(coords, place));
    return coords;
  };

  const handleAddTask = async (task) => {
    if (!currentUser) return;

    if (task.taskType === 'group') {
      const targetGroup = groups.find((group) => group.id === task.groupId);
      const newGroupTask = await createGroupTask(
        {
          ...task,
          groupName: targetGroup?.name || '',
          ownerName: targetGroup?.nickname || '我',
        },
        currentUser.uid
      );

      setGroupTasks((current) => [newGroupTask, ...current]);
      setActiveTab('groupTasks');
      return;
    }

    const newTask = await createPersonalTask(task, currentUser.uid);
    setPersonalTasks((current) => [newTask, ...current]);
    setActiveTab('myTasks');
  };

  const handleToggleGroup = async (groupId) => {
    const currentGroup = groups.find((group) => group.id === groupId);
    if (!currentGroup) return;

    const nextEnabled = !currentGroup.enabled;
    await updateGroupEnabled(groupId, nextEnabled);

    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              enabled: nextEnabled,
            }
          : group
      )
    );
  };

  const handleAdvanceGroupTaskStatus = async (taskId) => {
    const currentTask = groupTasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const nextStatus = getNextTaskStatus(currentTask.status);
    await updateGroupTaskStatus(taskId, nextStatus);

    setGroupTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    );
  };

  const handleAdvancePersonalTaskStatus = async (taskId) => {
    const currentTask = personalTasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const nextStatus = getNextTaskStatus(currentTask.status);
    await updatePersonalTaskStatus(taskId, nextStatus);

    setPersonalTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
            }
          : task
      )
    );
  };

  const handleCreateGroup = async ({ name, nickname }) => {
    if (!currentUser) return;

    const createdGroup = await createGroup({ name, nickname }, currentUser.uid);
    setGroups((current) => [createdGroup, ...current]);
  };

  const handleJoinGroup = async ({ inviteCode, nickname }) => {
    if (!currentUser) return null;

    const joinedGroup = await joinGroupByInviteCode({ inviteCode, nickname }, currentUser.uid);
    const updatedGroups = await fetchGroups(currentUser.uid);
    const updatedGroupTasks = await fetchGroupTasks(updatedGroups.map((group) => group.id));

    setGroups(updatedGroups);
    setGroupTasks(updatedGroupTasks);
    return joinedGroup;
  };

  const handleDeletePersonalTask = async (taskId) => {
    await deletePersonalTask(taskId);
    setPersonalTasks((current) => current.filter((task) => task.id !== taskId));
  };

  const handleDeleteGroupTask = async (taskId) => {
    await deleteGroupTask(taskId);
    setGroupTasks((current) => current.filter((task) => task.id !== taskId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>AlongDo</Text>
        <Text style={styles.subtitle}>懂地點的待辦小幫手</Text>
        {currentUser ? <Text style={styles.identity}>目前裝置身分：{shortUid(currentUser.uid)}</Text> : null}
        <Text style={styles.locationSummary}>{sharedLocationLabel}</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a67ff" />
            <Text style={styles.loadingText}>正在載入你的任務與群組...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen personalTasks={personalTasks} groupTasks={groupTasks} groups={groups} />
            )}
            {activeTab === 'myTasks' && (
              <MyTasksScreen
                tasks={personalTasks}
                onAdvanceTaskStatus={handleAdvancePersonalTaskStatus}
                onDeleteTask={handleDeletePersonalTask}
              />
            )}
            {activeTab === 'groupTasks' && (
              <GroupTasksScreen
                tasks={groupTasks}
                onAdvanceTaskStatus={handleAdvanceGroupTaskStatus}
                onDeleteTask={handleDeleteGroupTask}
              />
            )}
            {activeTab === 'groups' && (
              <GroupsScreen
                groups={groups}
                currentUser={currentUser}
                onToggleGroup={handleToggleGroup}
                onCreateGroup={handleCreateGroup}
                onJoinGroup={handleJoinGroup}
              />
            )}
            {activeTab === 'add' && <AddTaskScreen groups={groups} onAddTask={handleAddTask} />}
            {activeTab === 'nearby' && (
              <NearbySimulationScreen
                personalTasks={personalTasks}
                groupTasks={groupTasks}
                sharedLocation={sharedLocation}
                sharedLocationLabel={sharedLocationLabel}
                onRequestLocation={requestSharedLocation}
              />
            )}
            {activeTab === 'route' && (
              <RoutePlannerScreen
                tasks={[...personalTasks, ...groupTasks]}
                currentUserUid={currentUser?.uid}
                groupIds={groups.map((group) => group.id)}
                sharedLocation={sharedLocation}
                sharedLocationLabel={sharedLocationLabel}
                onRequestLocation={requestSharedLocation}
              />
            )}
            {activeTab === 'weather' && (
              <WeatherReminderScreen
                tasks={[...personalTasks, ...groupTasks]}
                sharedLocation={sharedLocation}
                sharedLocationLabel={sharedLocationLabel}
                onRequestLocation={requestSharedLocation}
              />
            )}
          </>
        )}
      </View>

      <View style={styles.navigation}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.navButton, activeTab === tab.key && styles.navButtonActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.navText, activeTab === tab.key && styles.navTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e1f25',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b6f85',
  },
  identity: {
    marginTop: 6,
    fontSize: 12,
    color: '#7a7f98',
  },
  locationSummary: {
    marginTop: 6,
    fontSize: 12,
    color: '#4a67ff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#4a67ff',
    fontSize: 16,
  },
  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#dde0ec',
    backgroundColor: '#ffffff',
  },
  navButton: {
    width: '25%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f2f7',
  },
  navButtonActive: {
    backgroundColor: '#eef3ff',
  },
  navText: {
    color: '#5f6477',
    fontSize: 11,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#27316b',
  },
});
