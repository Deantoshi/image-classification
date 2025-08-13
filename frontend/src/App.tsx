import './App.css'
import FileUpload from './components/FileUpload'

function App() {
  return (
    <>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>🔬 Image Processing Upload</h1>
        <p>Upload images for ML processing with Detectron2</p>
        
        <FileUpload />

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3>📋 Instructions:</h3>
          <ol>
            <li>Start your FastAPI backend: <code>python server.py</code></li>
            <li>Select one or more image files using the file input above</li>
            <li>Click "Upload Images" to send them to the backend</li>
            <li>Images will be saved to the <code>backend/input</code> folder</li>
            <li>Run your ML script to process the uploaded images</li>
          </ol>
        </div>
      </div>
    </>
  )
}

export default App