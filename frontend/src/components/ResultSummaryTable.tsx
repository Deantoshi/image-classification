import { useState, useEffect } from 'react'
import './ResultSummaryTable.css'
import { calculatePricingSummary, PricingSummary } from '../services/PricingService'
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
        const summary = await calculatePricingSummary(userId, scenario)
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

  if (!pricingSummary) {
    return null
  }

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
      <div className="grain-background"></div>
      <div className="summary-card">
        <div className="wheat-icon">🌾</div>
        <h2 className="summary-title">Financial Summary</h2>
        <p className="summary-subtitle">
          {scenario === 'bin' ? 'Bin Scenario' : 'Conveyor Scenario'}
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
                From Marketable
              </div>
              <div className="row-value revenue-value">
                {formatCurrency(pricingSummary.total_marketable_revenue)}
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">❌</span>
                From Not Marketable
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
                <strong>Total Penalty</strong> {scenario === 'conveyor' && <span className="note-text">(waived for conveyor)</span>}
              </div>
              <div className="row-value penalty-value">
                <strong>({formatCurrency(pricingSummary.total_penalty)})</strong>
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
                Marketable
              </div>
              <div className="row-value">
                {pricingSummary.total_marketable_classifications} ({formatPercentage(pricingSummary.marketable_proportion)})
              </div>
            </div>
            <div className="sheet-row child-row">
              <div className="row-label">
                <span className="row-icon">❌</span>
                Not Marketable
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
