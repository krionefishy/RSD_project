import { useEffect, useState } from "react";
import { LocationsAPI } from "../api/LocationsAPI";
import type { BlockSummary, LocationSummary } from "../types/location";
import { isAbortError } from "../utils/errors";

export interface StructureBlockOption {
  id: string;
  name: string;
}

export interface StructureLocationOption {
  id: string;
  name: string;
  blockId: string;
}

export function useStructureOptions() {
  const [blocks, setBlocks] = useState<StructureBlockOption[]>([]);
  const [locations, setLocations] = useState<StructureLocationOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [blocksData, locationsData] = await Promise.all([
          LocationsAPI.listBlocks(undefined, controller.signal),
          LocationsAPI.listLocations(undefined, controller.signal),
        ]);
        setBlocks(blocksData.map((block: BlockSummary) => ({ id: block.id, name: block.name })));
        setLocations(
          locationsData
            .filter((location: LocationSummary) => location.blockId)
            .map((location: LocationSummary) => ({
              id: location.id,
              name: location.name,
              blockId: location.blockId!,
            })),
        );
      } catch (error) {
        if (isAbortError(error)) return;
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  return { blocks, locations, loading };
}
