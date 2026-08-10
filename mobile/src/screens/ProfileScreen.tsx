import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { UserSession } from '../types';

interface ProfileScreenProps {
  user: UserSession | null;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Creator Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'G')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Gonnng Creator'}</Text>
          <Text style={styles.username}>@{user?.username || 'creator'}</Text>
          <Text style={styles.email}>{user?.email || 'creator@gonnng.app'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Server Connection</Text>
            <Text style={styles.infoValue}>Active (REST API)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Environment</Text>
            <Text style={styles.infoValue}>Live / Multi-Tenant</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  content: { padding: 20 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF5C00', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#000000' },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  username: { fontSize: 14, fontWeight: '600', color: '#FF5C00', marginTop: 2 },
  email: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  logoutBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#991B1B', fontWeight: '800', fontSize: 15 }
});
