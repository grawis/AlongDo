import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { statusLabels } from '../data/mockTasks';
import { colors } from '../theme/colors';

export default function TaskCard({ task, onDelete }) {
  const statusColor =
    task.status === 'completed'
      ? colors.success
      : task.status === 'in_progress'
      ? colors.warning
      : colors.primary;

  const statusLabel = statusLabels[task.status] || task.status;
  const typeLabel = task.groupId ? `團隊任務 / ${task.groupName || task.groupId}` : '個人任務';
  const locationModeLabel = task.locationMode === 'fixed' ? '固定地址' : '彈性地點';
  const resolvedAddress = task.resolvedAddress || task.exactAddress || '';
  const resolvedPlaceName = task.resolvedPlaceName || '';
  const statusOwnerLine =
    task.groupId && task.status === 'in_progress' && task.claimedByName
      ? `目前處理者：${task.claimedByName}`
      : task.groupId && task.status === 'completed' && task.completedByName
      ? `完成者：${task.completedByName}`
      : '';

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
        <Text style={styles.subDetail}>目前對應地址：{resolvedAddress}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>模式：{locationModeLabel}</Text>
        <Text style={styles.metaText}>{typeLabel}</Text>
      </View>

      {statusOwnerLine ? <Text style={styles.statusOwnerText}>{statusOwnerLine}</Text> : null}

      {onDelete ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(task)}>
            <Text style={styles.deleteButtonText}>刪除任務</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0d2930',
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
    color: colors.text,
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
    color: colors.textSecondary,
    lineHeight: 20,
  },
  subDetail: {
    marginTop: 6,
    color: colors.textSecondary,
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
    color: colors.textMuted,
    flex: 1,
  },
  statusOwnerText: {
    marginTop: 10,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 14,
    alignItems: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#f2d3d6',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});
