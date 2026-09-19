import { useState, useEffect } from 'react'
import './ResultSummaryTable.css'
import { getSavedPricingSummary, PricingSummary, PENALTY_RATE_RANGES } from '../services/PricingService'
import { useScenario } from '../context/ScenarioContext'

interface ResultSummaryTableProps {
  userId: number
  refreshKey?: number
}

function ResultSummaryTable({ userId, refreshKey }: ResultSummaryTableProps) {
  const { scenario } = useScenario()
  const [pricingSummary, setPricingSummary] = useState<PricingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPricingSummary = async () => {
      if (!scenario) {
        setPricingSummary(null)
        return
      }

      setLoading(true)
      setError(null)
      try {
        // Show the saved result of the last run so the random penalty matches what was recorded
        const summary = await getSavedPricingSummary(userId, scenario)
        setPricingSummary(summary)
      } catch (err) {
        console.error('Error fetching pricing summary:', err)
        setError('Failed to load pricing summary')
      } finally {
        setLoading(false)
      }
    }

    fetchPricingSummary()
  }, [userId, scenario, refreshKey])

  if (loading) {
    return (
      <div className="summary-container">
        <div className="summary-card">
          <div className="summary-loading">
            <div className="loading-spinner"></div>
            <p>Loading pricing summary...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="summary-container">
        <div className="summary-card">
          <div className="summary-error">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!pricingSummary || !scenario) {
    return null
  }

  const [minPenaltyRate, maxPenaltyRate] = PENALTY_RATE_RANGES[scenario]

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getProfitClass = (profit: number) => {
    if (profit > 0) return 'profit-positive'
    if (profit < 0) return 'profit-negative'
    return 'profit-zero'
  }

  return (
    <div className="summary-container">
      <div className="summary-card">
        <div className="wheat-icon">🌾</div>
        <h2 className="summary-title">Financial Summary</h2>
        <p className="summary-subtitle">
          {scenario === 'bin' ? 'Truck View Adventure' : 'Packing Line View Adventure'}
        </p>

        {/* Balance Sheet Table */}
        <div className="balance-sheet">
          {/* Revenue Section */}
          <div className="sheet-section">
            <div className="section-header">Revenue</div>
            <div className="sheet-row parent-row">
              <div className="row-label">
                <span className="row-icon">💰</span>
                <strong>Total Revenue</strong>
              </div>
              <div className="row-value revenue-value">
                <strong>{formatCurrency(pricingSummary.total_revenue)}</strong>
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">✅</span>
                From US Grade 1
              </div>
              <div className="row-value revenue-value">
                {formatCurrency(pricingSummary.total_marketable_revenue)}
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">❌</span>
                From Small/Jumbo
              </div>
              <div className="row-value revenue-value">
                {formatCurrency(pricingSummary.total_not_marketable_revenue)}
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="sheet-section">
            <div className="section-header">Deductions</div>
            <div className="sheet-row parent-row">
              <div className="row-label">
                <span className="row-icon">⚖️</span>
                <strong>Total Penalty</strong>
              </div>
              <div className="row-value penalty-value">
                <strong>({formatCurrency(pricingSummary.total_penalty)})</strong>
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">🎲</span>
                Penalty Rate <span className="note-text">(random {formatPercentage(minPenaltyRate)}–{formatPercentage(maxPenaltyRate)} per run)</span>
              </div>
              <div className="row-value">
                {formatPercentage(pricingSummary.penalty_rate)}
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">🧮</span>
                {formatPercentage(pricingSummary.penalty_rate)} × {formatCurrency(pricingSummary.total_revenue)} Revenue
              </div>
              <div className="row-value penalty-value">
                ({formatCurrency(pricingSummary.total_penalty)})
              </div>
            </div>
          </div>

          {/* Classification Summary */}
          <div className="sheet-section">
            <div className="section-header">Classification Summary</div>
            <div className="sheet-row parent-row">
              <div className="row-label">
                <span className="row-icon">📊</span>
                <strong>Total Classifications</strong>
              </div>
              <div className="row-value">
                <strong>{pricingSummary.total_classifications}</strong>
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">✅</span>
                US Grade 1
              </div>
              <div className="row-value">
                {pricingSummary.total_marketable_classifications} ({formatPercentage(pricingSummary.marketable_proportion)})
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">❌</span>
                Small/Jumbo
              </div>
              <div className="row-value">
                {pricingSummary.total_not_marketable_classifications} ({formatPercentage(pricingSummary.not_marketable_proportion)})
              </div>
            </div>
          </div>

          {/* Net Profit Section */}
          <div className="sheet-section total-section">
            <div className="sheet-row total-row">
              <div className="row-label">
                <span className="row-icon">📈</span>
                <strong>Net Profit</strong>
              </div>
              <div className={`row-value ${getProfitClass(pricingSummary.total_profit)}`}>
                <strong>{formatCurrency(pricingSummary.total_profit)}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ResultSummaryTable
