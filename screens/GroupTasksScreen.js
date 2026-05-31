import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import TaskCard from '../components/TaskCard';

export default function GroupTasksScreen({ tasks, onAdvanceTaskStatus }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>團隊任務</Text>
      <Text style={styles.helpText}>
        點一下任務卡片就會把狀態往前推進，會依序從待處理變成進行中，再變成已完成。
      </Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>目前還沒有團隊任務。</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.88} onPress={() => onAdvanceTaskStatus(item.id)}>
            <TaskCard task={item} />
          </TouchableOpacity>
        )}
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
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#5f6477',
    marginBottom: 12,
    lineHeight: 20,
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
