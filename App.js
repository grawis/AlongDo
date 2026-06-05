import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import HomeScreen from './screens/HomeScreen';
import MyTasksScreen from './screens/MyTasksScreen';
import GroupTasksScreen from './screens/GroupTasksScreen';
import GroupsScreen from './screens/GroupsScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import NearbySimulationScreen from './screens/NearbySimulationScreen';
import RoutePlannerScreen from './screens/RoutePlannerScreen';
import WeatherReminderScreen from './screens/WeatherReminderScreen';
import { ensureAnonymousAuth } from './services/auth';
import { colors } from './theme/colors';
import {
  createGroup,
  createGroupTask,
  createPersonalTask,
  deleteGroupTask,
  deletePersonalTask,
  fetchGroupMembers,
  fetchGroupTasks,
  fetchGroups,
  fetchPersonalTasks,
  joinGroupByInviteCode,
  updateGroupEnabled,
  updateGroupTaskStatus,
  updatePersonalTaskStatus,
} from './services/api';
import { db, isFirebaseConfigured } from './services/firebase';

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
const getEnabledGroupIds = (groupList) => groupList.filter((group) => group.enabled).map((group) => group.id);

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
  const [groupMembersByGroup, setGroupMembersByGroup] = useState({});
  const [loadingMemberGroupIds, setLoadingMemberGroupIds] = useState([]);
  const cachedMemberGroupIdsRef = useRef([]);

  useEffect(() => {
    initializeAppData();
  }, []);

  useEffect(() => {
    cachedMemberGroupIdsRef.current = Object.keys(groupMembersByGroup);
  }, [groupMembersByGroup]);

  useEffect(() => {
    if (!currentUser?.uid || !isFirebaseConfigured || !db) return;

    let active = true;

    const refreshData = async () => {
      if (!active) return;
      await loadData(currentUser.uid);

      const cachedGroupIds = cachedMemberGroupIdsRef.current;
      if (!active || cachedGroupIds.length === 0) return;

      const refreshedMembers = await Promise.all(
        cachedGroupIds.map(async (groupId) => [groupId, await fetchGroupMembers(groupId)])
      );

      if (!active) return;

      setGroupMembersByGroup(
        refreshedMembers.reduce((result, [groupId, members]) => {
          result[groupId] = members;
          return result;
        }, {})
      );
    };

    const subscriptions = [
      onSnapshot(
        query(collection(db, 'personalTasks'), where('ownerUid', '==', currentUser.uid)),
        refreshData
      ),
      onSnapshot(collection(db, 'groupMembers'), refreshData),
      onSnapshot(collection(db, 'groups'), refreshData),
      onSnapshot(collection(db, 'groupTasks'), refreshData),
    ];

    return () => {
      active = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser?.uid]);

  const loadData = async (uid) => {
    setLoading(true);

    try {
      const [personal, groupList] = await Promise.all([fetchPersonalTasks(uid), fetchGroups(uid)]);
      const groupIds = getEnabledGroupIds(groupList);
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

    const nextGroups = groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              enabled: nextEnabled,
            }
          : group
      );
    setGroups(nextGroups);
    const updatedGroupTasks = await fetchGroupTasks(getEnabledGroupIds(nextGroups));
    setGroupTasks(updatedGroupTasks);
  };

  const handleAdvanceGroupTaskStatus = async (taskId) => {
    if (!currentUser) return;

    const currentTask = groupTasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const actorName =
      groups.find((group) => group.id === currentTask.groupId)?.nickname || '目前成員';

    if (
      currentTask.status === 'in_progress' &&
      currentTask.claimedByUid &&
      currentTask.claimedByUid !== currentUser.uid
    ) {
      Alert.alert(
        '目前無法切換',
        `${currentTask.claimedByName || '其他成員'} 正在處理這筆任務，需由對方完成或取消後才能變更。`
      );
      return;
    }

    const nextStatus = getNextTaskStatus(currentTask.status);
    const updatedTaskMeta = await updateGroupTaskStatus(taskId, nextStatus, {
      uid: currentUser.uid,
      name: actorName,
    });

    setGroupTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: nextStatus,
              claimedByUid:
                updatedTaskMeta.claimedByUid !== undefined
                  ? updatedTaskMeta.claimedByUid
                  : task.claimedByUid,
              claimedByName:
                updatedTaskMeta.claimedByName !== undefined
                  ? updatedTaskMeta.claimedByName
                  : task.claimedByName,
              completedByUid:
                updatedTaskMeta.completedByUid !== undefined
                  ? updatedTaskMeta.completedByUid
                  : task.completedByUid,
              completedByName:
                updatedTaskMeta.completedByName !== undefined
                  ? updatedTaskMeta.completedByName
                  : task.completedByName,
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
    await loadData(currentUser.uid);
  };

  const handleJoinGroup = async ({ inviteCode, nickname }) => {
    if (!currentUser) return null;

    const joinedGroup = await joinGroupByInviteCode({ inviteCode, nickname }, currentUser.uid);
    const updatedGroups = await fetchGroups(currentUser.uid);
    const updatedGroupTasks = await fetchGroupTasks(getEnabledGroupIds(updatedGroups));

    setGroups(updatedGroups);
    setGroupTasks(updatedGroupTasks);
    return joinedGroup;
  };

  const handleLoadGroupMembers = async (groupId) => {
    if (groupMembersByGroup[groupId] && !loadingMemberGroupIds.includes(groupId)) {
      return groupMembersByGroup[groupId];
    }

    setLoadingMemberGroupIds((current) => [...current, groupId]);
    try {
      const members = await fetchGroupMembers(groupId);
      setGroupMembersByGroup((current) => ({
        ...current,
        [groupId]: members,
      }));
      return members;
    } finally {
      setLoadingMemberGroupIds((current) => current.filter((id) => id !== groupId));
    }
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

      <View style={[styles.header, activeTab === 'home' && styles.headerHome]}>
        <View style={[styles.brandRow, activeTab === 'home' && styles.brandRowHome]}>
          <Image
            source={require('./assets/icon-source.png')}
            style={[styles.brandIcon, activeTab === 'home' && styles.brandIconHome]}
          />
          <Text style={[styles.title, activeTab === 'home' && styles.titleHome]}>AlongDo</Text>
        </View>
        {activeTab === 'home' && (
          <Text style={styles.subtitleHome}>懂地點的待辦小幫手</Text>
        )}
        <Text style={styles.locationSummary}>{sharedLocationLabel}</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>正在載入你的任務與群組...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                personalTasks={personalTasks}
                groupTasks={groupTasks}
                groups={groups}
                currentUser={currentUser}
                sharedLocationLabel={sharedLocationLabel}
              />
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
                currentUserUid={currentUser?.uid}
              />
            )}
            {activeTab === 'groups' && (
              <GroupsScreen
                groups={groups}
                currentUser={currentUser}
                onToggleGroup={handleToggleGroup}
                onCreateGroup={handleCreateGroup}
                onJoinGroup={handleJoinGroup}
                groupMembersByGroup={groupMembersByGroup}
                loadingMemberGroupIds={loadingMemberGroupIds}
                onLoadGroupMembers={handleLoadGroupMembers}
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
                groupIds={getEnabledGroupIds(groups)}
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 10,
  },
  headerHome: {
    paddingTop: 34,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandRowHome: {
    justifyContent: 'center',
    alignSelf: 'center',
  },
  brandIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
  },
  brandIconHome: {
    width: 75,
    height: 75,
    borderRadius: 20,
  },
  title: {
    fontSize: 35,
    fontWeight: '700',
    color: colors.text,
  },
  titleHome: {
    fontSize: 54,
  },
  subtitleHome: {
    textAlign: 'center',
    fontSize: 17,
    marginTop: 8,
    color: colors.textSecondary,
  },
  locationSummary: {
    marginTop: 8,
    fontSize: 12,
    color: colors.primary,
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
    color: colors.primary,
    fontSize: 16,
  },
  navigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  navButton: {
    width: '25%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  navButtonActive: {
    backgroundColor: colors.secondarySoft,
  },
  navText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  navTextActive: {
    color: colors.primary,
  },
});
