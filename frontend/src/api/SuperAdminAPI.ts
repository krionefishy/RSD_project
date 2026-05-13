import { apiClient } from "./APIClient";

export interface Block {
  id: string;
  name: string;
  stores: number;
  employees: number;
  managerId?: string;
  managerName?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  blockId: string;
  employees: number;
}

interface BlockDTO {
  id: string;
  name: string;
  stores: number;
  employees: number;
  manager_id?: string;
  manager_name?: string;
}

interface LocationDTO {
  id: string;
  name: string;
  address: string;
  block_id: string;
  employees: number;
}

function mapBlock(dto: BlockDTO): Block {
  return {
    id: dto.id,
    name: dto.name,
    stores: dto.stores,
    employees: dto.employees,
    managerId: dto.manager_id,
    managerName: dto.manager_name,
  };
}

function mapLocation(dto: LocationDTO): Location {
  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    blockId: dto.block_id,
    employees: dto.employees,
  };
}

class SuperAdminAPIImpl {
  async listBlocks(signal?: AbortSignal): Promise<Block[]> {
    const response = await apiClient.get<{ items: BlockDTO[] }>("/admin/super/blocks", { signal });
    return response.items.map(mapBlock);
  }

  async createBlock(name: string): Promise<Block> {
    const response = await apiClient.post<BlockDTO>("/admin/super/blocks", { name });
    return mapBlock(response);
  }

  async updateBlock(blockId: string, name: string): Promise<Block> {
    const response = await apiClient.put<BlockDTO>(`/admin/super/blocks/${blockId}`, { name });
    return mapBlock(response);
  }

  async deleteBlock(blockId: string): Promise<void> {
    await apiClient.delete(`/admin/super/blocks/${blockId}`);
  }

  async listLocations(signal?: AbortSignal): Promise<Location[]> {
    const response = await apiClient.get<{ items: LocationDTO[] }>("/admin/super/locations", { signal });
    return response.items.map(mapLocation);
  }

  async createLocation(name: string, address: string, blockId: string): Promise<Location> {
    const response = await apiClient.post<LocationDTO>("/admin/super/locations", { name, address, block_id: blockId });
    return mapLocation(response);
  }

  async updateLocation(locationId: string, name: string, address: string): Promise<Location> {
    const response = await apiClient.put<LocationDTO>(`/admin/super/locations/${locationId}`, { name, address });
    return mapLocation(response);
  }

  async deleteLocation(locationId: string): Promise<void> {
    await apiClient.delete(`/admin/super/locations/${locationId}`);
  }
}

export const SuperAdminAPI = new SuperAdminAPIImpl();
