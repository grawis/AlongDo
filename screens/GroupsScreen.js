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

export default function GroupsScreen({
  groups,
  currentUser,
  onToggleGroup,
  onCreateGroup,
  onJoinGroup,
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupNickname, setNewGroupNickname] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionTitle}>群組管理</Text>
      <Text style={styles.helpText}>
        你可以建立自己的群組、設定在群組中的暱稱，也可以請朋友輸入邀請碼加入同一個群組。
      </Text>
      {currentUser ? (
        <Text style={styles.identity}>目前裝置身分：{currentUser.uid.slice(0, 6)}...</Text>
      ) : null}

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
                trackColor={{ false: '#d7dcea', true: '#97a8ff' }}
                thumbColor={item.enabled ? '#4a67ff' : '#f4f6fb'}
              />
            </View>
            <Text style={[styles.groupStatus, item.enabled ? styles.enabled : styles.disabled]}>
              {item.enabled ? '目前啟用中' : '目前停用中'}
            </Text>
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
    color: '#1f2340',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#5f6477',
    marginBottom: 8,
    lineHeight: 20,
  },
  identity: {
    fontSize: 12,
    color: '#7a7f98',
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e8f5',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2340',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d8dee7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
    color: '#1f2340',
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#4a67ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#eef3ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#27316b',
    fontWeight: '700',
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
    color: '#1f2340',
  },
  groupInfo: {
    fontSize: 14,
    color: '#5f6477',
    marginBottom: 4,
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
    marginTop: 24,
    textAlign: 'center',
  },
});
