import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { planRoute } from '../services/api';

const buildLocationPreview = (task) => {
  if (task.locationMode === 'fixed' && task.exactAddress) {
    return `${task.location} / ${task.exactAddress}`;
  }

  if (task.locationMode === 'flexible') {
    return `${task.location}（會依當前位置找最近地點）`;
  }

  return task.location;
};

export default function RoutePlannerScreen({ tasks }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [routePlan, setRoutePlan] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (selectedIds.length > 0) {
      setErrorMessage('');
      planRoute(selectedIds)
        .then(setRoutePlan)
        .catch((error) => {
          console.warn(error);
          setRoutePlan([]);
          setErrorMessage(error.message);
        });
    } else {
      setRoutePlan([]);
      setErrorMessage('');
    }
  }, [selectedIds]);

  const toggleTask = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>路線規劃</Text>
      <Text style={styles.helpText}>先選幾筆任務，系統會用目前資料幫你模擬執行順序。</Text>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.taskSelect, selectedIds.includes(item.id) && styles.taskSelected]}
            onPress={() => toggleTask(item.id)}
          >
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskLocation}>{buildLocationPreview(item)}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.routeBox}>
        <Text style={styles.routeTitle}>規劃結果</Text>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : routePlan.length === 0 ? (
          <Text style={styles.routeText}>請先選擇兩筆以上任務來產生路線順序。</Text>
        ) : (
          routePlan.map((task) => (
            <Text key={task.id} style={styles.routeText}>
              {task.order}. {task.title}，地點：{buildLocationPreview(task)}
            </Text>
          ))
        )}
      </View>
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
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#5f6477',
    marginBottom: 12,
  },
  list: {
    paddingBottom: 12,
  },
  taskSelect: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e8f2',
  },
  taskSelected: {
    borderColor: '#4a67ff',
    backgroundColor: '#eef3ff',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2340',
  },
  taskLocation: {
    marginTop: 4,
    color: '#6b718d',
  },
  routeBox: {
    backgroundColor: '#eef3ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1f2340',
  },
  routeText: {
    color: '#4c536f',
    marginBottom: 6,
  },
  errorText: {
    color: '#b22222',
    marginBottom: 6,
  },
});
