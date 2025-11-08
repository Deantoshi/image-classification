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
          <p className="picture-instructions-message">
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
        <ScenarioToggle />
      </div>
    </div>
  )
}

export default PictureInstructions
