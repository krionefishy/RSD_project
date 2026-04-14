import React from "react";
import { useNavigate } from "react-router";
import { Briefcase, MessageSquare, Package, ClipboardList, ChevronRight } from "lucide-react";
import { knowledgeSections } from "../../mock/mockData";

const ICONS: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase size={26} />,
  MessageSquare: <MessageSquare size={26} />,
  Package: <Package size={26} />,
  ClipboardList: <ClipboardList size={26} />,
};

export default function KnowledgeBasePage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="px-4 pt-6 pb-5"
        style={{ background: "linear-gradient(160deg, #1A56DB 0%, #1248BA 100%)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>Обучение</p>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 2 }}>База знаний</h1>

        {/* Overall progress */}
        <div
          className="mt-4 rounded-xl p-3 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <div>
            <p style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Общий прогресс обучения</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Пройдено 29 из 50 материалов</p>
          </div>
          <div className="ml-auto">
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>58%</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 12 }}>Разделы базы знаний</p>

        <div className="grid grid-cols-2 gap-3">
          {knowledgeSections.map((section) => (
            <button
              key={section.id}
              onClick={() => navigate(`/seller/knowledge/${section.id}`)}
              className="rounded-2xl p-4 text-left"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ background: section.bg, color: section.color }}
              >
                {ICONS[section.icon]}
              </div>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>
                {section.title}
              </p>
              <p style={{ color: "#94A3B8", fontSize: 12, marginBottom: 8 }}>
                {section.count} материалов
              </p>
              {/* Progress */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${section.progress}%`, background: section.color }}
                />
              </div>
              <p style={{ color: section.color, fontSize: 11, fontWeight: 600, marginTop: 4 }}>
                {section.progress}%
              </p>
            </button>
          ))}
        </div>

        {/* Assigned tests section */}
        <div className="mt-4">
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 12 }}>Назначенные тесты</p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            {[
              { title: "Регламенты работы точки", deadline: "20.04.2026", color: "#F59E0B", bgColor: "#FFFBEB" },
              { title: "Техника продаж (повтор)", deadline: "18.04.2026", color: "#EF4444", bgColor: "#FEF2F2" },
              { title: "Знание ассортимента 2024", deadline: "25.04.2026", color: "#1A56DB", bgColor: "#EFF6FF" },
            ].map((test, i) => (
              <button
                key={i}
                onClick={() => navigate("/seller/tests")}
                className="w-full flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < 2 ? "1px solid #F1F5F9" : "none" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: test.bgColor }}
                >
                  <ClipboardList size={15} color={test.color} />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{test.title}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>До {test.deadline}</p>
                </div>
                <ChevronRight size={16} color="#CBD5E1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
