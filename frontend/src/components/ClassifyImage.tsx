import { useState, forwardRef, useImperativeHandle } from 'react'
import './ClassifyImage.css'
import { addImageMatch } from '../services/ImageService'

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

interface ClassifyImageProps {
  userId: number;
  onClearComplete?: () => void;
  onClassifyComplete?: () => Promise<void>;
}

const ClassifyImage = forwardRef<ClassifyImageRef, ClassifyImageProps>(({ userId, onClearComplete, onClassifyComplete }, ref) => {
  const [classifying, setClassifying] = useState(false)
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:8000'

  const handleClassify = async () => {
    setClassifying(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const classificationResult: ClassificationResult = await response.json()
        setResult(classificationResult)

        // Clear input directory after successful classification
        if (classificationResult.status === 'success') {
          try {
            await fetch(`${API_BASE_URL}/clear-all-input`, {
              method: 'DELETE',
            })
            console.log('Input directory cleared successfully')

            // Notify parent to clear frontend files
            if (onClearComplete) {
              onClearComplete()
            }

            // Add image matches to database for processed files
            if (classificationResult.processed_files && classificationResult.processed_files.length > 0) {
              for (const fileName of classificationResult.processed_files) {
                try {
                  // The output files have 'masked_' prefix added to the original filename
                  const maskedFileName = `masked_${fileName}`
                  await addImageMatch(maskedFileName, userId)
                  console.log(`Added image match for ${maskedFileName}`)
                } catch (matchError) {
                  console.error(`Failed to add image match for ${fileName}:`, matchError)
                  // Don't show error to user, just log it
                }
              }
            }

            // Trigger CSV parsing to add analysis records to database
            if (onClassifyComplete) {
              await onClassifyComplete()
            }
          } catch (clearError) {
            console.error('Failed to clear input directory:', clearError)
            // Don't show error to user, just log it
          }
        }
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