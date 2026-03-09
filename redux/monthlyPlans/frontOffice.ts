import type { MonthlyPlanDetailsPayload } from "./mockAdapter";
import type { AssignedMeal } from "./types";

const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const createDateTabsFromSelection = (startDate: string, selectedDaysPerWeek: number, totalWeeks: number) => {
  const safeDays = Math.max(1, selectedDaysPerWeek);
  const safeWeeks = Math.max(1, totalWeeks);
  const totalDays = safeDays * safeWeeks;
  return Array.from({ length: totalDays }, (_, index) => addDays(startDate, index));
};

export const getMealsByDate = (details: MonthlyPlanDetailsPayload, dateIso: string): AssignedMeal[] => {
  return details.weekAssignments.flatMap((assignment) => assignment.mealsByDate[dateIso] ?? []);
};

export const getVisiblePlanForFrontOffice = (details: MonthlyPlanDetailsPayload | null) => {
  if (!details) return null;
  return details.plan.status === "active" ? details : null;
};
