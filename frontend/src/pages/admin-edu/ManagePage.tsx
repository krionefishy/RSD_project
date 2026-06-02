import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { CoursesTab } from "./manage/CoursesTab";
import { MaterialsTab } from "./manage/MaterialsTab";
import { TestsTab } from "./manage/TestsTab";
type TabKey = "courses" | "materials" | "tests";

const TABS: { key: TabKey; label: string }[] = [
  { key: "courses", label: "Курсы" },
  { key: "materials", label: "Материалы" },
  { key: "tests", label: "Тесты" },
];

export default function AdminEduManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabKey =
    tabParam === "materials" || tabParam === "tests" ? tabParam : "courses";
  const [tab, setTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    if (tabParam === "courses" || tabParam === "materials" || tabParam === "tests") {
      setTab(tabParam);
    }
  }, [tabParam]);

  const selectTab = (key: TabKey) => {
    setTab(key);
    if (key === "courses") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: key });
    }
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}
      >
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>База знаний</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
          Курсы, материалы и тесты
        </p>
      </div>

      <div className="flex px-4 py-3 gap-2 overflow-x-auto" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => selectTab(item.key)}
            className="px-4 py-2 rounded-xl whitespace-nowrap"
            style={{
              background: tab === item.key ? "#C41E3A" : "#F1F5F9",
              color: tab === item.key ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: tab === item.key ? 600 : 400,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {tab === "courses" && <CoursesTab />}
        {tab === "materials" && <MaterialsTab />}
        {tab === "tests" && <TestsTab />}
      </div>
    </div>
  );
}
