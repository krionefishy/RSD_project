import { useMockAuth } from "../config/presentationMode";
import {
  mockMotivationRating,
  mockSellingStatsDaily,
  mockSellingStatsPeriodic,
} from "../mock/fixtures/sellings";
import { apiClient } from "./APIClient";

export interface PlanBonusRule {
  fromQuantity: number;
  toQuantity: number | null;
  bonusPerUnit: number;
}

export interface SellingStats {
  userId: string;
  plan: number;
  fact: number;
  percent: number;
  bonus: number;
  chart: Array<{ day: string; plan: number; fact: number }>;
  positions: Array<{ name: string; plan: number; fact: number }>;
  productName?: string;
  targetQuantity?: number;
  factQuantity?: number;
  bonusRules?: PlanBonusRule[];
}

export type SalesPlanPeriod = "daily" | "periodic";

export interface MotivationProgram {
  userId: string;
  currentPoints: number;
  level: string;
  nextLevelPoints: number;
  rewards: Array<{
    id: string;
    name: string;
    pointsRequired: number;
    isAchieved: boolean;
  }>;
}

export interface RatingItem {
  rank: number;
  userId: string;
  name: string;
  store: string;
  value: string;
  isMe: boolean;
}

export interface MotivationRating {
  sales: {
    myPosition: number;
    change: number;
    myValue: string;
    total: number;
    list: RatingItem[];
  };
  learning: {
    myPosition: number;
    change: number;
    myValue: string;
    total: number;
    list: RatingItem[];
  };
}

interface SellingStatsDTO {
  user_id: string;
  plan: number;
  fact: number;
  percent: number;
  bonus: number;
  chart: Array<{ day: string; plan: number; fact: number }>;
  positions: Array<{ name: string; plan: number; fact: number }>;
}

interface RatingItemDTO {
  rank: number;
  user_id: string;
  name: string;
  store: string;
  value: string;
  is_me: boolean;
}

interface MotivationRatingDTO {
  sales: {
    my_position: number;
    change: number;
    my_value: string;
    total: number;
    list: RatingItemDTO[];
  };
  learning: {
    my_position: number;
    change: number;
    my_value: string;
    total: number;
    list: RatingItemDTO[];
  };
}

function mapSellingStats(dto: SellingStatsDTO): SellingStats {
  return {
    userId: dto.user_id,
    plan: dto.plan,
    fact: dto.fact,
    percent: dto.percent,
    bonus: dto.bonus,
    chart: dto.chart,
    positions: dto.positions,
  };
}

function mapRatingItem(dto: RatingItemDTO): RatingItem {
  return {
    rank: dto.rank,
    userId: dto.user_id,
    name: dto.name,
    store: dto.store,
    value: dto.value,
    isMe: dto.is_me,
  };
}

function mapMotivationRating(dto: MotivationRatingDTO): MotivationRating {
  return {
    sales: {
      myPosition: dto.sales.my_position,
      change: dto.sales.change,
      myValue: dto.sales.my_value,
      total: dto.sales.total,
      list: dto.sales.list.map(mapRatingItem),
    },
    learning: {
      myPosition: dto.learning.my_position,
      change: dto.learning.change,
      myValue: dto.learning.my_value,
      total: dto.learning.total,
      list: dto.learning.list.map(mapRatingItem),
    },
  };
}

class SellingsAPIImpl {
  async getStats(
    userIdOrPeriodOrSignal?: string | SalesPlanPeriod | AbortSignal,
    signal?: AbortSignal,
  ): Promise<SellingStats> {
    if (useMockAuth()) {
      if (userIdOrPeriodOrSignal === "periodic") return mockSellingStatsPeriodic();
      if (userIdOrPeriodOrSignal === "daily") return mockSellingStatsDaily();
      return mockSellingStatsDaily();
    }
    const userId =
      typeof userIdOrPeriodOrSignal === "string" &&
      userIdOrPeriodOrSignal !== "daily" &&
      userIdOrPeriodOrSignal !== "periodic"
        ? userIdOrPeriodOrSignal
        : undefined;
    const requestSignal = userIdOrPeriodOrSignal instanceof AbortSignal ? userIdOrPeriodOrSignal : signal;
    const query: Record<string, string> = {};
    if (userId) query.user_id = userId;
    const response = await apiClient.get<SellingStatsDTO>("/sales/stats", {
      query,
      signal: requestSignal,
    });
    return mapSellingStats(response);
  }

  async getMotivation(signal?: AbortSignal): Promise<MotivationRating> {
    if (useMockAuth()) {
      return mockMotivationRating();
    }
    const response = await apiClient.get<MotivationRatingDTO>("/sales/motivation", { signal });
    return mapMotivationRating(response);
  }

  async getBlockStats(blockId: string, from?: string, to?: string): Promise<SellingStats> {
    if (useMockAuth()) {
      return mockSellingStatsDaily();
    }
    const query: Record<string, string> = { block_id: blockId };
    if (from) query.from = from;
    if (to) query.to = to;
    const response = await apiClient.get<SellingStatsDTO>("/sales/stats", { query });
    return mapSellingStats(response);
  }
}

export const SellingsAPI = new SellingsAPIImpl();
