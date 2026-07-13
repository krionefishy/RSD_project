import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Info,
  ListChecks,
  MapPinned,
} from "lucide-react";
import { AppHeader } from "../AppHeader";
import type { AdminInstruction, InstructionNotice } from "../../data/adminInstructions";

interface InstructionsPageProps {
  backTo: string;
  roleLabel: string;
  instructions: AdminInstruction[];
  grouped?: boolean;
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Info; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">
        <Icon size={16} color="#2E7D32" />
      </span>
      <h3 className="text-[14px] font-semibold text-slate-800">{children}</h3>
    </div>
  );
}

function Notice({ notice }: { notice: InstructionNotice }) {
  const isWarning = notice.tone === "warning";
  const Icon = isWarning ? AlertTriangle : CircleHelp;

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: isWarning ? "#FFFBEB" : "#F8FAFC",
        borderColor: isWarning ? "#FDE68A" : "#E2E8F0",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={17} color={isWarning ? "#D97706" : "#64748B"} />
        <p className="text-[13px] font-semibold text-slate-800">{notice.title}</p>
      </div>
      <div className="flex flex-col gap-2">
        {notice.items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <span
              className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ background: isWarning ? "#D97706" : "#64748B" }}
            />
            <p className="text-[13px] leading-[1.55] text-slate-600">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstructionCard({
  instruction,
  number,
  isOpen,
  onToggle,
}: {
  instruction: AdminInstruction;
  number: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const sectionId = instruction.section ? `-${instruction.section.replace(/\s+/g, "-")}` : "";
  const contentId = `instruction-${instruction.id}${sectionId}`;

  return (
    <article
      className="overflow-hidden rounded-2xl border bg-white"
      style={{
        borderColor: isOpen ? "#A7D7B1" : "#E2E8F0",
        boxShadow: isOpen ? "0 8px 24px rgba(46, 125, 50, 0.09)" : "0 2px 8px rgba(15, 23, 42, 0.04)",
      }}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 p-4 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: isOpen ? "#2E7D32" : "#E8F5E9", color: isOpen ? "#fff" : "#2E7D32" }}
        >
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-slate-800">{instruction.title}</span>
          <span className="mt-1.5 block text-[12px] leading-[1.45] text-slate-500">{instruction.summary}</span>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            <ListChecks size={12} />
            {instruction.steps.length} шагов
          </span>
        </span>
        <ChevronDown
          size={20}
          color="#64748B"
          className="mt-1 flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <div id={contentId} className="border-t border-slate-100 px-4 pb-4 pt-4">
          <div className="flex flex-col gap-4">
            <section>
              <SectionTitle icon={MapPinned}>Как открыть</SectionTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {instruction.path.map((item, index) => (
                  <div key={`${instruction.id}-${item}`} className="contents">
                    <span className="rounded-lg bg-[#E8F5E9] px-2.5 py-1.5 text-[12px] font-semibold text-[#236528]">
                      {item}
                    </span>
                    {index < instruction.path.length - 1 && <ChevronRight size={14} color="#94A3B8" />}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-slate-50 p-4">
              <SectionTitle icon={Info}>Что здесь можно сделать</SectionTitle>
              <p className="text-[13px] leading-[1.6] text-slate-600">{instruction.purpose}</p>
            </section>

            <section>
              <SectionTitle icon={CheckCircle2}>Как выполнить</SectionTitle>
              <ol className="flex flex-col gap-2.5">
                {instruction.steps.map((step, index) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 text-[13px] leading-[1.55] text-slate-700">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            {instruction.notices?.map((notice) => (
              <Notice key={notice.title} notice={notice} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

interface InstructionGroupsProps {
  instructions: AdminInstruction[];
  grouped?: boolean;
}

export function InstructionGroups({ instructions, grouped = false }: InstructionGroupsProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() =>
    new Set(grouped ? [] : instructions[0] ? [instructions[0].id] : []),
  );
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set());

  const sections = Array.from(new Set(instructions.map((instruction) => instruction.section ?? ""))).map((section) => ({
    section: section || undefined,
    items: instructions.filter((instruction) => (instruction.section ?? "") === section),
  }));

  const toggleInstruction = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  if (!grouped) {
    return (
      <div className="flex flex-col gap-3">
        {instructions.map((instruction, index) => {
          const previousSection = instructions[index - 1]?.section;
          const showSection = Boolean(instruction.section && instruction.section !== previousSection);

          return (
            <div key={`${instruction.section ?? "general"}-${instruction.id}`} className="flex flex-col gap-3">
              {showSection && (
                <div className="mt-3 flex items-center gap-2 first:mt-0">
                  <span className="h-px flex-1 bg-slate-200" />
                  <p className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                    {instruction.section}
                  </p>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}
              <InstructionCard
                instruction={instruction}
                number={index + 1}
                isOpen={openIds.has(instruction.id)}
                onToggle={() => toggleInstruction(instruction.id)}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map(({ section, items }, sectionIndex) => {
        const sectionKey = section ?? `section-${sectionIndex}`;
        const isOpen = openSections.has(sectionKey);
        const sectionLabel = section ? `Инструкции функционала ${section}` : "Инструкции";

        return (
          <section
            key={sectionKey}
            className="overflow-hidden rounded-2xl border bg-white"
            style={{ borderColor: isOpen ? "#A7D7B1" : "#E2E8F0" }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left"
              aria-expanded={isOpen}
              onClick={() => toggleSection(sectionKey)}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <BookOpenCheck size={19} color="#2E7D32" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-snug text-slate-800">{sectionLabel}</span>
                <span className="mt-1 block text-[12px] text-slate-500">{items.length} инструкций</span>
              </span>
              <ChevronDown
                size={20}
                color="#64748B"
                className="flex-shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {isOpen && (
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-3">
                {items.map((instruction) => {
                  const number = instructions.indexOf(instruction) + 1;
                  return (
                    <InstructionCard
                      key={`${sectionKey}-${instruction.id}`}
                      instruction={instruction}
                      number={number}
                      isOpen={openIds.has(instruction.id)}
                      onToggle={() => toggleInstruction(instruction.id)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function InstructionsPage({ backTo, roleLabel, instructions, grouped = false }: InstructionsPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader title="Инструкции" showBack backTo={backTo} white />

      <div className="px-4 py-4">
        <div
          className="rounded-2xl p-4 text-white"
          style={{ background: "linear-gradient(145deg, #2E7D32 0%, #1B5E20 100%)" }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
              <BookOpenCheck size={22} />
            </span>
            <div>
              <p className="text-[16px] font-semibold">Помощь по рабочим действиям</p>
              <p className="mt-1 text-[12px] leading-[1.5] text-white/75">{roleLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-[1.5] text-white/80">
            Выберите нужное действие. Каждую инструкцию можно раскрыть и свернуть отдельно.
          </p>
        </div>

        <div className="mb-3 mt-5 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-slate-800">Все инструкции</p>
          <span className="rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#2E7D32]">
            {instructions.length}
          </span>
        </div>

        <InstructionGroups instructions={instructions} grouped={grouped} />
      </div>
    </div>
  );
}
