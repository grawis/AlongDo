import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const shortUid = (uid) => (uid ? `${uid.slice(0, 6)}...` : '尚未取得');

function SummaryTile({ label, value }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen({
  personalTasks,
  groupTasks,
  groups,
  currentUser,
  sharedLocationLabel,
}) {
  const pendingPersonal = personalTasks.filter((task) => task.status === 'pending').length;
  const inProgressPersonal = personalTasks.filter((task) => task.status === 'in_progress').length;
  const activeGroups = groups.filter((group) => group.enabled).length;
  const pendingGroupTasks = groupTasks.filter((task) => task.status === 'pending').length;
  const inProgressGroupTasks = groupTasks.filter((task) => task.status === 'in_progress').length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>首頁</Text>
        <Text style={styles.heroText}>
          AlongDo 是一款結合待辦事項、群組協作、位置規劃與天氣提醒的行動 App，幫助使用者更直覺地安排日常任務與外出流程。
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>任務摘要</Text>
        <View style={styles.summaryGrid}>
          <SummaryTile label="個人任務總數" value={personalTasks.length} />
          <SummaryTile label="個人待處理" value={pendingPersonal} />
          <SummaryTile label="個人進行中" value={inProgressPersonal} />
          <SummaryTile label="啟用中群組" value={activeGroups} />
          <SummaryTile label="團隊待處理" value={pendingGroupTasks} />
          <SummaryTile label="團隊進行中" value={inProgressGroupTasks} />
        </View>
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaLine}>目前裝置身分：{shortUid(currentUser?.uid)}</Text>
        <Text style={styles.metaLine}>目前位置：{sharedLocationLabel || '尚未取得目前位置'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: colors.hero,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  heroText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: colors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryTile: {
    width: '48%',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  metaLine: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 4,
  },
});
