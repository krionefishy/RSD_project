import { apiClient } from "./APIClient";

export interface LearningRatingItem {
  rank: number;
  userId: string;
  userName: string;
  externalSystemId: string;
  totalPoints: number;
  metricDisplay: string;
  completionPct: number | null;
  completionDisplay: string | null;
  blockId: number | null;
  locationId: number | null;
}

export interface LearningRatingDTO {
  snapshotId: number;
  periodFrom: string;
  periodTo: string;
  calculatedAt: string;
  items: LearningRatingItem[];
}

interface LearningRatingResponseItem {
  rank: number;
  user_id: string;
  user_name: string;
  external_system_id: string;
  total_points: number;
  metric_display: string;
  completion_pct: number | null;
  completion_display: string | null;
  block_id: number | null;
  location_id: number | null;
}

interface LearningRatingResponse {
  snapshot_id: number;
  period_from: string;
  period_to: string;
  calculated_at: string;
  items: LearningRatingResponseItem[];
}

function mapItem(dto: LearningRatingResponseItem): LearningRatingItem {
  return {
    rank: dto.rank,
    userId: dto.user_id,
    userName: dto.user_name,
    externalSystemId: dto.external_system_id,
    totalPoints: dto.total_points,
    metricDisplay: dto.metric_display,
    completionPct: dto.completion_pct,
    completionDisplay: dto.completion_display,
    blockId: dto.block_id,
    locationId: dto.location_id,
  };
}

export interface CreateExportParams {
  reportType: string;
  scopeType?: string;
  scopeId?: number;
  periodFrom?: string;
  periodTo?: string;
}

export interface ExportStatusDTO {
  jobId: string;
  parseStatus: string;
  reportType: string;
  presignedUrl?: string | null;
}

class ReportsAPIImpl {
  async createExport(params: CreateExportParams): Promise<{ jobId: string }> {
    const response = await apiClient.post<{ job_id: string }>("/reports/exports", {
      report_type: params.reportType,
      scope_type: params.scopeType ?? "network",
      scope_id: params.scopeId ?? null,
      period_from: params.periodFrom ?? null,
      period_to: params.periodTo ?? null,
    });
    return { jobId: response.job_id };
  }

  async getExport(jobId: string): Promise<ExportStatusDTO> {
    const response = await apiClient.get<{
      job_id: string;
      parse_status: string;
      report_type: string;
      presigned_url: string | null;
    }>(`/reports/exports/${jobId}`);
    return {
      jobId: response.job_id,
      parseStatus: response.parse_status,
      reportType: response.report_type,
      presignedUrl: response.presigned_url,
    };
  }

  async getLearningRating(params?: { scopeType?: string; scopeId?: number; periodFrom?: string; periodTo?: string }): Promise<LearningRatingDTO | null> {
    try {
      const query: Record<string, string | number> = {};
      if (params?.scopeType) query.scope_type = params.scopeType;
      if (params?.scopeId !== undefined) query.scope_id = params.scopeId;
      if (params?.periodFrom) query.period_from = params.periodFrom;
      if (params?.periodTo) query.period_to = params.periodTo;

      const response = await apiClient.get<LearningRatingResponse>("/ratings/learning", { query });
      return {
        snapshotId: response.snapshot_id,
        periodFrom: response.period_from,
        periodTo: response.period_to,
        calculatedAt: response.calculated_at,
        items: response.items.map(mapItem),
      };
    } catch {
      return null;
    }
  }

  async recalculateLearningRating(params?: { periodFrom?: string; periodTo?: string }): Promise<{ snapshotId: number; calculatedAt: string } | null> {
    try {
      const query: Record<string, string> = {};
      if (params?.periodFrom) query.period_from = params.periodFrom;
      if (params?.periodTo) query.period_to = params.periodTo;
      const response = await apiClient.post<{ snapshot_id: number; calculated_at: string }>("/ratings/recalculate", undefined, { query });
      return { snapshotId: response.snapshot_id, calculatedAt: response.calculated_at };
    } catch {
      return null;
    }
  }
}

export const ReportsAPI = new ReportsAPIImpl();
