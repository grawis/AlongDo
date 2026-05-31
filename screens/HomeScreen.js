import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen({ personalTasks, groupTasks, groups }) {
  const pendingPersonal = personalTasks.filter((task) => task.status === 'pending').length;
  const activeGroups = groups.filter((group) => group.enabled).length;
  const pendingGroupTasks = groupTasks.filter((task) => task.status === 'pending').length;

  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>AlongDo 摘要</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>目前狀態</Text>
        <Text style={styles.cardText}>個人任務：{personalTasks.length}</Text>
        <Text style={styles.cardText}>待處理個人任務：{pendingPersonal}</Text>
        <Text style={styles.cardText}>團隊任務：{groupTasks.length}</Text>
        <Text style={styles.cardText}>啟用中的群組：{activeGroups}</Text>
        <Text style={styles.cardText}>待處理團隊任務：{pendingGroupTasks}</Text>
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>目前重點</Text>
        <Text style={styles.noteText}>
          你現在可以新增個人任務或團隊任務，並把任務地點分成彈性地點與固定地址兩種模式。彈性地點之後會依當前位置找最近地點，固定地址則會一直維持同一個目的地。
        </Text>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2340',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1f2340',
  },
  cardText: {
    fontSize: 14,
    color: '#4f5472',
    marginBottom: 6,
  },
  noteBox: {
    backgroundColor: '#eef3ff',
    borderRadius: 14,
    padding: 16,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2340',
  },
  noteText: {
    fontSize: 14,
    color: '#5f6477',
    lineHeight: 20,
  },
});
