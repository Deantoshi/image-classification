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
        fontFamily: 'JetBrains Mono, monospace', 
        fontSize: '13px', 
        background: 'rgba(17, 24, 39, 0.8)', 
        color: '#e0e6ed',
        padding: '16px', 
        borderRadius: '8px',
        border: '1px solid rgba(75, 85, 99, 0.3)',
        maxHeight: '250px',
        overflowY: 'auto'
      }}>
        {lines.map((line, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>{line}</div>
        ))}
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
          🤖 AI Image Classification
        </h3>
        <p style={{ 
          margin: '0 0 20px 0', 
          color: '#9ca3af', 
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          Run Detectron2 ML processing on uploaded images
        </p>
        
        <button 
          onClick={handleClassify}
          disabled={classifying}
          style={{
            padding: '14px 28px',
            background: classifying 
              ? 'rgba(75, 85, 99, 0.5)' 
              : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: classifying ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1.1rem',
            transition: 'all 0.3s ease',
            boxShadow: classifying 
              ? 'none' 
              : '0 4px 16px rgba(6, 182, 212, 0.3)',
            transform: classifying ? 'none' : 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (!classifying) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(6, 182, 212, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!classifying) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(6, 182, 212, 0.3)'
            }
          }}
        >
          {classifying ? '⏳ Processing...' : '🚀 Classify Images'}
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
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            padding: '16px', 
            background: result.status === 'success' 
              ? 'rgba(16, 185, 129, 0.15)' 
              : 'rgba(239, 68, 68, 0.15)',
            color: result.status === 'success' ? '#10b981' : '#ef4444',
            borderRadius: '8px',
            border: `1px solid ${result.status === 'success' 
              ? 'rgba(16, 185, 129, 0.3)' 
              : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <strong>
              {result.status === 'success' ? '✅' : '⚠️'} {result.message}
            </strong>
            
            {result.status === 'success' && result.output_files_generated !== undefined && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '0.95rem',
                color: result.status === 'success' ? '#059669' : '#dc2626'
              }}>
                📁 Generated {result.output_files_generated} output file{result.output_files_generated !== 1 ? 's' : ''}
              </div>
            )}
            
            {result.processed_files && result.processed_files.length > 0 && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '0.95rem',
                color: result.status === 'success' ? '#059669' : '#dc2626'
              }}>
                📷 Processed files: {result.processed_files.join(', ')}
              </div>
            )}
            
            {result.error_code && (
              <div style={{ 
                marginTop: '12px', 
                fontSize: '0.95rem',
                color: '#dc2626'
              }}>
                🔢 Error code: {result.error_code}
              </div>
            )}
          </div>

          {result.stdout && (
            <div style={{ marginTop: '16px' }}>
              <strong style={{ 
                fontSize: '0.95rem', 
                color: '#9ca3af',
                display: 'block',
                marginBottom: '8px'
              }}>
                📄 Script Output:
              </strong>
              {formatOutput(result.stdout)}
            </div>
          )}

          {result.stderr && (
            <div style={{ marginTop: '16px' }}>
              <strong style={{ 
                fontSize: '0.95rem', 
                color: '#ef4444',
                display: 'block',
                marginBottom: '8px'
              }}>
                ⚠️ Error Output:
              </strong>
              {formatOutput(result.stderr)}
            </div>
          )}

          {result.status === 'success' && result.output_files_generated && result.output_files_generated > 0 && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'rgba(59, 130, 246, 0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '0.95rem'
            }}>
              <span style={{ color: '#3b82f6' }}>💡 <strong>Next step:</strong></span>
              <span style={{ color: '#9ca3af' }}> Use the "View Output" section below to see your processed results!</span>
            </div>
          )}
        </div>
      )}

      {classifying && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          borderRadius: '8px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ 
            marginBottom: '12px',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            🔄 Processing images with Detectron2...
          </div>
          <div style={{ 
            fontSize: '0.9rem',
            color: '#d97706',
            fontStyle: 'italic'
          }}>
            This may take several minutes depending on the number and size of images.
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassifyImage