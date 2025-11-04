import './App.css'
import FileUpload from './components/FileUpload'
import ClassifyImage from './components/ClassifyImage'
import FileDisplay from './components/FileDisplay'

function App() {
  return (
    <>
      <div className="app-container">
        <div className="header-section">
          <h1 className="main-title">
            🔬 AI Image Processor
          </h1>
          <p className="subtitle">
            Upload images for ML processing with Detectron2
          </p>
        </div>

        <FileUpload />

        <ClassifyImage />

        <FileDisplay />

        <div className="getting-started">
          <h3 className="section-title">
            📋 Getting Started
          </h3>
          <ol className="instruction-list">
            <li className="instruction-item">
              Start your FastAPI backend: <code className="inline-code">python server.py</code>
            </li>
            <li className="instruction-item">Select one or more image files using the file input above</li>
            <li className="instruction-item">Click "Upload Images" to send them to the backend</li>
            <li className="instruction-item">
              Images will be saved to the <code className="inline-code">backend/input</code> folder
            </li>
            <li className="instruction-item">Click "Classify Images" to run your ML script on the uploaded images</li>
            <li>Click "View Output" to see processed results (CSV files and images)</li>
          </ol>
        </div>
      </div>
    </>
  )
}

export default App