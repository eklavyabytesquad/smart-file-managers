import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DocumentManager from '../components/filesystem';
import FileManager from '../components//filemanager';
import '../components/FileSystem.css';

const HomeScreen = () => {
  const [appStatus, setAppStatus] = useState({
    storageAvailable: true,
    message: 'Smart File Manager is ready to use'
  });
  
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'files'

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0080ff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Smart File Manager</Text>
              <Text style={styles.headerSubtitle}>Manage your documents in the cloud</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="cloud-done" size={28} color="white" />
            </View>
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
            onPress={() => setActiveTab('documents')}
          >
            <Ionicons 
              name="folder-outline" 
              size={20} 
              color={activeTab === 'documents' ? '#0080ff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
              Documents
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'files' && styles.activeTab]}
            onPress={() => setActiveTab('files')}
          >
            <Ionicons 
              name="images-outline" 
              size={20} 
              color={activeTab === 'files' ? '#0080ff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'files' && styles.activeTabText]}>
              My Files
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content based on selected tab */}
        {activeTab === 'documents' ? (
          <DocumentManager />
        ) : (
          <FileManager />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0080ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#0080ff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  headerIcon: {
    marginLeft: 15,
  },
  fileList: {
    maxHeight: 250
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0080ff',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#0080ff',
  }
});

export default HomeScreen;