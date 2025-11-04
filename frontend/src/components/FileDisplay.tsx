import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { getUserImages } from '../services/ImageService'
import { addAnalysis, getUserAnalyses, AnalysisRecord } from '../services/UserAnalysis'
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

export interface FileDisplayRef {
  parseAnalysisCSV: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const FileDisplay = forwardRef<FileDisplayRef, FileDisplayProps>(({ userId }, ref) => {
  const [files, setFiles] = useState<OutputFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvData, setCsvData] = useState<{ [key: string]: CSVData }>({})
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [userAnalyses, setUserAnalyses] = useState<AnalysisRecord[]>([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [analysesError, setAnalysesError] = useState<string | null>(null)
  const [analysesTableExpanded, setAnalysesTableExpanded] = useState(true)

  // Automatically fetch output files and user analyses when component mounts or userId changes
  useEffect(() => {
    fetchOutputFiles()
    fetchUserAnalyses()
  }, [userId])

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

        // Automatically expand all image files
        const newExpanded = new Set(expandedFiles)
        userFiles.forEach((file: OutputFile) => {
          if (file.type === 'image') {
            newExpanded.add(file.filename)
          }
        })
        setExpandedFiles(newExpanded)
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

        // If this is the combined_analysis_with_grades.csv, parse and add analysis records
        if (filename === 'combined_analysis_with_grades.csv' && csvContent.data && csvContent.data.length > 0) {
          await parseAndAddAnalysisRecords(csvContent)
        }
      } else {
        console.error(`Failed to fetch CSV content for ${filename}`)
      }
    } catch (err) {
      console.error('CSV fetch error:', err)
    }
  }

  const parseAndAddAnalysisRecords = async (csvContent: CSVData) => {
    try {
      // First, get the user's images to filter only their analysis records
      const userImagesResponse = await getUserImages(userId)
      // The image_match table has 'masked_' prefix, so we need to create a set of original filenames
      const userImageNames = new Set(
        userImagesResponse.images.map(img => {
          // Remove 'masked_' prefix if present to match CSV image names
          return img.image_name.startsWith('masked_')
            ? img.image_name.substring(7) // Remove 'masked_' (7 characters)
            : img.image_name
        })
      )

      // Map column headers to their indices
      const headerMap: { [key: string]: number } = {}
      csvContent.headers.forEach((header, index) => {
        headerMap[header] = index
      })

      let addedCount = 0
      let skippedCount = 0

      // For each row in the CSV, create an analysis record only if it belongs to this user
      for (const row of csvContent.data) {
        try {
          // Extract image name from the row
          const imageName = row[headerMap['image_name']] || ''

          // Skip this row if the image doesn't belong to this user
          if (!userImageNames.has(imageName)) {
            skippedCount++
            continue
          }

          // Extract other values from the row based on header positions
          const objectIdInImage = parseInt(row[headerMap['object_id_in_image']] || '0')
          const areaPx2 = parseFloat(row[headerMap['area_px2']] || '0')
          const topLeftX = parseFloat(row[headerMap['top_left_x']] || '0')
          const topLeftY = parseFloat(row[headerMap['top_left_y']] || '0')
          const bottomRightX = parseFloat(row[headerMap['bottom_right_x']] || '0')
          const bottomRightY = parseFloat(row[headerMap['bottom_right_y']] || '0')
          const center = row[headerMap['center']] || ''
          const widthPx = parseFloat(row[headerMap['width_px']] || '0')
          const lengthPx = parseFloat(row[headerMap['length_px']] || '0')
          const volumePx3 = parseFloat(row[headerMap['volume_px3']] || '0')
          const solidity = parseFloat(row[headerMap['solidity']] || '0')
          const strictSolidity = parseFloat(row[headerMap['strict_solidity']] || '0')
          const lwRatio = parseFloat(row[headerMap['lw_ratio']] || '0')
          const areaIn2 = parseFloat(row[headerMap['area_in2']] || '0')
          const weightOz = parseFloat(row[headerMap['weight_oz']] || '0')
          const grade = row[headerMap['Grade']] || '' // Note: CSV uses 'Grade' with capital G

          // Call addAnalysis API
          await addAnalysis({
            image_name: imageName,
            object_id_in_image: objectIdInImage,
            area_px2: areaPx2,
            top_left_x: topLeftX,
            top_left_y: topLeftY,
            bottom_right_x: bottomRightX,
            bottom_right_y: bottomRightY,
            center: center,
            width_px: widthPx,
            length_px: lengthPx,
            volume_px3: volumePx3,
            solidity: solidity,
            strict_solidity: strictSolidity,
            lw_ratio: lwRatio,
            area_in2: areaIn2,
            weight_oz: weightOz,
            grade: grade,
            user_id: userId
          })
          addedCount++
        } catch (rowError) {
          console.error('Error adding analysis record for row:', rowError)
          // Continue processing other rows even if one fails
        }
      }

      console.log(`Successfully added ${addedCount} analysis records for user ${userId}`)
      if (skippedCount > 0) {
        console.log(`Skipped ${skippedCount} records that don't belong to this user`)
      }

      // After adding all records, fetch the user's analyses to display
      await fetchUserAnalyses()
    } catch (error) {
      console.error('Error parsing and adding analysis records:', error)
    }
  }

