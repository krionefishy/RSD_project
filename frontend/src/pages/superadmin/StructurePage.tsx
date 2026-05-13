import { useEffect, useState } from "react";
import { Building2, Users, Plus, MoreVertical, ChevronDown } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { SuperAdminAPI, Block, Location } from "../../api/SuperAdminAPI";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";

export default function SuperAdminStructurePage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [showCreateBlockModal, setShowCreateBlockModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      try {
        const [blocksData, locationsData] = await Promise.all([
          SuperAdminAPI.listBlocks(controller.signal),
          SuperAdminAPI.listLocations(controller.signal),
        ]);
        setBlocks(blocksData);
        setLocations(locationsData);
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить структуру сети"));
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, []);

  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateBlock = async () => {
    if (!newBlockName.trim()) {
      toast.error("Введите название блока");
      return;
    }
    try {
      const newBlock = await SuperAdminAPI.createBlock(newBlockName.trim());
      setBlocks([...blocks, newBlock]);
      setShowCreateBlockModal(false);
      setNewBlockName("");
      toast.success("Блок создан");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать блок"));
    }
  };

  const getBlockLocations = (blockId: string) => {
    return locations.filter(loc => loc.blockId === blockId);
  };

  const totalStores = locations.length;
  const totalEmployees = blocks.reduce((sum, b) => sum + b.employees, 0);

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Структура сети" showBack white />

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Building2 size={24} color="#C41E3A" className="mx-auto mb-2" />
            <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
              {loading ? "—" : totalStores}
            </p>
            <p style={{ color: "#64748B", fontSize: 12 }}>Точек</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Users size={24} color="#2E7D32" className="mx-auto mb-2" />
            <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
              {loading ? "—" : blocks.length}
            </p>
            <p style={{ color: "#64748B", fontSize: 12 }}>Блоков</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateBlockModal(true)}
          className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2"
          style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}
        >
          <Plus size={18} />
          Добавить блок
        </button>

        {loading ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Загрузка...</p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ color: "#64748B", fontSize: 14 }}>Нет блоков</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {blocks.map((block) => {
              const isExpanded = expandedBlocks.has(block.id);
              const blockLocations = getBlockLocations(block.id);

              return (
                <div key={block.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3 px-4 py-4">
                    <button onClick={() => toggleBlock(block.id)} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FCE4EC" }}>
                      <ChevronDown size={18} color="#C41E3A" className={isExpanded ? "rotate-180" : ""} style={{ transition: "transform 0.2s" }} />
                    </button>
                    <div className="flex-1">
                      <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>{block.name}</p>
                      <p style={{ color: "#94A3B8", fontSize: 12 }}>{block.stores} точек · {block.employees} сотрудников</p>
                      <p style={{ color: "#64748B", fontSize: 11 }}>Руководитель: {block.managerName || "Не назначен"}</p>
                    </div>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                      <MoreVertical size={16} color="#64748B" />
                    </button>
                  </div>

                  {isExpanded && blockLocations.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl overflow-hidden" style={{ background: "#F8FAFC" }}>
                        {blockLocations.map((store, i) => (
                          <div key={store.id} className="flex items-center gap-3 px-3 py-3" style={{ borderBottom: i < blockLocations.length - 1 ? "1px solid #E2E8F0" : "none" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E8F5E9" }}>
                              <Building2 size={14} color="#2E7D32" />
                            </div>
                            <div className="flex-1">
                              <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{store.name}</p>
                              <p style={{ color: "#94A3B8", fontSize: 11 }}>{store.address}</p>
                            </div>
                            <span style={{ color: "#64748B", fontSize: 12 }}>{store.employees} чел.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Block Modal */}
      {showCreateBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-4" style={{ background: "#fff" }}>
            <h3 style={{ color: "#1E293B", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Создание блока</h3>
            <input
              value={newBlockName}
              onChange={(e) => setNewBlockName(e.target.value)}
              placeholder="Название блока"
              className="w-full h-10 px-3 rounded-lg border"
              style={{ borderColor: "#E2E8F0", fontSize: 14 }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCreateBlockModal(false)}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#F1F5F9", color: "#64748B", fontSize: 14, fontWeight: 500 }}
              >
                Отмена
              </button>
              <button
                onClick={handleCreateBlock}
                className="flex-1 h-10 rounded-lg"
                style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 500 }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
