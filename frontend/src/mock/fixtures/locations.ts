import type { BlockDetail, BlockSummary, LocationDetail, LocationSummary } from "../../types/location";
import { managerStores, networkBlocks } from "../mockData";

const MOCK_LOCATIONS: LocationSummary[] = managerStores.map((store, index) => ({
  id: String(index + 1),
  code: `LOC-${index + 1}`,
  name: store.name,
  address: `г. Москва, ${store.name}`,
  city: "Москва",
  blockId: String((index % 3) + 1),
  blockName: networkBlocks[index % networkBlocks.length]?.name,
  employees: store.employees,
}));

export function mockListBlocks(): BlockSummary[] {
  return networkBlocks.map((block) => ({
    id: block.id,
    name: block.name,
    description: `Регион ${block.name}`,
    stores: block.stores,
    employees: block.employees,
    managerId: "manager_north_001",
    managerName: "Павел Орлов",
  }));
}

export function mockGetBlock(blockId: string): BlockDetail {
  const summary = mockListBlocks().find((b) => b.id === blockId) ?? mockListBlocks()[0];
  const locations = MOCK_LOCATIONS.filter((l) => l.blockId === blockId);
  return {
    ...summary,
    locations: locations.map((l) => ({
      id: l.id,
      code: l.code,
      name: l.name,
      address: l.address,
      city: l.city,
      employees: l.employees,
    })),
    members: [
      {
        id: "mock-manager",
        externalSystemId: "manager_north_001",
        firstName: "Павел",
        lastName: "Орлов",
        role: "manager",
      },
    ],
  };
}

export function mockListLocations(blockId?: string): LocationSummary[] {
  if (!blockId) return MOCK_LOCATIONS;
  return MOCK_LOCATIONS.filter((l) => l.blockId === blockId);
}

export function mockGetLocation(locationId: string): LocationDetail {
  const summary = MOCK_LOCATIONS.find((l) => l.id === locationId) ?? MOCK_LOCATIONS[0];
  return {
    ...summary,
    members: [
      {
        id: "mock-seller-1",
        externalSystemId: "seller_anna_001",
        firstName: "Анна",
        lastName: "Иванова",
        role: "seller",
      },
      {
        id: "mock-seller-2",
        externalSystemId: "seller_kirill_001",
        firstName: "Кирилл",
        lastName: "Захаров",
        role: "seller",
      },
    ],
  };
}
