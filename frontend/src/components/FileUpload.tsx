import { useState, useEffect } from 'react'
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
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [showPreviews, setShowPreviews] = useState(false)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  // Create preview URLs when files are selected
  useEffect(() => {
    if (!selectedFiles || selectedFiles.length === 0) {
      // Clean up old preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setPreviewUrls([])
      return
    }

    // Clean up old preview URLs before creating new ones
    previewUrls.forEach(url => URL.revokeObjectURL(url))

    // Create new preview URLs
    const newPreviewUrls: string[] = []
    Array.from(selectedFiles).forEach(file => {
      const url = URL.createObjectURL(file)
      newPreviewUrls.push(url)
    })
    setPreviewUrls(newPreviewUrls)

    // Cleanup function to revoke URLs when component unmounts or files change
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [selectedFiles])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files
    if (!newFiles || newFiles.length === 0) return

    // If there are already selected files, merge them with the new ones
    if (selectedFiles && selectedFiles.length > 0) {
      const existingFilesArray = Array.from(selectedFiles)
      const newFilesArray = Array.from(newFiles)
      const combinedFiles = [...existingFilesArray, ...newFilesArray]

      // Create a new DataTransfer object to update the file input
      const dataTransfer = new DataTransfer()
      combinedFiles.forEach(file => dataTransfer.items.add(file))

      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.files = dataTransfer.files
      }

      setSelectedFiles(dataTransfer.files)
    } else {
      // No existing files, just set the new ones
      setSelectedFiles(newFiles)
    }

    setUploadResult(null)
    setUploadedFiles([])
  }

  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput && !uploading) {
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

  const removeFile = (indexToRemove: number) => {
    if (!selectedFiles) return

    const filesArray = Array.from(selectedFiles)
    filesArray.splice(indexToRemove, 1)

    // Create a new DataTransfer object to update the file input
    const dataTransfer = new DataTransfer()
    filesArray.forEach(file => dataTransfer.items.add(file))

    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) {
      fileInput.files = dataTransfer.files
    }

    setSelectedFiles(dataTransfer.files.length > 0 ? dataTransfer.files : null)
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
        disabled={uploading}
        className="file-input-hidden"
      />

      {/* Plus sign upload area */}
      <div
        className={`upload-trigger ${uploading ? 'disabled' : ''}`}
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
          <div className="selected-files-header">
            <strong className="selected-files-title">
              Selected files ({selectedFiles.length}):
            </strong>
            <button
              className="toggle-previews-button"
              onClick={() => setShowPreviews(!showPreviews)}
              aria-label={showPreviews ? "Hide previews" : "Show previews"}
            >
              {showPreviews ? '▼' : '▶'} {showPreviews ? 'Hide' : 'Show'} Previews
            </button>
          </div>

          {showPreviews && (
            <div className="image-previews-grid">
              {Array.from(selectedFiles).map((file, index) => (
                <div key={index} className="preview-item">
                  <img
                    src={previewUrls[index]}
                    alt={file.name}
                    className="preview-image"
                  />
                  <div className="preview-filename">{file.name}</div>
                  <button
                    className="preview-delete-button"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    aria-label={`Remove ${file.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <ul className="selected-files-list">
            {Array.from(selectedFiles).map((file, index) => (
              <li key={index} className="selected-file-item">
                <span className="file-info">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
                <button
                  className="delete-file-button"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  aria-label={`Remove ${file.name}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="button-group">
        <button
          onClick={handleUpload}
          disabled={!selectedFiles || uploading}
          className="upload-button"
        >
          {uploading ? '⏳ Uploading...' : '📤 Classify Images'}
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