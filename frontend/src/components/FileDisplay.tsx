import { useState } from 'react'

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

const FileDisplay = () => {
  const [files, setFiles] = useState<OutputFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<{ [key: string]: CSVData }>({})
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  const fetchOutputFiles = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://localhost:8000/output/files')
      
      if (response.ok) {
        const result = await response.json()
        setFiles(result.files || [])
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
    if (!csv) return <div>Loading CSV content...</div>

    if (csv.headers.length === 0) {
      return <div style={{ padding: '10px', fontStyle: 'italic' }}>CSV file is empty</div>
    }

    return (
      <div style={{ marginTop: '10px', overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '14px',
          backgroundColor: 'white'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              {csv.headers.map((header, index) => (
                <th key={index} style={{ 
                  border: '1px solid #dee2e6', 
                  padding: '8px', 
                  textAlign: 'left',
                  fontWeight: 'bold'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {csv.data.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex} style={{ 
                backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f8f9fa'
              }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ 
                    border: '1px solid #dee2e6', 
                    padding: '8px'
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {csv.data.length > 100 && (
          <div style={{ 
            padding: '10px', 
            textAlign: 'center', 
            fontStyle: 'italic', 
            color: '#666'
          }}>
            Showing first 100 rows of {csv.row_count} total rows
          </div>
        )}
      </div>
    )
  }

  const renderImage = (filename: string) => {
    return (
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <img 
          src={`http://localhost:8000/output/file/${filename}`}
          alt={filename}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '500px', 
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling!.textContent = 'Failed to load image'
          }}
        />
        <div style={{ display: 'none', color: '#666', marginTop: '10px' }}></div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📁 Output Files</h3>
        <button 
          onClick={fetchOutputFiles}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Loading...' : '👁️ View Output'}
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ 
            marginBottom: '10px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            Found {files.length} output file{files.length !== 1 ? 's' : ''}
          </div>
          
          {files.map((file, index) => (
            <div key={index} style={{ 
              marginBottom: '10px', 
              border: '1px solid #e9ecef', 
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}>
              <div 
                style={{ 
                  padding: '12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onClick={() => toggleFileExpansion(file.filename, file.type)}
              >
                <div>
                  <span style={{ fontWeight: 'bold' }}>
                    {file.type === 'csv' ? '📊' : file.type === 'image' ? '🖼️' : '📄'} {file.filename}
                  </span>
                  <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <span style={{ fontSize: '18px' }}>
                  {expandedFiles.has(file.filename) ? '▼' : '▶️'}
                </span>
              </div>
              
              {expandedFiles.has(file.filename) && (
                <div style={{ 
                  borderTop: '1px solid #e9ecef', 
                  backgroundColor: 'white'
                }}>
                  {file.type === 'csv' && renderCSVTable(file.filename)}
                  {file.type === 'image' && renderImage(file.filename)}
                  {file.type === 'other' && (
                    <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                      <a 
                        href={`http://localhost:8000/output/file/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#007bff', 
                          textDecoration: 'none',
                          fontWeight: 'bold'
                        }}
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
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '4px',
          border: '1px solid #ffeaa7',
          textAlign: 'center'
        }}>
          📂 No output files found. Run your ML processing script to generate results.
        </div>
      )}
    </div>
  )
}

export default FileDisplay