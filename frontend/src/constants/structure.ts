export interface StructureBlockOption {
  id: string;
  name: string;
}

export interface StructureLocationOption {
  id: string;
  name: string;
  blockId: string;
}

export const STRUCTURE_BLOCKS: StructureBlockOption[] = [
  { id: "1", name: "Северный блок" },
  { id: "2", name: "Центральный блок" },
  { id: "3", name: "Южный блок" },
  { id: "4", name: "Западный блок" },
  { id: "5", name: "Восточный блок" },
];

export const STRUCTURE_LOCATIONS: StructureLocationOption[] = [
  { id: "1", name: "Точка 1", blockId: "1" },
  { id: "2", name: "Точка 2", blockId: "1" },
  { id: "3", name: "Точка 3", blockId: "1" },
  { id: "4", name: "Точка 4", blockId: "2" },
  { id: "5", name: "Точка 5", blockId: "3" },
  { id: "6", name: "Точка 6", blockId: "4" },
];
