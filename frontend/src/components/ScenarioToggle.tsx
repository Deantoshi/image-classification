import './ScenarioToggle.css'
import { useScenario } from '../context/ScenarioContext'

function ScenarioToggle() {
  const { scenario, setScenario } = useScenario()

  return (
    <div className="scenario-toggle-container">
      {scenario === null && (
        <div className="scenario-warning">
          ⚠️ Please select an adventure before uploading your image
        </div>
      )}
      <div className={`scenarios-section ${scenario === null ? 'requires-selection' : ''}`}>
        <button
          type="button"
          className={`scenario-card ${scenario === 'bin' ? 'active' : ''}`}
          onClick={() => setScenario('bin')}
          aria-pressed={scenario === 'bin'}
        >
          <h3 className="scenario-title">🚚 Adventure 1: Truck View</h3>
          <ul className="scenario-list">
            <li>Take a picture of the sweetpotatoes in the bin</li>
          </ul>
        </button>

        <button
          type="button"
          className={`scenario-card ${scenario === 'conveyor' ? 'active' : ''}`}
          onClick={() => setScenario('conveyor')}
          aria-pressed={scenario === 'conveyor'}
        >
          <h3 className="scenario-title">📦 Adventure 2: Packing Line View</h3>
          <ul className="scenario-list">
            <li>Take the sweetpotatoes out of the box, laying them on the packing line</li>
            <li>Take a picture of the sweetpotatoes laid out on the packing line</li>
          </ul>
        </button>
      </div>
    </div>
  )
}

export default ScenarioToggle
