import { getUserAnalyses, AnalysisRecord } from './UserAnalysis';

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:8000';

// Static pricing constants
export const MARKETABLE_RATIO = 0.35;
export const NOT_MARKETABLE_RATIO = 0.65;
export const PENALTY = 0.15;
export const MARKETABLE_PRICE = 0.56;
export const NOT_MARKETABLE_PRICE = 0.008;
export const FINAL_COUNT = 20;

export type Scenario = 'bin' | 'conveyor';

export interface PricingSummary {
  total_profit: number;
  total_revenue: number;
  total_penalty: number;
  marketable_proportion: number;
  not_marketable_proportion: number;
  total_classifications: number;
  total_marketable_classifications: number;
  total_not_marketable_classifications: number;
  total_marketable_revenue: number;
  total_not_marketable_revenue: number;
}

/**
 * Determines if an analysis record is marketable based on its grade.
 * Grade will be either "Marketable" or "Not Marketable".
 */
const isMarketable = (analysis: AnalysisRecord): boolean => {
  return analysis.grade === 'Marketable';
};

/**
 * Saves profit data to the backend database.
 * Prevents duplicate rows by using unique constraint on (user_id, scenario).
 */
const saveProfitData = async (
  user_id: number,
  scenario: Scenario,
  pricingSummary: PricingSummary
): Promise<void> => {
  try {
    // Convert scenario from 'bin' | 'conveyor' to 1 | 2
    const scenarioNumber = scenario === 'bin' ? 1 : 2;

    const response = await fetch(`${API_BASE_URL}/api/save-profit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id,
        scenario: scenarioNumber,
        total_profit: pricingSummary.total_profit,
        total_revenue: pricingSummary.total_revenue,
        total_penalty: pricingSummary.total_penalty,
        marketable_proportion: pricingSummary.marketable_proportion,
        not_marketable_proportion: pricingSummary.not_marketable_proportion,
        total_classifications: pricingSummary.total_classifications,
        total_marketable_classifications: pricingSummary.total_marketable_classifications,
        total_not_marketable_classifications: pricingSummary.total_not_marketable_classifications,
        total_marketable_revenue: pricingSummary.total_marketable_revenue,
        total_not_marketable_revenue: pricingSummary.total_not_marketable_revenue,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    await response.json();
  } catch (error) {
    console.error('Error saving profit data:', error);
    throw error;
  }
};

/**
 * Calculates pricing summary based on user analyses and scenario.
 *
 * @param user_id - The user ID to get analyses for
 * @param scenario - Either 'bin' (scenario 1) or 'conveyor' (scenario 2)
 * @returns PricingSummary with profit, revenue, penalty, and proportions
 */
export const calculatePricingSummary = async (
  user_id: number,
  scenario: Scenario
): Promise<PricingSummary> => {
  try {
    // Get user analyses
    const userAnalysesResponse = await getUserAnalyses(user_id);
    const analyses = userAnalysesResponse.analyses;

    if (analyses.length === 0) {
      // If no analyses, return zeros
      return {
        total_profit: 0,
        total_revenue: 0,
        total_penalty: 0,
        marketable_proportion: 0,
        not_marketable_proportion: 0,
        total_classifications: 0,
        total_marketable_classifications: 0,
        total_not_marketable_classifications: 0,
        total_marketable_revenue: 0,
        total_not_marketable_revenue: 0,
      };
    }

    // Calculate ratios
    const totalClassifications = analyses.length;
    const marketableCount = analyses.filter(isMarketable).length;
    const notMarketableCount = totalClassifications - marketableCount;

    const userMarketableRatio = marketableCount / totalClassifications;
    const userNotmarketableRatio = notMarketableCount / totalClassifications;

    // Calculate penalty
    let total_penalty = 0;
    if (scenario === 'bin') {
      // Scenario 1 (bin): calculate penalty
      total_penalty = Math.abs(userMarketableRatio - MARKETABLE_RATIO) * FINAL_COUNT * PENALTY;
    } else {
      // Scenario 2 (conveyor): no penalty
      total_penalty = 0;
    }

    // Calculate revenues (same for both scenarios)
    const total_marketable_revenue = userMarketableRatio * FINAL_COUNT * MARKETABLE_PRICE;
    const total_not_marketable_revenue = userNotmarketableRatio * FINAL_COUNT * NOT_MARKETABLE_PRICE;

    // Calculate total revenue and profit
    const total_revenue = total_marketable_revenue + total_not_marketable_revenue;
    const total_profit = total_revenue - total_penalty;

    const summary = {
      total_profit,
      total_revenue,
      total_penalty,
      marketable_proportion: userMarketableRatio,
      not_marketable_proportion: userNotmarketableRatio,
      total_classifications: totalClassifications,
      total_marketable_classifications: marketableCount,
      total_not_marketable_classifications: notMarketableCount,
      total_marketable_revenue,
      total_not_marketable_revenue,
    };

    // Save profit data to database
    await saveProfitData(user_id, scenario, summary);

    return summary;
  } catch (error) {
    console.error('Error calculating pricing summary:', error);
    throw error;
  }
};
