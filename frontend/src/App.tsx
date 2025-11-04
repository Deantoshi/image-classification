import { useState, useEffect, useRef } from 'react'
import './App.css'
import Signup from './components/Signup'
import FileUpload, { FileUploadRef } from './components/FileUpload'
import ClassifyImage, { ClassifyImageRef } from './components/ClassifyImage'
import FileDisplay from './components/FileDisplay'

function App() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null)
  const classifyImageRef = useRef<ClassifyImageRef>(null)
  const classifyImageSectionRef = useRef<HTMLDivElement>(null)
  const fileUploadRef = useRef<FileUploadRef>(null)

  // Check localStorage for existing user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleSignupComplete = (userId: number, username: string) => {
    setUser({ id: userId, name: username })
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  const handleUploadComplete = () => {
    // Trigger classification automatically
    if (classifyImageRef.current) {
      classifyImageRef.current.classify()
    }

    // Scroll to the ClassifyImage section
    if (classifyImageSectionRef.current) {
      classifyImageSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const handleClearComplete = () => {
    // Clear frontend files after backend clears successfully
    if (fileUploadRef.current) {
      fileUploadRef.current.clearFiles()
    }
  }

  if (!user) {
    return <Signup onSignupComplete={handleSignupComplete} />
  }

  return (
    <>
      <div className="app-container">
        <div className="header-section">
          <div className="header-content">
            <h1 className="main-title">
              🔬 AI Image Processor
            </h1>
            <p className="subtitle">
              Upload images for ML processing with Detectron2
            </p>
            <p className="welcome-user">Welcome, <strong>{user.name}</strong>! 👋</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <span className="logout-icon">🚪</span>
            Log Out
          </button>
        </div>

        <FileUpload ref={fileUploadRef} onUploadComplete={handleUploadComplete} />

        <div ref={classifyImageSectionRef}>
          <ClassifyImage ref={classifyImageRef} userId={user.id} onClearComplete={handleClearComplete} />
        </div>

        <FileDisplay userId={user.id} />

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