import type {
  EmployeeCompensation,
  LocationTimesheet,
  OwnTimesheet,
  OwnTimesheetQuery,
  TimesheetEntry,
} from "../types/profile";
import { useMockApiModule } from "../config/presentationMode";
import { mockEmployeeTimesheet, mockLocationTimesheet } from "../mock/fixtures/personnel";
import { apiClient } from "./APIClient";

interface EmployeeCompensationDTO {
  user_id: string;
  base_salary: string;
  hourly_rate: string;
  night_hourly_rate?: string | null;
  effective_night_hourly_rate: string;
  updated_at: string;
}

interface UserBriefDTO {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface LocationBriefDTO {
  id: number;
  name: string;
}

interface EmployeeTimeEntryDTO {
  id: number;
  user_id: string;
  user: UserBriefDTO;
  location?: LocationBriefDTO | null;
  work_date: string;
  activity_code: string;
  activity_name: string;
  hours: string;
  shift_type: string;
  shift_code?: "С1" | "С2" | "В" | "О/Б" | null;
  starts_at?: string | null;
  ends_at?: string | null;
  comment?: string | null;
}

interface EmployeeTimesheetDTO {
  items: EmployeeTimeEntryDTO[];
  total_hours: string;
}

interface LocationTimesheetDTO {
  location: LocationBriefDTO;
  items: EmployeeTimeEntryDTO[];
  total_hours: string;
}

function userDisplayName(user: UserBriefDTO): string {
  if (user.name?.trim()) return user.name.trim();
  const parts = [user.last_name, user.first_name].filter(Boolean);
  return parts.join(" ").trim() || user.id;
}

function mapTimeEntry(dto: EmployeeTimeEntryDTO): TimesheetEntry {
  return {
    id: dto.id,
    workDate: dto.work_date,
    activityCode: dto.activity_code,
    activityName: dto.activity_name,
    hours: dto.hours,
    shiftType: dto.shift_type as TimesheetEntry["shiftType"],
    shiftCode: dto.shift_code ?? undefined,
    startsAt: dto.starts_at ?? undefined,
    endsAt: dto.ends_at ?? undefined,
    comment: dto.comment ?? undefined,
    userId: dto.user_id,
    userName: userDisplayName(dto.user),
    locationName: dto.location?.name,
  };
}

function mapCompensation(dto: EmployeeCompensationDTO): EmployeeCompensation {
  return {
    userId: dto.user_id,
    baseSalary: dto.base_salary,
    hourlyRate: dto.hourly_rate,
    nightHourlyRate: dto.night_hourly_rate ?? undefined,
    effectiveNightHourlyRate: dto.effective_night_hourly_rate,
    updatedAt: dto.updated_at,
  };
}

class PersonnelAPIImpl {
  async getEmployeeCompensation(userId: string, signal?: AbortSignal): Promise<EmployeeCompensation | null> {
    if (useMockApiModule("personnel")) {
      return {
        userId,
        baseSalary: "45000",
        hourlyRate: "350",
        effectiveNightHourlyRate: "420",
        updatedAt: new Date().toISOString(),
      };
    }
    const response = await apiClient.get<EmployeeCompensationDTO | null>(
      `/personnel/users/${userId}/compensation`,
      { signal },
    );
    if (!response) return null;
    return mapCompensation(response);
  }

  async getLocationTimesheet(
    locationId: number,
    query: OwnTimesheetQuery,
    signal?: AbortSignal,
  ): Promise<LocationTimesheet> {
    if (useMockApiModule("personnel")) {
      return mockLocationTimesheet(query);
    }
    const response = await apiClient.get<LocationTimesheetDTO>(`/personnel/locations/${locationId}/timesheet`, {
      query: {
        period_from: query.periodFrom,
        period_to: query.periodTo,
      },
      signal,
    });
    return {
      location: { id: response.location.id, name: response.location.name },
      items: response.items.map(mapTimeEntry),
      totalHours: response.total_hours,
    };
  }

  async getEmployeeTimesheet(
    userId: string,
    query: OwnTimesheetQuery,
    signal?: AbortSignal,
  ): Promise<OwnTimesheet> {
    if (useMockApiModule("personnel")) {
      return mockEmployeeTimesheet(userId, query);
    }
    const response = await apiClient.get<EmployeeTimesheetDTO>(`/personnel/users/${userId}/timesheet`, {
      query: {
        period_from: query.periodFrom,
        period_to: query.periodTo,
        location_id: query.locationId,
      },
      signal,
    });
    return {
      items: response.items.map(mapTimeEntry),
      periodFrom: query.periodFrom,
      periodTo: query.periodTo,
      totalHours: response.total_hours,
    };
  }
}

export const PersonnelAPI = new PersonnelAPIImpl();
