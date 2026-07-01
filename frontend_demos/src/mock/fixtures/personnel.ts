import type { OwnTimesheet, OwnTimesheetQuery, TimesheetEntry } from "../../types/profile";
import { scheduleData } from "../mockData";

export function mockOwnTimesheet(query: OwnTimesheetQuery): OwnTimesheet {
  const workDays = scheduleData.days.filter((d) => d.type === "work" && d.shift);
  const items = workDays.slice(0, 12).map((day, index) => ({
    id: index + 1,
    workDate: `2026-04-${String(day.date).padStart(2, "0")}`,
    activityCode: "SALE",
    activityName: "Работа в зале",
    hours: "8.0",
    shiftType: "day" as const,
    comment: undefined,
  }));

  return {
    items,
    periodFrom: query.periodFrom,
    periodTo: query.periodTo,
    totalHours: String(items.length * 8),
  };
}

export function mockLocationTimesheet(query: OwnTimesheetQuery) {
  const base = mockOwnTimesheet(query);
  return {
    location: { id: 1, name: "Точка 1" },
    items: base.items.map((item, index) => ({
      ...item,
      userId: index % 2 === 0 ? "mock-seller-1" : "mock-seller-2",
      userName: index % 2 === 0 ? "Анна Иванова" : "Кирилл Захаров",
      locationName: "Точка 1",
    })),
    totalHours: base.totalHours,
  };
}

export function mockEmployeeTimesheet(_userId: string, query: OwnTimesheetQuery): OwnTimesheet {
  return mockOwnTimesheet(query);
}

export function mockTimeEntry(id: number): TimesheetEntry {
  return {
    id,
    workDate: "2026-04-10",
    activityCode: "SALE",
    activityName: "Работа в зале",
    hours: "8.0",
    shiftType: "day",
  };
}
