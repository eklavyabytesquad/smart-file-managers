import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Supabase configuration
const SUPABASE_URL = 'https://evqzcxncnicdevygbqxd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cXpjeG5jbmljZGV2eWdicXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzE4NjAsImV4cCI6MjA2MDU0Nzg2MH0.X4Uma8zC5nwycoT9LhcOwqqrCDsUxSWUAM1Ne-eHXkI';

// API headers for Supabase
const apiHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Fetch files from Supabase on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Function to fetch files from Supabase using fetch API
  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Using fetch API instead of Supabase client
      const response = await fetch(`${SUPABASE_URL}/rest/v1/files?order=created_at.desc`, {
        method: 'GET',
        headers: apiHeaders
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      Alert.alert('Error', 'Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to delete a file using fetch API
  const deleteFile = async (id) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Using fetch API for deletion
              const response = await fetch(`${SUPABASE_URL}/rest/v1/files?id=eq.${id}`, {
                method: 'DELETE',
                headers: apiHeaders
              });
              
              if (!response.ok) {
                throw new Error(`Delete operation failed with status: ${response.status}`);
              }
              
              // Remove the file from the state
              setFiles(files.filter(file => file.id !== id));
              Alert.alert('Success', 'File deleted successfully');
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Failed to delete file');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Function to open file preview
  const openPreview = (file) => {
    setSelectedFile(file);
    setPreviewVisible(true);
  };

  // Function to close file preview
  const closePreview = () => {
    setPreviewVisible(false);
    setSelectedFile(null);
  };

  // Function to determine file type from filename
  const getFileType = (filename) => {
    if (!filename) return 'other';
    
    const extension = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
    
    if (imageExtensions.includes(extension)) {
      return 'image';
    } else if (documentExtensions.includes(extension)) {
      return 'document';
    } else {
      return 'other';
    }
  };

  // Function to get icon based on file type
  const getFileIcon = (filename) => {
    const fileType = getFileType(filename);
    
    switch (fileType) {
      case 'image':
        return 'image-outline';
      case 'document':
        return 'document-text-outline';
      default:
        return 'document-outline';
    }
  };

  // Function to format the date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to render a file item
  const renderFileItem = ({ item }) => {
    const fileType = getFileType(item.filename);
    const isImage = fileType === 'image';

    return (
      <View style={styles.fileItem}>
        <TouchableOpacity 
          style={styles.fileContent}
          onPress={() => openPreview(item)}
        >
          {isImage ? (
            <Image 
              source={{ uri: `data:image/jpeg;base64,${item.base64_data}` }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconContainer}>
              <Ionicons name={getFileIcon(item.filename)} size={30} color="#0080ff" />
            </View>
          )}
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{item.filename}</Text>
            <Text style={styles.fileDate}>{formatDate(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteFile(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    );
  };

  // Preview Modal Component
  const FilePreviewModal = () => {
    if (!selectedFile) return null;

    const fileType = getFileType(selectedFile.filename);
    const isImage = fileType === 'image';

    return (
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedFile.filename}
              </Text>
              <TouchableOpacity onPress={closePreview}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewContainer}>
              {isImage ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selectedFile.base64_data}` }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.documentPreview}>
                  <Ionicons name={getFileIcon(selectedFile.filename)} size={80} color="#0080ff" />
                  <Text style={styles.documentText}>
                    This file type cannot be previewed
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.fileDetails}>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Created: </Text>
                {formatDate(selectedFile.created_at)}
              </Text>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={() => {
                  closePreview();
                  deleteFile(selectedFile.id);
                }}
              >
                <Ionicons name="trash-outline" size={18} color="white" />
                <Text style={styles.deleteText}>Delete File</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render the main component
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>My Files</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            setRefreshing(true);
            fetchFiles();
          }}
        >
          <Ionicons name="refresh" size={20} color="#0080ff" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0080ff" />
          <Text style={styles.loadingText}>Loading files...</Text>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document" size={60} color="#c7c7cc" />
          <Text style={styles.emptyText}>No files found</Text>
          <Text style={styles.emptySubText}>
            Your uploaded files will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchFiles();
          }}
        />
      )}

      <FilePreviewModal />
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8e8e93',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    padding: 12,
  },
  fileItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  fileDate: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
  },
  deleteButton: {
    padding: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  previewContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  documentPreview: {
    alignItems: 'center',
    padding: 20,
  },
  documentText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fileDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  detailLabel: {
    fontWeight: '600',
  },
  modalDeleteButton: {
    flexDirection: 'row',
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  }
});

export default FileManager;