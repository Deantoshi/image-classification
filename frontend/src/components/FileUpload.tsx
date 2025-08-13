import { useState } from 'react'

interface UploadResponse {
  message: string;
  files: string[];
  status: string;
}

const FileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [clearing, setClearing] = useState(false)
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

  const clearFiles = async () => {
    setClearing(true)
    
    try {
      const response = await fetch('http://localhost:8000/clear-all', {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        setUploadResult(`✅ ${result.message}`)
      } else {
        const error = await response.json()
        setUploadResult(`❌ Error: ${error.detail}`)
      }
    } catch (error) {
      console.error('Clear error:', error)
      setUploadResult(`❌ Error: Failed to connect to server. Make sure FastAPI is running on port 8000.`)
    } finally {
      setClearing(false)
    }

    // Clear the UI state
    setSelectedFiles(null)
    setUploadedFiles([])
    // Reset the file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <div className="card" style={{ 
      padding: '25px', 
      background: 'rgba(30, 30, 46, 0.8)',
      border: '1px solid rgba(75, 85, 99, 0.3)', 
      borderRadius: '12px', 
      marginTop: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#e0e6ed',
          fontSize: '1.4rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📁 Upload Images
        </h3>
        <label htmlFor="file-input" style={{ 
          display: 'block', 
          marginBottom: '15px', 
          fontWeight: '500',
          color: '#9ca3af',
          fontSize: '1rem'
        }}>
          Select Images:
        </label>
        <input
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading || clearing}
          style={{ 
            padding: '12px 16px', 
            background: 'rgba(17, 24, 39, 0.8)',
            border: '2px solid rgba(75, 85, 99, 0.3)', 
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            color: '#e0e6ed',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            cursor: (uploading || clearing) ? 'not-allowed' : 'pointer'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)'
            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(75, 85, 99, 0.3)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </div>

      {selectedFiles && selectedFiles.length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          background: 'rgba(17, 24, 39, 0.6)', 
          borderRadius: '8px',
          border: '1px solid rgba(75, 85, 99, 0.2)'
        }}>
          <strong style={{ color: '#e0e6ed' }}>
            Selected files ({selectedFiles.length}):
          </strong>
          <ul style={{ 
            margin: '10px 0 0 0', 
            paddingLeft: '20px',
            color: '#9ca3af'
          }}>
            {Array.from(selectedFiles).map((file, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleUpload} 
          disabled={!selectedFiles || uploading || clearing}
          style={{
            padding: '12px 24px',
            background: (uploading || clearing)
              ? 'rgba(75, 85, 99, 0.5)' 
              : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: (uploading || clearing) ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            boxShadow: (uploading || clearing)
              ? 'none' 
              : '0 4px 16px rgba(139, 92, 246, 0.3)',
            transform: (uploading || clearing) ? 'none' : 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (!uploading && !clearing) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading && !clearing) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.3)'
            }
          }}
        >
          {uploading ? '⏳ Uploading...' : '📤 Upload Images'}
        </button>

        <button 
          onClick={clearFiles}
          disabled={uploading || clearing}
          style={{
            padding: '12px 24px',
            background: 'rgba(75, 85, 99, 0.6)',
            color: '#e0e6ed',
            border: '1px solid rgba(75, 85, 99, 0.4)',
            borderRadius: '8px',
            cursor: (uploading || clearing) ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '1rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!uploading && !clearing) {
              e.currentTarget.style.background = 'rgba(75, 85, 99, 0.8)'
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading && !clearing) {
              e.currentTarget.style.background = 'rgba(75, 85, 99, 0.6)'
            }
          }}
        >
          {clearing ? '⏳ Clearing...' : '🗑️ Clear All Files'}
        </button>
      </div>

      {uploadResult && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: uploadResult.startsWith('✅') 
            ? 'rgba(16, 185, 129, 0.15)' 
            : 'rgba(239, 68, 68, 0.15)',
          color: uploadResult.startsWith('✅') ? '#10b981' : '#ef4444',
          borderRadius: '8px',
          border: `1px solid ${uploadResult.startsWith('✅') 
            ? 'rgba(16, 185, 129, 0.3)' 
            : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {uploadResult}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: 'rgba(59, 130, 246, 0.15)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <strong style={{ color: '#3b82f6' }}>📁 Uploaded files ready for processing:</strong>
          <ul style={{ 
            margin: '10px 0 0 0', 
            paddingLeft: '20px',
            color: '#9ca3af'
          }}>
            {uploadedFiles.map((filename, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>{filename}</li>
            ))}
          </ul>
          <p style={{ 
            margin: '12px 0 0 0', 
            fontSize: '0.9rem', 
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            💡 Files are now in the backend/input folder and ready for ML processing.
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUpload