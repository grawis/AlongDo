import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import TaskCard from '../components/TaskCard';

export default function MyTasksScreen({ tasks }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>我的待辦</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>目前還沒有個人任務。</Text>}
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
    marginBottom: 10,
  },
  list: {
    paddingBottom: 12,
  },
  emptyText: {
    color: '#7a7f98',
    marginTop: 40,
    textAlign: 'center',
  },
});
