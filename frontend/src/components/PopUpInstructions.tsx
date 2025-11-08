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
          <p className="popup-intro">
            You may choose to complete one of the following scenarios:
          </p>

          <div className="popup-scenarios-section">
            <div className="popup-scenario-card">
              <h3 className="popup-scenario-title">📦 Scenario 1: Bin</h3>
              <ul className="popup-scenario-list">
                <li>Take a picture of the sweetpotatoes in the bin</li>
              </ul>
            </div>

            <div className="popup-scenario-card">
              <h3 className="popup-scenario-title">🏭 Scenario 2: Conveyor Belt</h3>
              <ul className="popup-scenario-list">
                <li>Take the sweetpotatoes out of the box, laying them on the conveyor belt</li>
                <li>Take a picture of the sweetpotatoes laid out on the conveyor belt</li>
              </ul>
            </div>
          </div>

          <div className="popup-requirements-section">
            <h3 className="popup-requirements-title">Requirements</h3>
            <ul className="popup-requirements-list">
              <li>Images must be in <strong>landscape orientation</strong> (phone screen sideways NOT up and down)</li>
              <li>Utilize the tape measurer to make sure you are <strong>6ft vertical distance</strong> from sweetpotatoes to camera</li>
            </ul>
          </div>
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
