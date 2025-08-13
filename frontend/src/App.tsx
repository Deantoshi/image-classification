import './App.css'
import FileUpload from './components/FileUpload'
import ClassifyImage from './components/ClassifyImage'
import FileDisplay from './components/FileDisplay'

function App() {
  return (
    <>
      <div style={{ 
        padding: '20px', 
        maxWidth: '900px', 
        margin: '0 auto',
        color: '#e0e6ed'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '30px 0'
        }}>
          <h1 style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '3rem',
            margin: '0 0 10px 0',
            fontWeight: '700'
          }}>
            🔬 AI Image Processor
          </h1>
          <p style={{
            color: '#9ca3af',
            fontSize: '1.2rem',
            margin: '0',
            fontWeight: '400'
          }}>
            Upload images for ML processing with Detectron2
          </p>
        </div>
        
        <FileUpload />
        
        <ClassifyImage />
        
        <FileDisplay />

        <div style={{ 
          marginTop: '40px', 
          padding: '25px', 
          background: 'rgba(30, 30, 46, 0.6)',
          borderRadius: '12px',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <h3 style={{
            color: '#e0e6ed',
            margin: '0 0 20px 0',
            fontSize: '1.3rem',
            fontWeight: '600'
          }}>
            📋 Getting Started
          </h3>
          <ol style={{
            color: '#9ca3af',
            lineHeight: '1.8',
            paddingLeft: '20px',
            margin: '0'
          }}>
            <li style={{ marginBottom: '8px' }}>
              Start your FastAPI backend: <code style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a78bfa',
                padding: '3px 8px',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem'
              }}>python server.py</code>
            </li>
            <li style={{ marginBottom: '8px' }}>Select one or more image files using the file input above</li>
            <li style={{ marginBottom: '8px' }}>Click "Upload Images" to send them to the backend</li>
            <li style={{ marginBottom: '8px' }}>
              Images will be saved to the <code style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#a78bfa',
                padding: '3px 8px',
                borderRadius: '6px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem'
              }}>backend/input</code> folder
            </li>
            <li style={{ marginBottom: '8px' }}>Click "Classify Images" to run your ML script on the uploaded images</li>
            <li>Click "View Output" to see processed results (CSV files and images)</li>
          </ol>
        </div>
      </div>
    </>
  )
}

export default App