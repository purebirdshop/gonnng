import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { mobileApi } from '../services/api';
import { ProjectItem } from '../types';

export const ProjectsScreen: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi.getProjects().then((data) => {
      setProjects(data.length > 0 ? data : [
        {
          id: 'p1',
          title: 'Modular Synthesizer Synth-1',
          description: 'Analog VCO and filter circuit recipe collection',
          category: 'Hardware Electronics',
          status: 'In Progress',
          createdAt: '2026-08-01'
        },
        {
          id: 'p2',
          title: 'Artisanal Sourdough Master Recipe',
          description: '3-day cold fermentation log with humidity metrics',
          category: 'Culinary Craft',
          status: 'Completed',
          createdAt: '2026-07-28'
        }
      ]);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Projects</Text>
        <Text style={styles.subtitle}>Active creator workspaces & recipes</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5C00" />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.badgeRow}>
                <Text style={styles.categoryBadge}>{item.category}</Text>
                <Text style={[styles.statusBadge, item.status === 'Completed' ? styles.statusDone : styles.statusProgress]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.projectTitle}>{item.title}</Text>
              <Text style={styles.projectDesc}>{item.description}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  categoryBadge: { fontSize: 12, fontWeight: '700', color: '#FF5C00', textTransform: 'uppercase' },
  statusBadge: { fontSize: 11, fontWeight: '700', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden' },
  statusDone: { backgroundColor: '#DEF7EC', color: '#03543F' },
  statusProgress: { backgroundColor: '#FEF08A', color: '#854D0E' },
  projectTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  projectDesc: { fontSize: 14, color: '#4B5563', lineHeight: 20 }
});
