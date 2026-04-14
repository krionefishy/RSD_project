import { atom } from "jotai";

export type SalesTab = "daily" | "periodic";

export const activeTabAtom = atom<SalesTab>("daily");
