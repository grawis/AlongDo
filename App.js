import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import MyTasksScreen from './screens/MyTasksScreen';
import GroupTasksScreen from './screens/GroupTasksScreen';
import GroupsScreen from './screens/GroupsScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import NearbySimulationScreen from './screens/NearbySimulationScreen';
import RoutePlannerScreen from './screens/RoutePlannerScreen';
import WeatherReminderScreen from './screens/WeatherReminderScreen';
import {
  fetchPersonalTasks,
  fetchGroupTasks,
  fetchGroups,
  createPersonalTask,
  createGroupTask,
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

const getNextGroupTaskStatus = (status) => {
  if (status === 'pending') {
    return 'in_progress';
  }

  if (status === 'in_progress') {
    return 'completed';
  }

  return 'completed';
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [personalTasks, setPersonalTasks] = useState([]);
  const [groupTasks, setGroupTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [personal, group, groupList] = await Promise.all([
        fetchPersonalTasks(),
        fetchGroupTasks(),
        fetchGroups(),
      ]);

      setPersonalTasks(personal);
      setGroupTasks(group);
      setGroups(groupList);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (task) => {
    if (task.taskType === 'group') {
      const targetGroup = groups.find((group) => group.id === task.groupId);
      const newGroupTask = await createGroupTask({
        ...task,
        groupName: targetGroup?.name || '',
        ownerName: '我',
      });

      setGroupTasks((current) => [newGroupTask, ...current]);
      setActiveTab('groupTasks');
      return;
    }

    const newTask = await createPersonalTask(task);
    setPersonalTasks((current) => [newTask, ...current]);
    setActiveTab('myTasks');
  };

  const handleToggleGroup = (groupId) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              enabled: !group.enabled,
            }
          : group
      )
    );
  };

  const handleAdvanceGroupTaskStatus = (taskId) => {
    setGroupTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: getNextGroupTaskStatus(task.status),
            }
          : task
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>AlongDo</Text>
        <Text style={styles.subtitle}>懂地點的待辦小幫手</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a67ff" />
            <Text style={styles.loadingText}>正在載入任務資料...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeScreen personalTasks={personalTasks} groupTasks={groupTasks} groups={groups} />
            )}
            {activeTab === 'myTasks' && <MyTasksScreen tasks={personalTasks} />}
            {activeTab === 'groupTasks' && (
              <GroupTasksScreen tasks={groupTasks} onAdvanceTaskStatus={handleAdvanceGroupTaskStatus} />
            )}
            {activeTab === 'groups' && <GroupsScreen groups={groups} onToggleGroup={handleToggleGroup} />}
            {activeTab === 'add' && <AddTaskScreen groups={groups} onAddTask={handleAddTask} />}
            {activeTab === 'nearby' && (
              <NearbySimulationScreen personalTasks={personalTasks} groupTasks={groupTasks} />
            )}
            {activeTab === 'route' && <RoutePlannerScreen tasks={[...personalTasks, ...groupTasks]} />}
            {activeTab === 'weather' && <WeatherReminderScreen />}
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
            <Text style={[styles.navText, activeTab === tab.key && styles.navTextActive]}>{tab.label}</Text>
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