  const fetchUserAnalyses = async () => {
    setLoadingAnalyses(true)
    setAnalysesError(null)

    try {
      const response = await getUserAnalyses(userId)
      setUserAnalyses(response.analyses)
    } catch (err) {
      console.error('Error fetching user analyses:', err)
      setAnalysesError('Failed to fetch analysis data')
    } finally {
      setLoadingAnalyses(false)
    }
  }

  // Method to refresh both output files and user analyses
  const refreshAll = async () => {
    await Promise.all([
      fetchOutputFiles(),
      fetchUserAnalyses()
    ])
  }

  // Method to parse the analysis CSV and add records to database
  const parseAnalysisCSV = async () => {
    try {
      console.log('Automatically parsing analysis CSV...')
      const filename = 'combined_analysis_with_grades.csv'

      // Fetch the CSV content
      const response = await fetch(`http://localhost:8000/output/csv/${filename}`)
      // const response = await fetch(`http://34.134.92.145:8000/output/csv/${filename}`)

      if (response.ok) {
        const csvContent = await response.json()
        // Parse and add analysis records
        await parseAndAddAnalysisRecords(csvContent)
        console.log('Analysis CSV parsed and records added successfully')

        // Automatically refresh the display after parsing
        await refreshAll()
      } else {
        console.log('Analysis CSV not found or could not be fetched')
      }
    } catch (error) {
      console.error('Error parsing analysis CSV:', error)
    }
  }

  // Expose parseAnalysisCSV and refreshAll methods to parent component
  useImperativeHandle(ref, () => ({
    parseAnalysisCSV,
    refreshAll
  }))

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

      {/* User Analysis Data Section */}
      <div className="user-analyses-section">
        <div
          className="file-display-header"
          onClick={() => setAnalysesTableExpanded(!analysesTableExpanded)}
          style={{ cursor: 'pointer' }}
        >
          <h3 className="file-display-title">
            <span className={`expand-icon ${analysesTableExpanded ? 'expanded' : ''}`}>
              ▶️
            </span>
            {' '}📊 My Analysis Data
          </h3>
        </div>

        {analysesTableExpanded && (
          <>
            {analysesError && (
              <div className="error-message">
                ❌ {analysesError}
              </div>
            )}

            {userAnalyses.length > 0 && (
              <div className="analyses-container">
                <div className="files-count">
                  Found {userAnalyses.length} analysis record{userAnalyses.length !== 1 ? 's' : ''}
                </div>
                <div className="analyses-table-wrapper">
                  <table className="analyses-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Image</th>
                        <th>Object #</th>
                        <th>Area (px²)</th>
                        <th>Width (px)</th>
                        <th>Length (px)</th>
                        <th>Volume (px³)</th>
                        <th>Area (in²)</th>
                        <th>Weight (oz)</th>
                        <th>Grade</th>
                        <th>L/W Ratio</th>
                        <th>Solidity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userAnalyses.map((analysis) => (
                        <tr key={analysis.object_id}>
                          <td>{analysis.object_id}</td>
                          <td>{analysis.image_name}</td>
                          <td>{analysis.object_id_in_image}</td>
                          <td>{analysis.area_px2.toFixed(2)}</td>
                          <td>{analysis.width_px.toFixed(2)}</td>
                          <td>{analysis.length_px.toFixed(2)}</td>
                          <td>{analysis.volume_px3.toFixed(2)}</td>
                          <td>{analysis.area_in2.toFixed(2)}</td>
                          <td>{analysis.weight_oz.toFixed(2)}</td>
                          <td className={`grade-${analysis.grade.replace(/\s+/g, '-').toLowerCase()}`}>
                            {analysis.grade}
                          </td>
                          <td>{analysis.lw_ratio.toFixed(2)}</td>
                          <td>{analysis.solidity.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loadingAnalyses && userAnalyses.length === 0 && !analysesError && (
              <div className="no-files-message">
                <div className="no-files-title">
                  📊 No analysis data found
                </div>
                <div className="no-files-subtitle">
                  Process images to see your analysis data here.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
})

FileDisplay.displayName = 'FileDisplay'

export default FileDisplay