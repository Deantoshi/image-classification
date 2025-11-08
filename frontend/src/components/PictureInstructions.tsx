import './PictureInstructions.css'

function PictureInstructions() {
  return (
    <div className="picture-instructions-container">
      <div className="picture-instructions-card">
        <div className="picture-instructions-header">
          <h2 className="picture-instructions-title">📸 Picture Instructions</h2>
        </div>
        <div className="picture-instructions-content">
          <p className="picture-instructions-message">
            Please take a picture 📸 of a sweetpotato 🍠 placed on the conveyer belt 🛤 picture from <strong>6 feet away</strong> and then come back here to upload and classify it!
          </p>
        </div>
      </div>
    </div>
  )
}

export default PictureInstructions
