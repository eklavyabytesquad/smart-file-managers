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
import '../components/FileSystem.css';

const HomeScreen = () => {
  const [appStatus, setAppStatus] = useState({
    storageAvailable: true,
    message: 'Smart File Manager is ready to use'
  });

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
        
        {/* Document Manager Component */}
        <DocumentManager />
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
    maxHeight: 250  // This is limiting the height and preventing proper scrolling
  }
});

export default HomeScreen;