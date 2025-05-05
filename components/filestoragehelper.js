import * as FileSystem from 'expo-file-system';

// Supabase storage helper for direct API access
export default class FileStorageHelper {
  constructor() {
    this.supabaseUrl = 'https://evqzcxncnicdevygbqxd.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2cXpjeG5jbmljZGV2eWdicXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NzE4NjAsImV4cCI6MjA2MDU0Nzg2MH0.X4Uma8zC5nwycoT9LhcOwqqrCDsUxSWUAM1Ne-eHXkI';
    this.bucket = 'smartfile';
  }

  // Test the connection to Supabase
  async testConnection() {
    try {
      console.log('Testing Supabase connection...');
      console.log(`URL: ${this.supabaseUrl}`);
      console.log(`Key starts with: ${this.supabaseKey.substring(0, 10)}...`);
      
      const response = await fetch(`${this.supabaseUrl}/storage/v1/bucket`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey
        }
      });
      
      const status = response.status;
      const statusText = response.statusText;
      let responseData;
      
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = null;
      }
      
      console.log('Connection test result:', {
        status,
        statusText,
        responseData
      });
      
      return {
        success: response.ok,
        status,
        statusText,
        data: responseData
      };
    } catch (error) {
      console.error('Connection test error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List all files in the bucket
  async listFiles() {
    try {
      console.log('Listing files from bucket:', this.bucket);
      
      const response = await fetch(`${this.supabaseUrl}/storage/v1/object/list/${this.bucket}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey
        }
      });
      
      if (!response.ok) {
        const statusCode = response.status;
        const statusText = response.statusText;
        let errorBody;
        
        try {
          errorBody = await response.text();
        } catch (e) {
          errorBody = 'Unable to parse error response';
        }
        
        console.error('List files response error:', {
          status: statusCode,
          statusText,
          errorBody
        });
        
        throw new Error(`Error listing files: ${statusCode} ${statusText}`);
      }
      
      const data = await response.json();
      console.log('Files successfully retrieved:', data.length);
      return data;
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  // Upload a file to the bucket
  async uploadFile(fileUri, fileName) {
    try {
      console.log('Starting file upload:', fileName);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File doesn't exist");
      }
      
      console.log('File info:', fileInfo);
      
      // Fix for the Blob issue in React Native environment
      // We'll use Base64 directly instead of converting to Blob
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Determine content type from file extension
      const contentType = this.getContentType(fileName);
      console.log('Content type:', contentType);
      
      // Direct upload using fetch and base64 data
      const response = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucket}/${encodeURIComponent(fileName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
          'Content-Type': contentType,
          'x-upsert': 'true'
        },
        body: this.base64ToArrayBuffer(fileContent)
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload response error:', errorData);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  // Convert base64 to ArrayBuffer (better compatibility than Blob in React Native)
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Delete a file from the bucket
  async deleteFile(filePath) {
    try {
      console.log('Deleting file:', filePath);
      
      const response = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucket}/${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey
        }
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response error:', errorText);
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }
      
      console.log('Delete successful');
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // Get file download URL
  getFileUrl(filePath) {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${encodeURIComponent(filePath)}`;
  }

  // Helper to get content type from file name
  getContentType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const mimeTypes = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      
      // Spreadsheets
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      
      // Presentations
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Other common types
      'txt': 'text/plain',
      'rtf': 'application/rtf',
      'zip': 'application/zip',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  // This method won't be used anymore as we're using ArrayBuffer instead of Blob
  base64ToBlob(base64, contentType) {
    // This method is kept for backward compatibility but won't be used
    console.warn('base64ToBlob method is deprecated - using ArrayBuffer instead');
    
    try {
      const byteCharacters = atob(base64);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      // This may not work in React Native environment
      return new Blob(byteArrays, { type: contentType });
    } catch (error) {
      console.error('Error creating Blob:', error);
      throw new Error('Failed to create Blob: ' + error.message);
    }
  }
}