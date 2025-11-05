import { useState, useEffect } from 'react'
import './PopUpInstructions.css'

interface PopUpInstructionsProps {
  userId: number
}

function PopUpInstructions({ userId }: PopUpInstructionsProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show instructions every time the app loads
    setIsVisible(true)
  }, [userId])

  const handleClose = () => {
    // Close the popup
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <div className="popup-header">
          <h2>📸 Picture Instructions</h2>
          <button onClick={handleClose} className="popup-close-button">
            ✕
          </button>
        </div>
        <div className="popup-content">
          <p className="popup-message">
            Please take a picture 📸  of a sweetpotato 🍠 placed on the conveyer belt 🛤 picture from <strong>6 feet away</strong> and then come back here to upload and classify it!
          </p>
        </div>
        <div className="popup-footer">
          <button onClick={handleClose} className="popup-button">
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

export default PopUpInstructions
