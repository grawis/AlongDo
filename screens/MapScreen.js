import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import PlaceholderMap from '../components/PlaceholderMap';
import TaskCard from '../components/TaskCard';

export default function MapScreen({ personalTasks, groupTasks }) {
  const nearbyTasks = [...personalTasks.slice(0, 2), ...groupTasks.slice(0, 2)];

  return (
    <View style={styles.screen}>
      <Text style={styles.sectionTitle}>Map Preview</Text>
      <PlaceholderMap />
      <View style={styles.nearbySection}>
        <Text style={styles.nearbyTitle}>Nearby Mock Tasks</Text>
        <FlatList
          data={nearbyTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <TaskCard task={item} />}
        />
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2340',
    marginBottom: 10,
  },
  nearbySection: {
    flex: 1,
    marginTop: 16,
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333654',
    marginBottom: 10,
  },
  list: {
    paddingBottom: 12,
  },
});
