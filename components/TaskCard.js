import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { statusLabels, groups } from '../data/mockTasks';

const groupNameById = Object.fromEntries(groups.map((group) => [group.id, group.name]));

export default function TaskCard({ task }) {
  const statusColor =
    task.status === 'completed'
      ? '#2ea965'
      : task.status === 'in_progress'
      ? '#f2994a'
      : '#5566ff';

  const statusLabel = statusLabels[task.status] || task.status;
  const typeLabel = task.groupId
    ? `團隊任務 / ${groupNameById[task.groupId] || task.groupName || task.groupId}`
    : '個人任務';

  const locationModeLabel = task.locationMode === 'fixed' ? '固定地址' : '彈性地點';
  const resolvedAddress = task.resolvedAddress || task.exactAddress || '';
  const resolvedPlaceName = task.resolvedPlaceName || '';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.detail}>任務地點：{task.location}</Text>
      {task.locationMode === 'fixed' && resolvedAddress ? (
        <Text style={styles.subDetail}>固定地址：{resolvedAddress}</Text>
      ) : null}
      {task.locationMode === 'flexible' && resolvedPlaceName ? (
        <Text style={styles.subDetail}>目前對應地點：{resolvedPlaceName}</Text>
      ) : null}
      {task.locationMode === 'flexible' && resolvedAddress ? (
        <Text style={styles.subDetail}>目前地址：{resolvedAddress}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>模式：{locationModeLabel}</Text>
        <Text style={styles.metaText}>{typeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2340',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  detail: {
    marginTop: 10,
    color: '#5f6477',
    lineHeight: 20,
  },
  subDetail: {
    marginTop: 6,
    color: '#6d7390',
    lineHeight: 20,
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#7a7f98',
    flex: 1,
  },
});
