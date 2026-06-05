import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import TaskCard from '../components/TaskCard';
import { colors } from '../theme/colors';

export default function MyTasksScreen({ tasks, onAdvanceTaskStatus, onDeleteTask }) {
  const confirmDelete = (task) => {
    Alert.alert('刪除個人任務', `確定要刪除「${task.title}」嗎？刪除後會同步從資料庫移除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => onDeleteTask(task.id),
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>我的任務</Text>
      <Text style={styles.helpText}>
        點一下任務卡片可切換狀態，流程會依序從待處理、進行中，到已完成，再回到待處理。
      </Text>

      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>目前還沒有個人任務。</Text>
      ) : (
        tasks.map((item) => (
          <TouchableOpacity key={item.id} activeOpacity={0.88} onPress={() => onAdvanceTaskStatus(item.id)}>
            <TaskCard task={item} onDelete={confirmDelete} />
          </TouchableOpacity>
        ))
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
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 40,
    textAlign: 'center',
  },
});
