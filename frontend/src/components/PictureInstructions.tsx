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
            You may choose to complete one of the following scenarios:
          </p>

          <div className="scenarios-section">
            <div className="scenario-card">
              <h3 className="scenario-title">📦 Scenario 1: Bin</h3>
              <ul className="scenario-list">
                <li>Take a picture of the sweetpotatoes in the bin</li>
              </ul>
            </div>

            <div className="scenario-card">
              <h3 className="scenario-title">🏭 Scenario 2: Conveyer Belt</h3>
              <ul className="scenario-list">
                <li>Take the sweetpotatoes out of the box, laying them on the conveyor belt</li>
                <li>Take a picture of the sweetpotatoes laid out on the conveyor belt</li>
              </ul>
            </div>
          </div>

          <div className="requirements-section">
            <h3 className="requirements-title">Requirements</h3>
            <ul className="requirements-list">
              <li>Images must be in <strong>landscape orientation</strong> (phone screen sideways NOT up and down)</li>
              <li>Utilize the tape measurer to make sure you are <strong>6ft vertical distance</strong> from sweetpotatoes to camera</li>
            </ul>
          </div>
        </div>
        <ScenarioToggle />
      </div>
    </div>
  )
}

export default PictureInstructions
