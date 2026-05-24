import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Camera } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Avatar } from "../../components/Avatar";
import { AdminStaffAPI } from "../../api/AdminStaffAPI";
import { PersonnelAPI } from "../../api/PersonnelAPI";
import { UserAPI } from "../../api/UserAPI";
import type { BlockMemberStatus, EmployeeCompensation, OwnTimesheetEntry, UserProfile } from "../../types/profile";
import { getErrorMessage, isAbortError } from "../../utils/errors";
import { toast } from "sonner";
import { useStructureOptions } from "../../hooks/useStructureOptions";

function profileDisplayName(profile: UserProfile): string {
  const parts = [profile.lastName, profile.firstName, profile.middleName].filter(Boolean);
  return parts.join(" ").trim() || profile.externalSystemId;
}

const inputStyle = { borderColor: "#E2E8F0", fontSize: 14 } as const;

export default function EmployeeDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { blocks: structureBlocks, locations: structureLocations } = useStructureOptions();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [compensation, setCompensation] = useState<EmployeeCompensation | null>(null);
  const [timesheetEntries, setTimesheetEntries] = useState<OwnTimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompensation, setSavingCompensation] = useState(false);
  const [savingEntryId, setSavingEntryId] = useState<number | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    position: "",
    locationId: "",
    blockId: "",
    blockMemberStatus: "primary" as BlockMemberStatus,
  });

  const locationOptions = profileForm.blockId
    ? structureLocations.filter((location) => location.blockId === profileForm.blockId)
    : structureLocations;

  const [compensationForm, setCompensationForm] = useState({
    baseSalary: "",
    hourlyRate: "",
    nightHourlyRate: "",
  });

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();

    async function load() {
      try {
        const [profileData, compensationData, timesheetData] = await Promise.all([
          UserAPI.getUserProfile(userId!, controller.signal),
          PersonnelAPI.getEmployeeCompensation(userId!, controller.signal),
          PersonnelAPI.getEmployeeTimesheet(
            userId!,
            { periodFrom: "2026-04-01", periodTo: "2026-04-30" },
            controller.signal,
          ).catch(() => null),
        ]);
        setProfile(profileData);
        setCompensation(compensationData);
        setTimesheetEntries(timesheetData?.items ?? []);
        setProfileForm({
          firstName: profileData.firstName ?? "",
          middleName: profileData.middleName ?? "",
          lastName: profileData.lastName ?? "",
          phone: profileData.phone ?? "",
          birthDate: profileData.birthDate ?? "",
          position: profileData.position ?? "",
          locationId: profileData.location?.id ? String(profileData.location.id) : "",
          blockId: profileData.block?.id ? String(profileData.block.id) : "",
          blockMemberStatus: profileData.blockMemberStatus ?? "primary",
        });
        if (compensationData) {
          setCompensationForm({
            baseSalary: compensationData.baseSalary,
            hourlyRate: compensationData.hourlyRate,
            nightHourlyRate: compensationData.nightHourlyRate ?? "",
          });
        }
      } catch (error) {
        if (isAbortError(error)) return;
        toast.error(getErrorMessage(error, "Не удалось загрузить профиль"));
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [userId]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    const blockChanged = profile?.block?.id ? String(profile.block.id) !== profileForm.blockId : Boolean(profileForm.blockId);
    const locationChanged = profile?.location?.id ? String(profile.location.id) !== profileForm.locationId : Boolean(profileForm.locationId);
    setSavingProfile(true);
    try {
      const updated = await AdminStaffAPI.updateEmployeeProfile(userId, {
        firstName: profileForm.firstName || undefined,
        middleName: profileForm.middleName || undefined,
        lastName: profileForm.lastName || undefined,
        phone: profileForm.phone || undefined,
        birthDate: profileForm.birthDate || undefined,
        position: profileForm.position || undefined,
        locationId: profileForm.locationId ? Number(profileForm.locationId) : null,
        blockId: profileForm.blockId ? Number(profileForm.blockId) : null,
        blockMemberStatus: blockChanged || locationChanged ? profileForm.blockMemberStatus : undefined,
      });
      setProfile(updated);
      toast.success("Профиль обновлён");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить профиль"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveTimeEntry = async (entry: OwnTimesheetEntry) => {
    setSavingEntryId(entry.id);
    try {
      const updated = await PersonnelAPI.updateTimeEntry(entry.id, {
        activityCode: entry.activityCode,
        hours: entry.hours,
        shiftType: entry.shiftType,
        comment: entry.comment,
      });
      setTimesheetEntries((items) => items.map((item) => (item.id === entry.id ? updated : item)));
      toast.success("Запись табеля сохранена");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить запись табеля"));
    } finally {
      setSavingEntryId(null);
    }
  };

  const handleSaveCompensation = async () => {
    if (!userId) return;
    setSavingCompensation(true);
    try {
      const updated = await AdminStaffAPI.upsertEmployeeCompensation(userId, {
        baseSalary: compensationForm.baseSalary,
        hourlyRate: compensationForm.hourlyRate,
        nightHourlyRate: compensationForm.nightHourlyRate || undefined,
      });
      setCompensation(updated);
      toast.success("Ставка сохранена");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось сохранить ставку"));
    } finally {
      setSavingCompensation(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!userId) return;
    try {
      const result = await AdminStaffAPI.uploadEmployeeAvatar(userId, file);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: result.avatarUrl } : prev));
      toast.success("Аватар обновлён");
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось загрузить аватар"));
    }
  };

  if (!userId) return null;

  const displayName = profile ? profileDisplayName(profile) : "Сотрудник";

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button
          onClick={() => navigate("/admin-personnel/manage")}
          className="flex items-center gap-1 mb-4"
          style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}
        >
          <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          Сотрудники
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar name={displayName} size={56} src={profile?.avatarUrl} />
            <span
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#fff" }}
            >
              <Camera size={14} color="#2E7D32" />
            </span>
          </button>
            <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatarChange(file);
              e.target.value = "";
            }}
          />
          <div>
            <p style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{displayName}</p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              {profile?.externalSystemId ?? (loading ? "Загрузка..." : "")}
            </p>
            {profile && (
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-full"
                style={{
                  background: profile.isActive ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {profile.isActive ? "Активен" : "Заблокирован"}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-8 text-center" style={{ color: "#64748B", fontSize: 14 }}>
          Загрузка...
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-4">
          <section className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              Профиль
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { key: "lastName", label: "Фамилия" },
                { key: "firstName", label: "Имя" },
                { key: "middleName", label: "Отчество" },
                { key: "phone", label: "Телефон" },
                { key: "birthDate", label: "Дата рождения", type: "date" },
                { key: "position", label: "Должность" },
              ].map((field) => (
                <label key={field.key} className="flex flex-col gap-1">
                  <span style={{ color: "#64748B", fontSize: 12 }}>{field.label}</span>
                  <input
                    type={field.type ?? "text"}
                    value={profileForm[field.key as keyof typeof profileForm]}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, [field.key]: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border"
                    style={inputStyle}
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Блок</span>
                <select
                  value={profileForm.blockId}
                  onChange={(e) => setProfileForm({ ...profileForm, blockId: e.target.value, locationId: "" })}
                  className="w-full h-10 px-3 rounded-lg border"
                  style={inputStyle}
                >
                  <option value="">Не назначен</option>
                  {structureBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span style={{ color: "#64748B", fontSize: 12 }}>Точка</span>
                <select
                  value={profileForm.locationId}
                  onChange={(e) => setProfileForm({ ...profileForm, locationId: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border"
                  style={inputStyle}
                >
                  <option value="">Не назначена</option>
                  {locationOptions.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full h-10 rounded-lg mt-4"
              style={{
                background: "#2E7D32",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                opacity: savingProfile ? 0.7 : 1,
              }}
            >
              {savingProfile ? "Сохранение..." : "Сохранить профиль"}
            </button>
          </section>

          <section className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              Табель сотрудника
            </h3>
            <p style={{ color: "#64748B", fontSize: 12, marginBottom: 12 }}>
              Редактируются часы, тип смены и комментарий. В файле табеля время начала и конца смены не хранится.
            </p>
            <div className="flex flex-col gap-2">
              {timesheetEntries.length === 0 ? (
                <div className="rounded-xl px-3 py-4 text-center" style={{ background: "#F8FAFC", color: "#64748B", fontSize: 13 }}>
                  Нет записей за выбранный период
                </div>
              ) : (
                timesheetEntries.map((entry) => (
                  <div key={entry.id} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
                    <div className="grid grid-cols-[1fr_88px] gap-2 mb-2">
                      <input
                        type="date"
                        value={entry.workDate}
                        readOnly
                        className="h-9 px-3 rounded-lg border bg-white"
                        style={inputStyle}
                      />
                      <input
                        value={entry.hours}
                        onChange={(e) =>
                          setTimesheetEntries((items) =>
                            items.map((item) => (item.id === entry.id ? { ...item, hours: e.target.value } : item)),
                          )
                        }
                        className="h-9 px-3 rounded-lg border bg-white"
                        style={inputStyle}
                        inputMode="decimal"
                        aria-label="Часы"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_96px] gap-2">
                      <input
                        value={entry.comment ?? ""}
                        onChange={(e) =>
                          setTimesheetEntries((items) =>
                            items.map((item) => (item.id === entry.id ? { ...item, comment: e.target.value } : item)),
                          )
                        }
                        placeholder={entry.activityName}
                        className="h-9 px-3 rounded-lg border bg-white"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        disabled={savingEntryId === entry.id}
                        onClick={() => void handleSaveTimeEntry(entry)}
                        className="h-9 rounded-lg"
                        style={{ background: "#2E7D32", color: "#fff", fontSize: 13, fontWeight: 600, opacity: savingEntryId === entry.id ? 0.7 : 1 }}
                      >
                        {savingEntryId === entry.id ? "..." : "Сохранить"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
              Ставка и оклад
            </h3>
            {compensation && (
              <div className="mb-3 p-3 rounded-lg" style={{ background: "#F8FAFC" }}>
                <p style={{ color: "#64748B", fontSize: 12 }}>
                  Эффективная ночная ставка:{" "}
                  <strong style={{ color: "#1E293B" }}>{compensation.effectiveNightHourlyRate}</strong>
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {[
                { key: "baseSalary", label: "Оклад (base_salary)" },
                { key: "hourlyRate", label: "Почасовая ставка" },
                { key: "nightHourlyRate", label: "Ночная ставка" },
              ].map((field) => (
                <label key={field.key} className="flex flex-col gap-1">
                  <span style={{ color: "#64748B", fontSize: 12 }}>{field.label}</span>
                  <input
                    value={compensationForm[field.key as keyof typeof compensationForm]}
                    onChange={(e) =>
                      setCompensationForm({ ...compensationForm, [field.key]: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-lg border"
                    style={inputStyle}
                  />
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveCompensation}
              disabled={savingCompensation}
              className="w-full h-10 rounded-lg mt-4"
              style={{
                background: "#2E7D32",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                opacity: savingCompensation ? 0.7 : 1,
              }}
            >
              {savingCompensation ? "Сохранение..." : "Сохранить ставку"}
            </button>
          </section>

          {profile?.block && profile.blockMemberStatus && (
            <section className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Блок: {profile.block.name}
              </h3>
              <p style={{ color: "#64748B", fontSize: 13, marginBottom: 12 }}>
                Текущий статус: {profile.blockMemberStatus === "primary" ? "Основа" : "Резерв"}
              </p>
              <button
                onClick={async () => {
                  if (!userId || !profile.block) return;
                  const next: BlockMemberStatus =
                    profile.blockMemberStatus === "primary" ? "reserve" : "primary";
                  try {
                    const updated = await AdminStaffAPI.changeBlockMemberStatus(userId, {
                      blockId: profile.block.id,
                      status: next,
                    });
                    setProfile(updated);
                    setProfileForm((f) => ({ ...f, blockMemberStatus: next }));
                    toast.success("Статус в блоке изменён");
                  } catch (error) {
                    toast.error(getErrorMessage(error, "Не удалось изменить статус"));
                  }
                }}
                className="w-full h-10 rounded-lg"
                style={{ background: "#F1F5F9", color: "#1E293B", fontSize: 14, fontWeight: 500 }}
              >
                Перевести в {profile.blockMemberStatus === "primary" ? "резерв" : "основу"}
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
