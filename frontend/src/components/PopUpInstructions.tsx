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
            You may choose to complete one of the following scenarios

            Scenario 1:

            Take a picture of the sweetpotatoes in the bin

            Scenario 2:

            Take the sweetpotatoes out of the box, laying them on the conveyor belt

            Take a picture of the sweetpotatoes laid out on the conveyor belt

            Requirements

            Images must be in landscape orientation

            Utilize the tape measure to make sure you are 6ft vertical distance from sweetpotatoes to camera
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
