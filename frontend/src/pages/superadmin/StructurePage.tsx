import { useState } from "react";
import { Building2, Users, Plus, MoreVertical, ChevronDown } from "lucide-react";
import { AppHeader } from "../../components/AppHeader";

interface Block {
  id: string;
  name: string;
  stores: number;
  employees: number;
  manager: string;
  expanded?: boolean;
  storesList?: { name: string; address: string; employees: number }[];
}

const blocksData: Block[] = [
  {
    id: "1",
    name: "Центр",
    stores: 12,
    employees: 38,
    manager: "Алексей Смирнов",
    expanded: false,
    storesList: [
      { name: "ТЦ Метрополис", address: "Ленинградское ш., 16", employees: 8 },
      { name: "ТЦ Европарк", address: "Рублёвское ш., 62", employees: 6 },
      { name: "ТЦ Крокус Сити", address: "66 км МКАД", employees: 10 },
    ],
  },
  {
    id: "2",
    name: "Юг",
    stores: 11,
    employees: 35,
    manager: "Мария Козлова",
    expanded: false,
    storesList: [
      { name: "ТЦ Вегас", address: "Каширское ш., 61", employees: 9 },
      { name: "ТЦ Мега", address: "Киевское ш., 23 км", employees: 7 },
    ],
  },
  { id: "3", name: "Север", stores: 10, employees: 32, manager: "Иван Петров", expanded: false },
  { id: "4", name: "Запад", stores: 8, employees: 22, manager: "Ольга Васильева", expanded: false },
  { id: "5", name: "Восток", stores: 6, employees: 15, manager: "Сергей Новиков", expanded: false },
];

export default function SuperAdminStructurePage() {
  const [blocks, setBlocks] = useState(blocksData);

  const toggleBlock = (id: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, expanded: !b.expanded } : b));
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <AppHeader title="Структура сети" showBack white />

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Building2 size={24} color="#C41E3A" className="mx-auto mb-2" />
            <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>47</p>
            <p style={{ color: "#64748B", fontSize: 12 }}>Точек</p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Users size={24} color="#2E7D32" className="mx-auto mb-2" />
            <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>5</p>
            <p style={{ color: "#64748B", fontSize: 12 }}>Блоков</p>
          </div>
        </div>

        <button className="w-full h-11 rounded-[10px] flex items-center justify-center gap-2" style={{ background: "#C41E3A", color: "#fff", fontSize: 14, fontWeight: 600 }}>
          <Plus size={18} />
          Добавить блок
        </button>

        <div className="flex flex-col gap-2">
          {blocks.map((block) => (
            <div key={block.id} className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-3 px-4 py-4">
                <button onClick={() => toggleBlock(block.id)} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#FCE4EC" }}>
                  <ChevronDown size={18} color="#C41E3A" className={block.expanded ? "rotate-180" : ""} style={{ transition: "transform 0.2s" }} />
                </button>
                <div className="flex-1">
                  <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600 }}>{block.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 12 }}>{block.stores} точек · {block.employees} сотрудников</p>
                  <p style={{ color: "#64748B", fontSize: 11 }}>Руководитель: {block.manager}</p>
                </div>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                  <MoreVertical size={16} color="#64748B" />
                </button>
              </div>

              {block.expanded && block.storesList && (
                <div className="px-4 pb-4">
                  <div className="rounded-xl overflow-hidden" style={{ background: "#F8FAFC" }}>
                    {block.storesList.map((store, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-3" style={{ borderBottom: i < block.storesList!.length - 1 ? "1px solid #E2E8F0" : "none" }}>
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
          ))}
        </div>
      </div>
    </div>
  );
}
