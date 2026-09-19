import './PictureInstructions.css'
import ScenarioToggle from './ScenarioToggle'

function PictureInstructions() {
  return (
    <div className="picture-instructions-container">
      <div className="picture-instructions-card">
        <div className="picture-instructions-header">
          <h2 className="picture-instructions-title">📸 Picture Instructions</h2>
        </div>
        <div className="picture-instructions-content">
          <p className="picture-instructions-intro">
            You may choose to complete one of the following adventures:
          </p>

          <ScenarioToggle />

          <div className="requirements-section">
            <h3 className="requirements-title">Requirements</h3>
            <ul className="requirements-list">
              <li>Images must be in <strong>landscape orientation</strong> (phone screen sideways NOT up and down)</li>
              <li>Utilize the tape measurer to make sure you are <strong>6ft vertical distance</strong> from sweetpotatoes to camera</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PictureInstructions
