import { atom } from "jotai";
import { AppUser } from "../types/user";

export type SalesTab = "daily" | "periodic";

export const activeTabAtom = atom<SalesTab>("daily");

export type AuthStatus = "idle" | "loading" | "ready" | "unauthenticated";

export const userAtom = atom<AppUser | null>(null);
export const authStatusAtom = atom<AuthStatus>("idle");
