import { useState } from 'react'
import './FileUpload.css'

interface UploadResponse {
  message: string;
  files: string[];
  status: string;
}

interface FileUploadProps {
  onUploadComplete?: () => void;
}

const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
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

  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput && !uploading && !clearing) {
      fileInput.click()
    }
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
    // const response = await fetch('http://34.134.92.145:8000/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result: UploadResponse = await response.json()
        setUploadResult(`✅ ${result.message}`)
        setUploadedFiles(result.files)

        // Call the callback to trigger auto-scroll and classification
        if (onUploadComplete) {
          onUploadComplete()
        }
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
    // const response = await fetch('http://34.134.92.145:8000/clear-all', {
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
    <div className="file-upload-card">
      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading || clearing}
        className="file-input-hidden"
      />

      {/* Plus sign upload area */}
      <div
        className={`upload-trigger ${(uploading || clearing) ? 'disabled' : ''}`}
        onClick={triggerFileInput}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            triggerFileInput()
          }
        }}
      >
        <div className="plus-icon">+</div>
        <div className="upload-trigger-text">Add Images</div>
      </div>

      {selectedFiles && selectedFiles.length > 0 && (
        <div className="selected-files-container">
          <strong className="selected-files-title">
            Selected files ({selectedFiles.length}):
          </strong>
          <ul className="selected-files-list">
            {Array.from(selectedFiles).map((file, index) => (
              <li key={index} className="selected-file-item">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="button-group">
        <button
          onClick={handleUpload}
          disabled={!selectedFiles || uploading || clearing}
          className="upload-button"
        >
          {uploading ? '⏳ Uploading...' : '📤 Classify Images'}
        </button>

        <button
          onClick={clearFiles}
          disabled={uploading || clearing}
          className="clear-button"
        >
          {clearing ? '⏳ Clearing...' : '🗑️ Clear All Files'}
        </button>
      </div>

      {uploadResult && (
        <div className={`result-message ${uploadResult.startsWith('✅') ? 'success' : 'error'}`}>
          {uploadResult}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-container">
          <strong className="uploaded-files-title">📁 Uploaded files ready for processing:</strong>
          <ul className="uploaded-files-list">
            {uploadedFiles.map((filename, index) => (
              <li key={index} className="uploaded-file-item">{filename}</li>
            ))}
          </ul>
          <p className="uploaded-files-info">
            💡 Files are now in the backend/input folder and ready for ML processing.
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUpload