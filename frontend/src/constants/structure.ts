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
  { id: "1", name: "ТЦ Метрополис", blockId: "1" },
  { id: "2", name: "ТЦ Европарк", blockId: "1" },
  { id: "3", name: "ТЦ Крокус Сити", blockId: "1" },
  { id: "4", name: "ТЦ Рио", blockId: "2" },
  { id: "5", name: "ТЦ Вегас", blockId: "3" },
  { id: "6", name: "ТЦ Мега", blockId: "4" },
];
