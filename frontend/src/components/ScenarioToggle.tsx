import './ScenarioToggle.css'
import { useScenario } from '../context/ScenarioContext'

function ScenarioToggle() {
  const { scenario, setScenario } = useScenario()

  return (
    <div className="scenario-toggle-container">
      <div className="scenario-toggle-wrapper">
        <button
          className={`scenario-toggle-option ${scenario === 'bin' ? 'active' : ''}`}
          onClick={() => setScenario('bin')}
        >
          <span className="scenario-icon">📦</span>
          <span className="scenario-label">Scenario 1: Bin</span>
        </button>
        <button
          className={`scenario-toggle-option ${scenario === 'conveyor' ? 'active' : ''}`}
          onClick={() => setScenario('conveyor')}
        >
          <span className="scenario-icon">🏭</span>
          <span className="scenario-label">Scenario 2: Conveyor Belt</span>
        </button>
      </div>
    </div>
  )
}

export default ScenarioToggle
