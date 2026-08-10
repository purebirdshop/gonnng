import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { mobileApi } from '../services/api';
import { FeedPost } from '../types';

export const HomeScreen: React.FC = () => {
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi.getFeed().then((data) => {
      setFeed(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gonnng Workspace</Text>
        <Text style={styles.subtitle}>Latest Creator Activity & Updates</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5C00" />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.creatorName}>{item.creatorName}</Text>
                <Text style={styles.creatorHandle}>{item.creatorHandle}</Text>
                <Text style={styles.time}>{item.timestamp}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardContent}>{item.content}</Text>
              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>❤️ {item.likesCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>💬 {item.commentsCount}</Text>
                </TouchableOpacity>
              </View>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  creatorName: { fontWeight: '700', fontSize: 15, color: '#111827', marginRight: 6 },
  creatorHandle: { fontSize: 13, color: '#6B7280', marginRight: 'auto' },
  time: { fontSize: 12, color: '#9CA3AF' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardContent: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', gap: 16 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#374151' }
});
