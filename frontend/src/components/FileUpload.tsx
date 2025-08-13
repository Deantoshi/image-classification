import { useState } from 'react'

interface UploadResponse {
  message: string;
  files: string[];
  status: string;
}

const FileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files)
    setUploadResult(null)
    setUploadedFiles([])
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select files to upload')
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i])
      }

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result: UploadResponse = await response.json()
        setUploadResult(`✅ ${result.message}`)
        setUploadedFiles(result.files)
      } else {
        const error = await response.json()
        setUploadResult(`❌ Error: ${error.detail}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult(`❌ Error: Failed to connect to server. Make sure FastAPI is running on port 8000.`)
    } finally {
      setUploading(false)
    }
  }

  const clearFiles = () => {
    setSelectedFiles(null)
    setUploadResult(null)
    setUploadedFiles([])
    // Reset the file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="card" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="file-input" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Select Images:
        </label>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ 
            padding: '10px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            width: '100%',
            maxWidth: '400px'
          }}
        />
      </div>

      {selectedFiles && selectedFiles.length > 0 && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <strong>Selected files ({selectedFiles.length}):</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            {Array.from(selectedFiles).map((file, index) => (
              <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button 
          onClick={handleUpload} 
          disabled={!selectedFiles || uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {uploading ? '⏳ Uploading...' : '📤 Upload Images'}
        </button>

        <button 
          onClick={clearFiles}
          disabled={uploading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {uploadResult && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: uploadResult.startsWith('✅') ? '#d4edda' : '#f8d7da',
          color: uploadResult.startsWith('✅') ? '#155724' : '#721c24',
          borderRadius: '4px',
          border: `1px solid ${uploadResult.startsWith('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {uploadResult}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          border: '1px solid #b8daff'
        }}>
          <strong>📁 Uploaded files ready for processing:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            {uploadedFiles.map((filename, index) => (
              <li key={index}>{filename}</li>
            ))}
          </ul>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
            💡 Files are now in the backend/input folder and ready for ML processing.
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUpload