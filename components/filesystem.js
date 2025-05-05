import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Alert, 
  StyleSheet,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const DocumentManager = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [dbFiles, setDbFiles] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Supabase configuration
  const SUPABASE_URL = 'https://evqzcxncnicdevygbqxd.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cXpjeG5jbmljZGV2eWdicXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzE4NjAsImV4cCI6MjA2MDU0Nzg2MH0.X4Uma8zC5nwycoT9LhcOwqqrCDsUxSWUAM1Ne-eHXkI';

  // Check connection status and load files when component mounts
  useEffect(() => {
    checkConnectionAndLoadFiles();
  }, []);

  // Check Supabase connection and load files
  const checkConnectionAndLoadFiles = async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');
      
      // Check connection by trying to access the database
      const response = await fetch(`${SUPABASE_URL}/rest/v1/files?select=id`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY
        }
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
        // Now fetch files from the database
        fetchFiles();
      } else {
        setConnectionStatus('error');
        setLoading(false);
        Alert.alert('Connection Error', 'Could not connect to Supabase database');
      }
    } catch (error) {
      console.log('Error checking connection:', error);
      setConnectionStatus('error');
      setLoading(false);
      Alert.alert('Connection Error', 'Could not connect to Supabase database');
    }
  };

  // Fetch files from Supabase database
  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Fetch files from the database using REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/files?select=id,filename,created_at&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch files from database');
      }
      
      const data = await response.json();
      
      // Format the file data for display
      const formattedFiles = data.map(file => ({
        id: file.id,
        name: file.filename,
        type: getFileType(file.filename),
        created_at: new Date(file.created_at).toLocaleDateString(),
      }));
      
      setDbFiles(formattedFiles);
      setLoading(false);
    } catch (error) {
      console.log('Error fetching files:', error);
      setLoading(false);
      Alert.alert('Error', 'Could not load files from database');
    }
  };

  // Select document files
  const selectDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true
      });
      
      if (!result.canceled && result.assets) {
        // Process the selected documents
        const processedDocs = [];
        
        for (const doc of result.assets) {
          try {
            // Read file as base64
            const base64Data = await FileSystem.readAsStringAsync(doc.uri, {
              encoding: FileSystem.EncodingType.Base64
            });
            
            // Add to processed documents with base64 data
            processedDocs.push({
              id: String(Math.random()),
              name: doc.name,
              uri: doc.uri,
              type: getFileType(doc.name),
              size: formatFileSize(doc.size || 0),
              base64Data: base64Data
            });
          } catch (error) {
            console.log(`Error processing file ${doc.name}:`, error);
            Alert.alert('Processing Error', `Could not process file ${doc.name}`);
          }
        }
        
        setDocuments(prevDocs => [...prevDocs, ...processedDocs]);
      }
    } catch (error) {
      console.log('Document picker error:', error);
      Alert.alert('Error', 'Could not pick documents');
    }
  };

  // Upload file to Supabase database
  const uploadFileToDatabase = async (filename, base64Data) => {
    try {
      // Upload to Supabase database using REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          filename: filename,
          base64_data: base64Data
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.log('Error uploading file:', error);
      return false;
    }
  };

  // Upload all selected documents
  const uploadAllDocuments = async () => {
    if (documents.length === 0) {
      Alert.alert('No Files', 'Please select files to upload first');
      return;
    }
    
    setUploading(true);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const doc of documents) {
      try {
        const result = await uploadFileToDatabase(doc.name, doc.base64Data);
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.log('Error uploading:', error);
        failCount++;
      }
    }
    
    setUploading(false);
    
    if (successCount > 0) {
      // Refresh the files list
      fetchFiles();
      
      // Clear the selected documents
      setDocuments([]);
      
      Alert.alert(
        'Upload Complete',
        `Successfully uploaded ${successCount} file(s)${failCount > 0 ? `, ${failCount} failed` : ''}`
      );
    } else {
      Alert.alert('Upload Failed', 'Could not upload any files');
    }
  };

  // Delete file from Supabase database
  const deleteFile = async (fileId) => {
    try {
      setLoading(true);
      
      // Delete file from database using REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/files?id=eq.${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      // Refresh the files list
      fetchFiles();
      
      Alert.alert('Success', 'File deleted successfully');
    } catch (error) {
      console.log('Error deleting file:', error);
      setLoading(false);
      Alert.alert('Error', 'Could not delete file');
    }
  };

  // Get file base64 data from database for preview
  const getFileForPreview = async (fileId, fileName) => {
    try {
      setLoading(true);
      
      // Fetch file data from database
      const response = await fetch(`${SUPABASE_URL}/rest/v1/files?id=eq.${fileId}&select=base64_data,filename`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch file data');
      }
      
      const data = await response.json();
      
      if (data.length > 0) {
        // Clean up the base64 data if needed - remove any prefixes like "data:image/jpeg;base64,"
        let cleanBase64Data = data[0].base64_data;
        
        // If it starts with a data URL prefix, extract just the base64 part
        if (cleanBase64Data.includes(';base64,')) {
          cleanBase64Data = cleanBase64Data.split(';base64,')[1];
        }
        
        // If there are any non-base64 characters at the beginning, clean them up
        if (cleanBase64Data.startsWith('/')) {
          // Find where the actual base64 content starts
          const validBase64Index = cleanBase64Data.indexOf('/9j/') !== -1 ? 
                                  cleanBase64Data.indexOf('/9j/') : 
                                  (cleanBase64Data.indexOf('iVBOR') !== -1 ? 
                                   cleanBase64Data.indexOf('iVBOR') : 0);
          
          if (validBase64Index > 0) {
            cleanBase64Data = cleanBase64Data.substring(validBase64Index);
          }
        }
        
        setPreviewFile({
          name: data[0].filename,
          type: getFileType(data[0].filename),
          base64Data: cleanBase64Data
        });
        
        setPreviewVisible(true);
      } else {
        Alert.alert('Error', 'File not found');
      }
      
      setLoading(false);
    } catch (error) {
      console.log('Error fetching file data:', error);
      setLoading(false);
      Alert.alert('Error', 'Could not load file data');
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type from file name
  const getFileType = (fileName) => {
    if (!fileName) return 'file';
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
      return 'video';
    } else if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'doc';
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'excel';
    } else if (['ppt', 'pptx'].includes(extension)) {
      return 'ppt';
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    } else if (['txt', 'rtf'].includes(extension)) {
      return 'text';
    } else {
      return 'file';
    }
  };

  // Get icon based on file type
  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'videocam';
      case 'pdf':
        return 'document-text';
      case 'doc':
        return 'document';
      case 'excel':
        return 'grid';
      case 'ppt':
        return 'easel';
      case 'audio':
        return 'musical-notes';
      case 'text':
        return 'document-text-outline';
      default:
        return 'document-outline';
    }
  };

  // Get color based on file type
  const getFileColor = (type) => {
    switch (type) {
      case 'image':
        return '#4CAF50';  // Green
      case 'video':
        return '#F44336';  // Red
      case 'pdf':
        return '#FF5722';  // Deep Orange
      case 'doc':
        return '#2196F3';  // Blue
      case 'excel':
        return '#4CAF50';  // Green
      case 'ppt':
        return '#FF9800';  // Orange
      case 'audio':
        return '#9C27B0';  // Purple
      case 'text':
        return '#607D8B';  // Blue Grey
      default:
        return '#9E9E9E';  // Grey
    }
  };

  // Get MIME type for file preview
  const getMimeType = (fileType, filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (fileType) {
      case 'image':
        if (extension === 'png') return 'image/png';
        if (extension === 'gif') return 'image/gif';
        if (extension === 'webp') return 'image/webp';
        return 'image/jpeg'; // Default for jpg, jpeg
      case 'pdf':
        return 'application/pdf';
      case 'video':
        if (extension === 'mp4') return 'video/mp4';
        if (extension === 'mov') return 'video/quicktime';
        if (extension === 'avi') return 'video/x-msvideo';
        if (extension === 'mkv') return 'video/x-matroska';
        return 'video/mp4'; // Default
      case 'audio':
        if (extension === 'mp3') return 'audio/mpeg';
        if (extension === 'wav') return 'audio/wav';
        if (extension === 'ogg') return 'audio/ogg';
        return 'audio/mpeg'; // Default
      default:
        return 'application/octet-stream';
    }
  };

  // Render Preview Modal
  const renderPreviewModal = () => {
    if (!previewFile) return null;
    
    const mimeType = getMimeType(previewFile.type, previewFile.name);
    
    return (
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{previewFile.name}</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.previewContainer}>
              {previewFile.type === 'image' ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: `data:${mimeType};base64,${previewFile.base64Data}` }}
                    style={styles.previewImage}
                    resizeMode="contain"
                    onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
                  />
                </View>
              ) : previewFile.type === 'pdf' ? (
                <View style={styles.pdfPreviewContainer}>
                  {/* PDF Viewer would go here - using a placeholder for now */}
                  <View style={styles.pdfPreview}>
                    <Ionicons name="document-text" size={80} color="#FF5722" />
                    <Text style={styles.pdfText}>PDF Preview</Text>
                    <TouchableOpacity 
                      style={styles.viewPdfButton}
                      onPress={() => {
                        // Here you would implement PDF viewing functionality
                        // For example, saving the base64 PDF to a temporary file and opening it
                        Alert.alert('PDF Viewer', 'PDF viewing functionality would be implemented here');
                      }}
                    >
                      <Text style={styles.viewPdfButtonText}>View PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.genericPreview}>
                  <Ionicons name={getFileIcon(previewFile.type)} size={80} color={getFileColor(previewFile.type)} />
                  <Text style={styles.genericText}>{previewFile.name}</Text>
                  <Text style={styles.genericNote}>File preview not available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render selected document item
  const renderSelectedDocument = ({ item }) => (
    <View style={styles.selectedFileItem}>
      <View style={[styles.fileIconContainer, { backgroundColor: `${getFileColor(item.type)}20` }]}>
        <Ionicons 
          name={getFileIcon(item.type)} 
          size={24} 
          color={getFileColor(item.type)} 
        />
      </View>
      <View style={styles.fileDetails}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileInfo}>{item.size}</Text>
      </View>
      <TouchableOpacity 
        style={styles.fileRemove}
        onPress={() => {
          setDocuments(documents.filter(doc => doc.id !== item.id));
        }}
      >
        <Ionicons name="close-circle" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  // Render database file item
  const renderDatabaseFile = ({ item }) => (
    <View style={styles.fileItem}>
      <View style={[styles.fileIconContainer, { backgroundColor: `${getFileColor(item.type)}20` }]}>
        <Ionicons 
          name={getFileIcon(item.type)} 
          size={24} 
          color={getFileColor(item.type)} 
        />
      </View>
      <View style={styles.fileDetails}>
        <Text style={styles.fileName}>{item.name}</Text>
        <Text style={styles.fileInfo}>
          {item.created_at}
        </Text>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity 
          style={styles.fileActionButton}
          onPress={() => getFileForPreview(item.id, item.name)}
        >
          <Ionicons name="eye-outline" size={20} color="#0080ff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fileActionButton}
          onPress={() => {
            Alert.alert(
              'Confirm Deletion',
              `Are you sure you want to delete ${item.name}?`,
              [
                { 
                  text: 'Cancel', 
                  style: 'cancel' 
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteFile(item.id)
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render connection status indicator
  const renderConnectionStatus = () => {
    let statusColor, statusText, statusIcon;
    
    switch (connectionStatus) {
      case 'connected':
        statusColor = '#4CAF50';
        statusText = 'Connected to Supabase';
        statusIcon = 'checkmark-circle';
        break;
      case 'error':
        statusColor = '#F44336';
        statusText = 'Connection Error';
        statusIcon = 'close-circle';
        break;
      default:
        statusColor = '#FFC107';
        statusText = 'Checking Connection...';
        statusIcon = 'sync';
    }
    
    return (
      <View style={styles.connectionStatus}>
        <Ionicons name={statusIcon} size={16} color={statusColor} />
        <Text style={[styles.connectionText, { color: statusColor }]}>
          {statusText}
        </Text>
        {connectionStatus === 'error' && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={checkConnectionAndLoadFiles}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Preview Modal */}
      {renderPreviewModal()}
      
      {/* Connection Status Bar */}
      {renderConnectionStatus()}
      
      {/* File Selection Area */}
      <View style={styles.dragArea}>
        <Ionicons name="cloud-upload" size={40} color="#0080ff" />
        <Text style={styles.dragText}>
          Select files to upload to database
        </Text>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={selectDocuments}
        >
          <Text style={styles.browseText}>Browse Files</Text>
        </TouchableOpacity>
      </View>
      
      {/* Selected Files Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Selected Files</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={selectDocuments}
          >
            <Ionicons name="add-circle" size={20} color="#0080ff" />
            <Text style={styles.addButtonText}>Add Files</Text>
          </TouchableOpacity>
        </View>
        
        {documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No files selected</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={documents}
              renderItem={renderSelectedDocument}
              keyExtractor={item => item.id}
              style={styles.fileList}
            />
            
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={uploadAllDocuments}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="white" />
                  <Text style={styles.uploadButtonText}>
                    Upload to Database
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* Database Files Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Database Files</Text>
          <TouchableOpacity 
            style={styles.refreshButtonSmall}
            onPress={fetchFiles}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0080ff" />
            ) : (
              <Ionicons name="refresh" size={20} color="#0080ff" />
            )}
          </TouchableOpacity>
        </View>
        
        {loading && dbFiles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0080ff" />
            <Text style={styles.loadingText}>Loading files...</Text>
          </View>
        ) : dbFiles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="server-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No files in database</Text>
          </View>
        ) : (
          <FlatList
            data={dbFiles}
            renderItem={renderDatabaseFile}
            keyExtractor={item => item.id}
            style={styles.fileList}
          />
        )}
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500'
  },
  retryButton: {
    marginLeft: 'auto',
    backgroundColor: '#0080ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500'
  },
  dragArea: {
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#deebff',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  dragText: {
    fontSize: 16,
    color: '#444',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center'
  },
  browseButton: {
    backgroundColor: '#0080ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  browseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#0080ff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500'
  },
  refreshButtonSmall: {
    padding: 4
  },
  fileList: {
    maxHeight: 250
  },
  selectedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  fileDetails: {
    flex: 1
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  fileInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  fileRemove: {
    padding: 4
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fileActionButton: {
    padding: 8,
    marginHorizontal: 4
  },
  uploadButton: {
    backgroundColor: '#0080ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16
  },
  uploadButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 16
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  previewContainer: {
    padding: 16,
    flex: 1
  },
  imagePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 300
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f9f9f9'
  },
  pdfPreviewContainer: {
    minHeight: 300,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden'
  },
  pdfPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  pdfText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16
  },
  pdfNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  },
  viewPdfButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16
  },
  viewPdfButtonText: {
    color: 'white',
    fontWeight: '500'
  },
  genericPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    minHeight: 300
  },
  genericText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16
  },
  genericNote: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  }
});

export default DocumentManager;