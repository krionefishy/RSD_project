export interface StructureUserBrief {
  id: string;
  externalSystemId: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
}

export interface BlockSummary {
  id: string;
  name: string;
  description?: string | null;
  stores: number;
  employees: number;
  managerId?: string;
  managerName?: string;
}

export interface BlockDetail extends BlockSummary {
  locations: LocationInBlock[];
  members: StructureUserBrief[];
}

export interface LocationInBlock {
  id: string;
  code: string;
  name: string;
  address: string;
  city?: string | null;
  employees: number;
}

export interface LocationSummary {
  id: string;
  code: string;
  name: string;
  address: string;
  city?: string | null;
  s1StartAt?: string | null;
  s1EndAt?: string | null;
  s2StartAt?: string | null;
  s2EndAt?: string | null;
  blockId?: string;
  blockName?: string;
  employees: number;
}

export interface LocationDetail extends LocationSummary {
  members: StructureUserBrief[];
}

export interface BlockFilters {
  blockId?: string;
}

export interface LocationFilters {
  blockId?: string;
  locationId?: string;
}

export interface CreateBlockData {
  name: string;
  description?: string;
}

export interface UpdateBlockData {
  name?: string;
  description?: string | null;
}

export interface CreateLocationData {
  code: string;
  name: string;
  address: string;
  city?: string;
  s1StartAt?: string;
  s1EndAt?: string;
  s2StartAt?: string;
  s2EndAt?: string;
}

export interface UpdateLocationData {
  code?: string;
  name?: string;
  address?: string;
  city?: string | null;
  s1StartAt?: string;
  s1EndAt?: string;
  s2StartAt?: string;
  s2EndAt?: string;
}
