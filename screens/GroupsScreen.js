import React from 'react';
import { View, Text, FlatList, StyleSheet, Switch } from 'react-native';

export default function GroupsScreen({ groups, onToggleGroup }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>群組管理</Text>
      <Text style={styles.helpText}>你可以在這裡查看目前有哪些群組，並切換群組是否啟用。</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>目前沒有群組資料。</Text>}
        renderItem={({ item }) => (
          <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupInfo}>成員數：{item.members}</Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => onToggleGroup(item.id)}
                trackColor={{ false: '#d7dcea', true: '#97a8ff' }}
                thumbColor={item.enabled ? '#4a67ff' : '#f4f6fb'}
              />
            </View>
            <Text style={[styles.groupStatus, item.enabled ? styles.enabled : styles.disabled]}>
              {item.enabled ? '目前已啟用' : '目前已停用'}
            </Text>
          </View>
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
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e8f5',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1f2340',
  },
  groupInfo: {
    fontSize: 14,
    color: '#5f6477',
  },
  groupStatus: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  enabled: {
    color: '#2ea965',
  },
  disabled: {
    color: '#d44f4f',
  },
  emptyText: {
    color: '#7a7f98',
    marginTop: 40,
    textAlign: 'center',
  },
});
