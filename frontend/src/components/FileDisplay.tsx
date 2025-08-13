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
    //   const response = await fetch('http://localhost:8000/output/files')
    const response = await fetch('http://34.134.92.145:8000/output/files')
      
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
    //   const response = await fetch(`http://localhost:8000/output/csv/${filename}`)
    const response = await fetch(`http://34.134.92.145:8000/output/csv/${filename}`)
      
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
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#9ca3af',
        fontStyle: 'italic'
      }}>
        Loading CSV content...
      </div>
    )

    if (csv.headers.length === 0) {
      return (
        <div style={{ 
          padding: '20px', 
          fontStyle: 'italic',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          CSV file is empty
        </div>
      )
    }

    return (
      <div style={{ marginTop: '16px', overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '0.9rem',
          background: 'rgba(17, 24, 39, 0.6)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ background: 'rgba(75, 85, 99, 0.4)' }}>
              {csv.headers.map((header, index) => (
                <th key={index} style={{ 
                  border: '1px solid rgba(75, 85, 99, 0.3)', 
                  padding: '12px', 
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#e0e6ed',
                  fontSize: '0.95rem'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {csv.data.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex} style={{ 
                background: rowIndex % 2 === 0 
                  ? 'rgba(17, 24, 39, 0.4)' 
                  : 'rgba(30, 41, 59, 0.4)'
              }}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={{ 
                    border: '1px solid rgba(75, 85, 99, 0.2)', 
                    padding: '10px',
                    color: '#d1d5db'
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
            padding: '16px', 
            textAlign: 'center', 
            fontStyle: 'italic', 
            color: '#9ca3af',
            background: 'rgba(17, 24, 39, 0.4)',
            borderRadius: '0 0 8px 8px'
          }}>
            Showing first 100 rows of {csv.row_count} total rows
          </div>
        )}
      </div>
    )
  }

  const renderImage = (filename: string) => {
    return (
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <img 
        //   src={`http://localhost:8000/output/file/${filename}`}
        src={`http://34.134.92.145:8000/output/file/${filename}`}
          alt={filename}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '600px', 
            border: '2px solid rgba(75, 85, 99, 0.3)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling!.textContent = 'Failed to load image'
            ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
          }}
        />
        <div style={{ 
          display: 'none', 
          color: '#ef4444', 
          marginTop: '16px',
          fontStyle: 'italic'
        }}></div>
      </div>
    )
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
          📁 Output Files
        </h3>
        <button 
          onClick={fetchOutputFiles}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading 
              ? 'rgba(75, 85, 99, 0.5)' 
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            boxShadow: loading 
              ? 'none' 
              : '0 4px 16px rgba(16, 185, 129, 0.3)',
            transform: loading ? 'none' : 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)'
            }
          }}
        >
          {loading ? '⏳ Loading...' : '👁️ View Output'}
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          ❌ {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            marginBottom: '16px', 
            fontSize: '0.95rem', 
            color: '#9ca3af',
            fontWeight: '500'
          }}>
            Found {files.length} output file{files.length !== 1 ? 's' : ''}
          </div>
          
          {files.map((file, index) => (
            <div key={index} style={{ 
              marginBottom: '12px', 
              border: '1px solid rgba(75, 85, 99, 0.3)', 
              borderRadius: '8px',
              background: 'rgba(17, 24, 39, 0.6)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              <div 
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s ease'
                }}
                onClick={() => toggleFileExpansion(file.filename, file.type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(75, 85, 99, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div>
                  <span style={{ 
                    fontWeight: '600',
                    color: '#e0e6ed',
                    fontSize: '1rem'
                  }}>
                    {file.type === 'csv' ? '📊' : file.type === 'image' ? '🖼️' : '📄'} {file.filename}
                  </span>
                  <span style={{ 
                    marginLeft: '12px', 
                    color: '#9ca3af', 
                    fontSize: '0.9rem' 
                  }}>
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <span style={{ 
                  fontSize: '1.2rem',
                  color: '#9ca3af',
                  transition: 'transform 0.2s ease',
                  transform: expandedFiles.has(file.filename) ? 'rotate(90deg)' : 'rotate(0deg)'
                }}>
                  ▶️
                </span>
              </div>
              
              {expandedFiles.has(file.filename) && (
                <div style={{ 
                  borderTop: '1px solid rgba(75, 85, 99, 0.3)', 
                  background: 'rgba(17, 24, 39, 0.8)'
                }}>
                  {file.type === 'csv' && renderCSVTable(file.filename)}
                  {file.type === 'image' && renderImage(file.filename)}
                  {file.type === 'other' && (
                    <div style={{ 
                      padding: '20px', 
                      textAlign: 'center'
                    }}>
                      <a 
                        // href={`http://localhost:8000/output/file/${file.filename}`}
                        href={`http://34.134.92.145:8000/output/file/${file.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#3b82f6', 
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '1rem',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#60a5fa'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#3b82f6'
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
          marginTop: '20px', 
          padding: '20px', 
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          borderRadius: '8px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>
            📂 No output files found
          </div>
          <div style={{ fontSize: '0.9rem', color: '#d97706' }}>
            Run your ML processing script to generate results.
          </div>
        </div>
      )}
    </div>
  )
}

export default FileDisplay