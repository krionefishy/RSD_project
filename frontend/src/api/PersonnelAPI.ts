import type { EmployeeCompensation, OwnTimesheet, OwnTimesheetEntry } from "../types/profile";
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
  comment?: string | null;
}

interface EmployeeTimesheetDTO {
  items: EmployeeTimeEntryDTO[];
  total_hours: string;
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

function mapTimeEntry(dto: EmployeeTimeEntryDTO): OwnTimesheetEntry {
  return {
    id: dto.id,
    workDate: dto.work_date,
    activityCode: dto.activity_code,
    activityName: dto.activity_name,
    hours: dto.hours,
    shiftType: dto.shift_type,
    comment: dto.comment ?? undefined,
  };
}

class PersonnelAPIImpl {
  async getEmployeeCompensation(userId: string, signal?: AbortSignal): Promise<EmployeeCompensation | null> {
    const response = await apiClient.get<EmployeeCompensationDTO | null>(
      `/personnel/users/${userId}/compensation`,
      { signal },
    );
    if (!response) return null;
    return mapCompensation(response);
  }

  async getEmployeeTimesheet(
    userId: string,
    query: { periodFrom: string; periodTo: string; locationId?: number },
    signal?: AbortSignal,
  ): Promise<OwnTimesheet> {
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

  async updateTimeEntry(
    entryId: number,
    data: { activityCode?: string; hours?: string; shiftType?: string; comment?: string },
  ): Promise<OwnTimesheetEntry> {
    const response = await apiClient.patch<EmployeeTimeEntryDTO>(
      `/admin/staff/timesheets/entries/${entryId}`,
      {
        activity_code: data.activityCode,
        hours: data.hours,
        shift_type: data.shiftType,
        comment: data.comment,
      },
    );
    return mapTimeEntry(response);
  }
}

export const PersonnelAPI = new PersonnelAPIImpl();
