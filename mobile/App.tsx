import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { UserSession } from './src/types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'projects' | 'profile'>('home');

  if (!currentUser) {
    return (
      <>
        <StatusBar barStyle="dark-content" />
        <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screenContainer}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'projects' && <ProjectsScreen />}
        {activeTab === 'profile' && (
          <ProfileScreen user={currentUser} onLogout={() => setCurrentUser(null)} />
        )}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'projects' && styles.tabItemActive]}
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabLabel, activeTab === 'projects' && styles.tabLabelActive]}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: '#FF5C00',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#000000',
  },
});
