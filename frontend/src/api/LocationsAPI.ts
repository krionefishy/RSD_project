import type {
  BlockDetail,
  BlockFilters,
  BlockSummary,
  CreateBlockData,
  CreateLocationData,
  LocationDetail,
  LocationFilters,
  LocationSummary,
  StructureUserBrief,
  UpdateBlockData,
  UpdateLocationData,
} from "../types/location";
import { useMockApiModule } from "../config/presentationMode";
import {
  mockGetBlock,
  mockGetLocation,
  mockListBlocks,
  mockListLocations,
} from "../mock/fixtures/locations";
import { apiClient } from "./APIClient";

interface UserBriefDTO {
  id: string;
  external_system_id: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
}

interface BlockListItemDTO {
  id: number;
  name: string;
  description?: string | null;
  stores: number;
  employees: number;
  manager_id?: string;
  manager_name?: string;
}

interface LocationBriefInBlockDTO {
  id: number;
  code: string;
  name: string;
  address: string;
  city?: string | null;
  employees: number;
}

interface BlockDetailDTO extends BlockListItemDTO {
  locations: LocationBriefInBlockDTO[];
  members: UserBriefDTO[];
}

interface LocationListItemDTO {
  id: number;
  code: string;
  name: string;
  address: string;
  city?: string | null;
  block_id?: number | null;
  block_name?: string | null;
  employees: number;
}

interface LocationDetailDTO extends LocationListItemDTO {
  members: UserBriefDTO[];
}

function mapUserBrief(dto: UserBriefDTO): StructureUserBrief {
  return {
    id: dto.id,
    externalSystemId: dto.external_system_id,
    firstName: dto.first_name,
    lastName: dto.last_name,
    role: dto.role,
  };
}

function mapBlock(dto: BlockListItemDTO): BlockSummary {
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description,
    stores: dto.stores,
    employees: dto.employees,
    managerId: dto.manager_id,
    managerName: dto.manager_name,
  };
}

function mapBlockDetail(dto: BlockDetailDTO): BlockDetail {
  return {
    ...mapBlock(dto),
    locations: dto.locations.map((location) => ({
      id: String(location.id),
      code: location.code,
      name: location.name,
      address: location.address,
      city: location.city,
      employees: location.employees,
    })),
    members: dto.members.map(mapUserBrief),
  };
}

function mapLocation(dto: LocationListItemDTO): LocationSummary {
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name,
    address: dto.address,
    city: dto.city,
    blockId: dto.block_id != null ? String(dto.block_id) : undefined,
    blockName: dto.block_name ?? undefined,
    employees: dto.employees,
  };
}

function mapLocationDetail(dto: LocationDetailDTO): LocationDetail {
  return {
    ...mapLocation(dto),
    members: dto.members.map(mapUserBrief),
  };
}

class LocationsAPIImpl {
  async listBlocks(filters?: BlockFilters, signal?: AbortSignal): Promise<BlockSummary[]> {
    if (useMockApiModule("locations")) {
      return mockListBlocks();
    }
    const response = await apiClient.get<{ items: BlockListItemDTO[]; total: number }>(
      "/admin/super/blocks",
      {
        signal,
        query: filters?.blockId ? { block_id: filters.blockId } : undefined,
      },
    );
    return response.items.map(mapBlock);
  }

  async getBlock(blockId: string, signal?: AbortSignal): Promise<BlockDetail> {
    if (useMockApiModule("locations")) {
      return mockGetBlock(blockId);
    }
    const response = await apiClient.get<BlockDetailDTO>(`/admin/super/blocks/${blockId}`, { signal });
    return mapBlockDetail(response);
  }

  async createBlock(data: CreateBlockData): Promise<BlockSummary> {
    if (useMockApiModule("locations")) {
      return { id: "99", name: data.name, description: data.description, stores: 0, employees: 0 };
    }
    const response = await apiClient.post<BlockListItemDTO>("/admin/super/blocks", {
      name: data.name,
      description: data.description,
    });
    return mapBlock(response);
  }

