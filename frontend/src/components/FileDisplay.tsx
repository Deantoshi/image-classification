import { useState } from 'react'
import { getUserImages } from '../services/ImageService'
import './FileDisplay.css'

interface OutputFile {
  filename: string;
  type: string;
  size: number;
}

interface CSVData {
  filename: string;
  headers: string[];
  data: string[][];
  row_count: number;
  status: string;
}

interface FileDisplayProps {
  userId: number;
}

const FileDisplay = ({ userId }: FileDisplayProps) => {
  const [files, setFiles] = useState<OutputFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<{ [key: string]: CSVData }>({})
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  const fetchOutputFiles = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, get the list of image names for this user from the database
      const userImagesResponse = await getUserImages(userId)
      const userImageNames = new Set(userImagesResponse.images.map(img => img.image_name))

      // Then, get all output files from the backend
      const response = await fetch('http://localhost:8000/output/files')
    // const response = await fetch('http://34.134.92.145:8000/output/files')

      if (response.ok) {
        const result = await response.json()
        // Filter to only show files that belong to this user
        const userFiles = (result.files || []).filter((file: OutputFile) =>
          userImageNames.has(file.filename)
        )
        setFiles(userFiles)
      } else {
        const errorData = await response.json()
        setError(`Error: ${errorData.detail}`)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to connect to server. Make sure FastAPI is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCSVContent = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/output/csv/${filename}`)
    // const response = await fetch(`http://34.134.92.145:8000/output/csv/${filename}`)
      
      if (response.ok) {
        const csvContent = await response.json()
        setCsvData(prev => ({
          ...prev,
          [filename]: csvContent
        }))
      } else {
        console.error(`Failed to fetch CSV content for ${filename}`)
      }
    } catch (err) {
      console.error('CSV fetch error:', err)
    }
  }

  const toggleFileExpansion = async (filename: string, fileType: string) => {
    const newExpanded = new Set(expandedFiles)
    
    if (expandedFiles.has(filename)) {
      newExpanded.delete(filename)
    } else {
      newExpanded.add(filename)
      
      // If it's a CSV file and we haven't loaded it yet, fetch the content
      if (fileType === 'csv' && !csvData[filename]) {
        await fetchCSVContent(filename)
      }
    }
    
    setExpandedFiles(newExpanded)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderCSVTable = (filename: string) => {
    const csv = csvData[filename]
    if (!csv) return (
      <div className="loading-message">
        Loading CSV content...
      </div>
    )

    if (csv.headers.length === 0) {
      return (
        <div className="empty-csv-message">
          CSV file is empty
        </div>
      )
    }

    return (
      <div className="csv-table-container">
        <table className="csv-table">
          <thead>
            <tr>
              {csv.headers.map((header, index) => (
                <th key={index}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {csv.data.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {csv.data.length > 100 && (
          <div className="csv-row-limit-notice">
            Showing first 100 rows of {csv.row_count} total rows
          </div>
        )}
      </div>
    )
  }

  const renderImage = (filename: string) => {
    return (
      <div className="image-container">
        <img
          src={`http://localhost:8000/output/file/${filename}`}
        // src={`http://34.134.92.145:8000/output/file/${filename}`}
          alt={filename}
          className="output-image"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling!.textContent = 'Failed to load image'
            ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
          }}
        />
        <div className="image-error"></div>
      </div>
    )
  }

  return (
    <div className="file-display-card">
      <div className="file-display-header">
        <h3 className="file-display-title">
          📁 Output Files
        </h3>
        <button
          onClick={fetchOutputFiles}
          disabled={loading}
          className="view-output-button"
        >
          {loading ? '⏳ Loading...' : '👁️ View Output'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="files-container">
          <div className="files-count">
            Found {files.length} output file{files.length !== 1 ? 's' : ''}
          </div>

          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div
                className="file-header"
                onClick={() => toggleFileExpansion(file.filename, file.type)}
              >
                <div className="file-info">
                  <span className="file-name">
                    {file.type === 'csv' ? '📊' : file.type === 'image' ? '🖼️' : '📄'} {file.filename}
                  </span>
                  <span className="file-size">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <span className={`expand-icon ${expandedFiles.has(file.filename) ? 'expanded' : ''}`}>
                  ▶️
                </span>
              </div>

              {expandedFiles.has(file.filename) && (
                <div className="file-content">
                  {file.type === 'csv' && renderCSVTable(file.filename)}
                  {file.type === 'image' && renderImage(file.filename)}
                  {file.type === 'other' && (
                    <div className="download-link-container">
                      <a
                        href={`http://localhost:8000/output/file/${file.filename}`}
                        // href={`http://34.134.92.145:8000/output/file/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-link"
                      >
                        📥 Download {file.filename}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && files.length === 0 && !error && (
        <div className="no-files-message">
          <div className="no-files-title">
            📂 No output files found
          </div>
          <div className="no-files-subtitle">
            Run your ML processing script to generate results.
          </div>
        </div>
      )}
    </div>
  )
}

export default FileDisplay