import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

export default function GroupsScreen({
  groups,
  onToggleGroup,
  onCreateGroup,
  onJoinGroup,
  groupMembersByGroup,
  loadingMemberGroupIds,
  onLoadGroupMembers,
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupNickname, setNewGroupNickname] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [expandedGroupIds, setExpandedGroupIds] = useState([]);

  const handleCreate = async () => {
    if (!newGroupName.trim() || !newGroupNickname.trim()) {
      Alert.alert('欄位未完成', '請先填寫群組名稱與你在群組中的暱稱。');
      return;
    }

    await onCreateGroup({
      name: newGroupName.trim(),
      nickname: newGroupNickname.trim(),
    });

    setNewGroupName('');
    setNewGroupNickname('');
    Alert.alert('群組建立成功', '新群組已建立完成，畫面上的邀請碼可以分享給其他人加入。');
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || !joinNickname.trim()) {
      Alert.alert('欄位未完成', '請輸入邀請碼與你加入後要顯示的暱稱。');
      return;
    }

    try {
      await onJoinGroup({
        inviteCode: inviteCode.trim(),
        nickname: joinNickname.trim(),
      });
      setInviteCode('');
      setJoinNickname('');
      Alert.alert('加入成功', '你已成功加入群組。');
    } catch (error) {
      Alert.alert('加入失敗', error.message);
    }
  };

  const handleToggleMembers = async (groupId) => {
    const expanded = expandedGroupIds.includes(groupId);

    if (expanded) {
      setExpandedGroupIds((current) => current.filter((id) => id !== groupId));
      return;
    }

    setExpandedGroupIds((current) => [...current, groupId]);
    if (!groupMembersByGroup[groupId]) {
      await onLoadGroupMembers(groupId);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>群組管理</Text>
      <Text style={styles.helpText}>
        你可以建立自己的群組、設定在群組中的暱稱，也可以請朋友輸入邀請碼加入同一個群組。
      </Text>
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>建立新群組</Text>
        <TextInput
          style={styles.input}
          value={newGroupName}
          onChangeText={setNewGroupName}
          placeholder="例如：家庭、研究室、一起跑專題"
          placeholderTextColor="#9da3b2"
        />
        <TextInput
          style={styles.input}
          value={newGroupNickname}
          onChangeText={setNewGroupNickname}
          placeholder="你在這個群組中的暱稱，例如：阿哲、哥哥"
          placeholderTextColor="#9da3b2"
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
          <Text style={styles.primaryButtonText}>建立群組</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>用邀請碼加入群組</Text>
        <TextInput
          style={styles.input}
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="輸入 6 碼邀請碼"
          placeholderTextColor="#9da3b2"
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.input}
          value={joinNickname}
          onChangeText={setJoinNickname}
          placeholder="加入後顯示的暱稱"
          placeholderTextColor="#9da3b2"
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={handleJoin}>
          <Text style={styles.secondaryButtonText}>加入群組</Text>
        </TouchableOpacity>
      </View>

      {groups.length === 0 ? (
        <Text style={styles.emptyText}>你目前還沒有加入任何群組。</Text>
      ) : (
        groups.map((item) => (
          <View key={item.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View style={styles.groupTextWrap}>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupInfo}>成員數：{item.members}</Text>
                <Text style={styles.groupInfo}>我的暱稱：{item.nickname || '尚未設定'}</Text>
                <Text style={styles.groupInfo}>角色：{item.role === 'owner' ? '建立者' : '成員'}</Text>
                <Text style={styles.groupInfo}>邀請碼：{item.inviteCode || '尚未產生'}</Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => onToggleGroup(item.id)}
                trackColor={{ false: colors.borderStrong, true: '#8fdcca' }}
                thumbColor={item.enabled ? colors.secondary : colors.surface}
              />
            </View>
            <Text style={[styles.groupStatus, item.enabled ? styles.enabled : styles.disabled]}>
              {item.enabled ? '目前啟用中' : '目前停用中'}
            </Text>

            <TouchableOpacity
              style={styles.membersButton}
              onPress={() => handleToggleMembers(item.id)}
            >
              <Text style={styles.membersButtonText}>
                {expandedGroupIds.includes(item.id) ? '收起成員列表' : '顯示目前成員'}
              </Text>
            </TouchableOpacity>

            {expandedGroupIds.includes(item.id) ? (
              <View style={styles.memberBox}>
                {loadingMemberGroupIds.includes(item.id) ? (
                  <Text style={styles.memberHint}>正在載入成員資料...</Text>
                ) : groupMembersByGroup[item.id]?.length ? (
                  groupMembersByGroup[item.id].map((member) => (
                    <View key={member.id} style={styles.memberRow}>
                      <Text style={styles.memberName}>{member.nickname}</Text>
                      <Text style={styles.memberMeta}>
                        {member.role === 'owner' ? '建立者' : '成員'} / {member.uid.slice(0, 6)}...
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.memberHint}>目前沒有成員資料。</Text>
                )}
              </View>
            ) : null}
          </View>
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
    marginBottom: 8,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.secondarySoft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  groupTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: colors.text,
  },
  groupInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  groupStatus: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  membersButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  membersButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  memberBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  memberRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  memberMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  memberHint: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  enabled: {
    color: colors.success,
  },
  disabled: {
    color: colors.danger,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 24,
    textAlign: 'center',
  },
});
