import { useState, useEffect, useRef } from 'react'
import './App.css'
import Signup from './components/Signup'
import FileUpload, { FileUploadRef } from './components/FileUpload'
import ClassifyImage, { ClassifyImageRef } from './components/ClassifyImage'
import FileDisplay, { FileDisplayRef } from './components/FileDisplay'
import AdminView from './components/AdminView'
import PopUpInstructions from './components/PopUpInstructions'
import PictureInstructions from './components/PictureInstructions'
import ResultSummaryTable from './components/ResultSummaryTable'
import { ScenarioProvider, useScenario } from './context/ScenarioContext'

function AppContent() {
  const [user, setUser] = useState<{ id: number; name: string } | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)
  const { scenario } = useScenario()
  const classifyImageRef = useRef<ClassifyImageRef>(null)
  const classifyImageSectionRef = useRef<HTMLDivElement>(null)
  const fileUploadRef = useRef<FileUploadRef>(null)
  const fileDisplayRef = useRef<FileDisplayRef>(null)
  const fileDisplaySectionRef = useRef<HTMLDivElement>(null)

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
    // Set classifying state to true when starting classification
    setIsClassifying(true)

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

  const handleClassifyComplete = async () => {
    // After classification completes, automatically parse the CSV and add to database
    // This will also automatically refresh the output files and analyses display
    if (fileDisplayRef.current) {
      await fileDisplayRef.current.parseAnalysisCSV()
    }

    // Scroll to the FileDisplay section
    if (fileDisplaySectionRef.current) {
      fileDisplaySectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }

    // Set classifying state to false when classification is complete
    setIsClassifying(false)
  }

  if (!user) {
    return <Signup onSignupComplete={handleSignupComplete} />
  }

  // Check if user is admin
  if (user.name.toLowerCase() === 'ai_beanie') {
    return <AdminView username={user.name} userId={user.id} onLogout={handleLogout} />
  }

  return (
    <div className="app-container">
      <PopUpInstructions userId={user.id} />
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

      <PictureInstructions />

      <FileUpload ref={fileUploadRef} onUploadComplete={handleUploadComplete} isClassifying={isClassifying} scenarioSelected={scenario !== null} />

        <div ref={classifyImageSectionRef}>
          <ClassifyImage
            ref={classifyImageRef}
            userId={user.id}
            onClearComplete={handleClearComplete}
            onClassifyComplete={handleClassifyComplete}
          />
        </div>

        <div ref={fileDisplaySectionRef}>
          <FileDisplay ref={fileDisplayRef} userId={user.id} />
        </div>

      <ResultSummaryTable userId={user.id} />

    </div>
  )
}

function App() {
  return (
    <ScenarioProvider>
      <AppContent />
    </ScenarioProvider>
  )
}

export default App