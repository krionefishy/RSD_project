import { apiClient } from "./APIClient";

export interface BlockListItem {
  id: number;
  name: string;
  description: string | null;
  stores: number;
  employees: number;
  managerId: string | null;
  managerName: string | null;
}

export interface LocationListItem {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  blockId: number | null;
  blockName: string | null;
  employees: number;
}

interface BlockListItemDTO {
  id: number;
  name: string;
  description: string | null;
  stores: number;
  employees: number;
  manager_id: string | null;
  manager_name: string | null;
}

interface LocationListItemDTO {
  id: number;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  block_id: number | null;
  block_name: string | null;
  employees: number;
}

class StructureAPIImpl {
  async listBlocks(params?: { blockId?: number }, signal?: AbortSignal): Promise<BlockListItem[]> {
    const query: Record<string, string | number> = {};
    if (params?.blockId !== undefined) query.block_id = params.blockId;
    const response = await apiClient.get<{ items: BlockListItemDTO[]; total: number }>(
      "/structure/blocks",
      { query, signal },
    );
    return response.items.map((dto) => ({
      id: dto.id,
      name: dto.name,
      description: dto.description,
      stores: dto.stores,
      employees: dto.employees,
      managerId: dto.manager_id,
      managerName: dto.manager_name,
    }));
  }

  async listLocations(params?: { blockId?: number; locationId?: number }, signal?: AbortSignal): Promise<LocationListItem[]> {
    const query: Record<string, string | number> = {};
    if (params?.blockId !== undefined) query.block_id = params.blockId;
    if (params?.locationId !== undefined) query.location_id = params.locationId;
    const response = await apiClient.get<{ items: LocationListItemDTO[]; total: number }>(
      "/structure/locations",
      { query, signal },
    );
    return response.items.map((dto) => ({
      id: dto.id,
      code: dto.code,
      name: dto.name,
      address: dto.address,
      city: dto.city,
      blockId: dto.block_id,
      blockName: dto.block_name,
      employees: dto.employees,
    }));
  }
}

export const StructureAPI = new StructureAPIImpl();