  async updateBlock(blockId: string, data: UpdateBlockData): Promise<BlockSummary> {
    if (useMockApiModule("locations")) {
      return mockGetBlock(blockId);
    }
    const response = await apiClient.put<BlockListItemDTO>(`/admin/super/blocks/${blockId}`, {
      name: data.name,
      description: data.description,
    });
    return mapBlock(response);
  }

  async deleteBlock(_blockId: string): Promise<void> {
    if (useMockApiModule("locations")) return;
    await apiClient.delete(`/admin/super/blocks/${_blockId}`);
  }

  async listLocations(filters?: LocationFilters, signal?: AbortSignal): Promise<LocationSummary[]> {
    if (useMockApiModule("locations")) {
      return mockListLocations(filters?.blockId);
    }
    const query: Record<string, string> = {};
    if (filters?.blockId) query.block_id = filters.blockId;
    if (filters?.locationId) query.location_id = filters.locationId;
    const response = await apiClient.get<{ items: LocationListItemDTO[]; total: number }>(
      "/admin/super/locations",
      { signal, query: Object.keys(query).length ? query : undefined },
    );
    return response.items.map(mapLocation);
  }

  async getLocation(locationId: string, signal?: AbortSignal): Promise<LocationDetail> {
    if (useMockApiModule("locations")) {
      return mockGetLocation(locationId);
    }
    const response = await apiClient.get<LocationDetailDTO>(`/admin/super/locations/${locationId}`, {
      signal,
    });
    return mapLocationDetail(response);
  }

  async createLocation(data: CreateLocationData): Promise<LocationSummary> {
    if (useMockApiModule("locations")) {
      return {
        id: "99",
        code: data.code,
        name: data.name,
        address: data.address,
        city: data.city,
        employees: 0,
      };
    }
    const response = await apiClient.post<LocationListItemDTO>("/admin/super/locations", {
      code: data.code,
      name: data.name,
      address: data.address,
      city: data.city,
    });
    return mapLocation(response);
  }

  async updateLocation(locationId: string, data: UpdateLocationData): Promise<LocationSummary> {
    if (useMockApiModule("locations")) {
      const current = mockGetLocation(locationId);
      return {
        ...current,
        code: data.code ?? current.code,
        name: data.name ?? current.name,
        address: data.address ?? current.address,
        city: data.city ?? current.city,
      };
    }
    const response = await apiClient.put<LocationListItemDTO>(`/admin/super/locations/${locationId}`, {
      code: data.code,
      name: data.name,
      address: data.address,
      city: data.city,
    });
    return mapLocation(response);
  }

  async deleteLocation(_locationId: string): Promise<void> {
    if (useMockApiModule("locations")) return;
    await apiClient.delete(`/admin/super/locations/${_locationId}`);
  }

  async assignLocationToBlock(blockId: string, locationId: string): Promise<LocationSummary> {
    if (useMockApiModule("locations")) {
      return mockGetLocation(locationId);
    }
    const response = await apiClient.post<LocationListItemDTO>(
      `/admin/super/blocks/${blockId}/locations/${locationId}`,
    );
    return mapLocation(response);
  }

  async removeLocationFromBlock(_blockId: string, _locationId: string): Promise<void> {
    if (useMockApiModule("locations")) return;
    await apiClient.delete(`/admin/super/blocks/${_blockId}/locations/${_locationId}`);
  }

  async assignUserToLocation(_userId: string, _locationId: number): Promise<void> {
    if (useMockApiModule("locations")) return;
    await apiClient.post(`/admin/staff/users/${_userId}/location`, { location_id: _locationId });
  }

  async removeUserFromLocation(_userId: string): Promise<void> {
    if (useMockApiModule("locations")) return;
    await apiClient.delete(`/admin/staff/users/${_userId}/location`);
  }

  async assignManagerToBlock(_managerId: string, _blockId: string): Promise<void> {
    if (useMockApiModule("locations")) return;
    await apiClient.post(`/admin/software/users/${_managerId}/blocks`, { block_id: Number(_blockId) });
  }

  async removeManagerFromBlock(_managerId: string, _blockId: string): Promise<void> {
    if (useMockApiModule("locations")) return;
    await apiClient.delete(`/admin/software/users/${_managerId}/blocks/${_blockId}`);
  }
}

export const LocationsAPI = new LocationsAPIImpl();
