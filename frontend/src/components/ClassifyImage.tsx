import { useState } from 'react'

interface ClassificationResult {
  message: string;
  status: string;
  output_files_generated?: number;
  stdout?: string;
  stderr?: string;
  error_code?: number;
  processed_files?: string[];
}

const ClassifyImage = () => {
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClassify = async () => {
    setClassifying(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const classificationResult: ClassificationResult = await response.json()
        setResult(classificationResult)
      } else {
        const errorData = await response.json()
        setError(`❌ Error: ${errorData.detail}`)
      }
    } catch (err) {
      console.error('Classification error:', err)
      setError('❌ Error: Failed to connect to server. Make sure FastAPI is running on port 8000.')
    } finally {
      setClassifying(false)
    }
  }

  const formatOutput = (text: string) => {
    if (!text) return null
    
    // Split by lines and format for better readability
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return null

    return (
      <div style={{ 
        fontFamily: 'monospace', 
        fontSize: '12px', 
        backgroundColor: '#f8f9fa', 
        padding: '10px', 
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🤖 Image Classification</h3>
        <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '14px' }}>
          Run Detectron2 ML processing on uploaded images
        </p>
        
        <button 
          onClick={handleClassify}
          disabled={classifying}
          style={{
            padding: '12px 24px',
            backgroundColor: classifying ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: classifying ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          {classifying ? '⏳ Classifying...' : '🚀 Classify Images'}
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
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ 
            padding: '15px', 
            backgroundColor: result.status === 'success' ? '#d4edda' : '#f8d7da',
            color: result.status === 'success' ? '#155724' : '#721c24',
            borderRadius: '4px',
            border: `1px solid ${result.status === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <strong>
              {result.status === 'success' ? '✅' : '⚠️'} {result.message}
            </strong>
            
            {result.status === 'success' && result.output_files_generated !== undefined && (
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                📁 Generated {result.output_files_generated} output file{result.output_files_generated !== 1 ? 's' : ''}
              </div>
            )}
            
            {result.processed_files && result.processed_files.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                📷 Processed files: {result.processed_files.join(', ')}
              </div>
            )}
            
            {result.error_code && (
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                🔢 Error code: {result.error_code}
              </div>
            )}
          </div>

          {result.stdout && (
            <div style={{ marginTop: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#666' }}>📄 Script Output:</strong>
              {formatOutput(result.stdout)}
            </div>
          )}

          {result.stderr && (
            <div style={{ marginTop: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#721c24' }}>⚠️ Error Output:</strong>
              {formatOutput(result.stderr)}
            </div>
          )}

          {result.status === 'success' && result.output_files_generated && result.output_files_generated > 0 && (
            <div style={{ 
              marginTop: '15px', 
              padding: '10px', 
              backgroundColor: '#e7f3ff',
              borderRadius: '4px',
              border: '1px solid #b8daff',
              fontSize: '14px'
            }}>
              💡 <strong>Next step:</strong> Use the "View Output" section below to see your processed results!
            </div>
          )}
        </div>
      )}

      {classifying && (
        <div style={{ 
          marginTop: '15px', 
          padding: '15px', 
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '4px',
          border: '1px solid #ffeaa7',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '8px' }}>🔄 Processing images with Detectron2...</div>
          <div style={{ fontSize: '12px' }}>This may take several minutes depending on the number and size of images.</div>
        </div>
      )}
    </div>
  )
}

export default ClassifyImage