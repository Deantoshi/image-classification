import { useState, forwardRef, useImperativeHandle } from 'react'
import './ClassifyImage.css'

interface ClassificationResult {
  message: string;
  status: string;
  output_files_generated?: number;
  stdout?: string;
  stderr?: string;
  error_code?: number;
  processed_files?: string[];
}

export interface ClassifyImageRef {
  classify: () => void;
}

const ClassifyImage = forwardRef<ClassifyImageRef>((props, ref) => {
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClassify = async () => {
    setClassifying(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/classify', {
    // const response = await fetch('http://34.134.92.145:8000/classify', {
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

  // Expose handleClassify to parent component via ref
  useImperativeHandle(ref, () => ({
    classify: handleClassify
  }))

  const formatOutput = (text: string) => {
    if (!text) return null

    // Split by lines and format for better readability
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return null

    return (
      <div className="output-content">
        {lines.map((line, index) => (
          <div key={index} className="output-line">{line}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="classify-card">
      <div className="classify-header">
        <h3 className="classify-title">
          🤖 AI Image Classification
        </h3>
        <p className="classify-description">
          Run Detectron2 ML processing on uploaded images
        </p>
        
        <button
          onClick={handleClassify}
          disabled={classifying}
          className="classify-button"
        >
          {classifying ? '⏳ Processing...' : '🚀 Classify Images'}
        </button>
      </div>

      {error && (
        <div className="classify-error">
          {error}
        </div>
      )}

      {result && (
        <div className="classify-result-container">
          <div className={`classify-result ${result.status === 'success' ? 'success' : 'error'}`}>
            <strong>
              {result.status === 'success' ? '✅' : '⚠️'} {result.message}
            </strong>

            {result.status === 'success' && result.output_files_generated !== undefined && (
              <div className={`result-details ${result.status === 'success' ? 'success' : 'error'}`}>
                📁 Generated {result.output_files_generated} output file{result.output_files_generated !== 1 ? 's' : ''}
              </div>
            )}

            {result.processed_files && result.processed_files.length > 0 && (
              <div className={`result-details ${result.status === 'success' ? 'success' : 'error'}`}>
                📷 Processed files: {result.processed_files.join(', ')}
              </div>
            )}

            {result.error_code && (
              <div className="result-details error">
                🔢 Error code: {result.error_code}
              </div>
            )}
          </div>

          {result.stdout && (
            <div className="output-section">
              <strong className="output-label">
                📄 Script Output:
              </strong>
              {formatOutput(result.stdout)}
            </div>
          )}

          {result.stderr && (
            <div className="output-section">
              <strong className="output-label error">
                ⚠️ Error Output:
              </strong>
              {formatOutput(result.stderr)}
            </div>
          )}

          {result.status === 'success' && result.output_files_generated && result.output_files_generated > 0 && (
            <div className="next-step-info">
              <span className="info-title">💡 <strong>Next step:</strong></span>
              <span className="info-text"> Use the "View Output" section below to see your processed results!</span>
            </div>
          )}
        </div>
      )}

      {classifying && (
        <div className="processing-message">
          <div className="processing-title">
            🔄 Processing images with Detectron2...
          </div>
          <div className="processing-subtitle">
            This may take several minutes depending on the number and size of images.
          </div>
        </div>
      )}
    </div>
  )
})

ClassifyImage.displayName = 'ClassifyImage'

export default ClassifyImage