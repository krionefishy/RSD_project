import type { MotivationRating, SellingStats } from "../../api/SellingsAPI";
import { ratingData, salesData } from "../mockData";

const COFFEE_BONUS_RULES = [
  { fromQuantity: 1, toQuantity: 10, bonusPerUnit: 5 },
  { fromQuantity: 11, toQuantity: 20, bonusPerUnit: 10 },
  { fromQuantity: 21, toQuantity: null, bonusPerUnit: 15 },
];

export function mockSellingStatsDaily(): SellingStats {
  const d = salesData.daily;
  return {
    userId: "mock-seller",
    plan: d.plan,
    fact: d.fact,
    percent: d.percent,
    bonus: d.bonus,
    chart: d.chart,
    positions: d.positions,
    productName: "Кофе (чашки)",
    targetQuantity: 30,
    factQuantity: 27,
    bonusRules: COFFEE_BONUS_RULES,
  };
}

export function mockSellingStatsPeriodic(): SellingStats {
  const p = salesData.periodic;
  return {
    userId: "mock-seller",
    plan: p.plan,
    fact: p.fact,
    percent: p.percent,
    bonus: p.bonus,
    chart: p.chart,
    positions: p.positions,
    productName: "Кофе (чашки)",
    targetQuantity: 600,
    factQuantity: 516,
    bonusRules: COFFEE_BONUS_RULES,
  };
}

export function mockMotivationRating(): MotivationRating {
  return {
    sales: {
      myPosition: ratingData.sales.myPosition,
      change: 2,
      myValue: ratingData.sales.myValue,
      total: ratingData.sales.total,
      list: ratingData.sales.list.map((item, index) => ({
        rank: item.rank,
        userId: `mock-rank-${index}`,
        name: item.name,
        store: item.store,
        value: item.value,
        isMe: item.isMe,
      })),
    },
    learning: {
      myPosition: ratingData.learning.myPosition,
      change: 1,
      myValue: ratingData.learning.myValue,
      total: ratingData.learning.total,
      list: ratingData.learning.list.map((item, index) => ({
        rank: item.rank,
        userId: `mock-learn-${index}`,
        name: item.name,
        store: item.store,
        value: item.value,
        isMe: item.isMe,
      })),
    },
  };
}
