"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ==========================================
// Types & Interfaces
// ==========================================
type Team = {
  id: number;
  name: string;
};

type Child = {
  id: number;
  team_id: number;
};

type TeamPoint = {
  team_id: number;
  points: number;
};

type RankingTeam = {
  id: number;
  name: string;
  points: number;
  childrenCount: number;
};

type UserData = {
  id: number;
  name: string;
  type: "servant" | "child";
  gender?: "male" | "female";
  role?: "servant" | "admin";
};

export default function ServantDashboard() {
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [teams, setTeams] = useState<RankingTeam[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<RankingTeam[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [totalChildren, setTotalChildren] = useState<number>(0);
  const [todayAttendance, setTodayAttendance] = useState<number>(0);
  const [totalConfessions, setTotalConfessions] = useState<number>(0);
  const [totalPsalmRecitations, setTotalPsalmRecitations] = useState<number>(0);

  const [servantName, setServantName] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // ==========================================
  // Fetch Data Function
  // ==========================================
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const userData = localStorage.getItem("marathon_user");

      // 1. Validation & Auth Check
      if (!userData) {
        router.replace("/");
        return;
      }

      const user: UserData = JSON.parse(userData);

      if (user.role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }

      if (user.type !== "servant") {
        router.replace("/");
        return;
      }

      setServantName(user.name || "خادم");
      setGender(user.gender === "female" ? "female" : "male");

      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Africa/Cairo",
      });

      // 2. Parallel Data Fetching with Optimized Queries
      const [
        teamsRes,
        childrenRes,
        pointsRes,
        attendanceRes,
        confessionRes,
        psalmRes,
      ] = await Promise.all([
        supabase.from("teams").select("id, name").order("id"),
        supabase.from("children").select("id, team_id"),
        supabase.from("team_points").select("team_id, points"),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("attendance_date", today),
        supabase
          .from("confessions")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("psalm_recitations")
          .select("id", { count: "exact", head: true }),
      ]);

      // Check for fetch errors
      if (teamsRes.error) throw new Error(teamsRes.error.message);
      if (childrenRes.error) throw new Error(childrenRes.error.message);
      if (pointsRes.error) throw new Error(pointsRes.error.message);

      // Data Assignment
      const childrenData: Child[] = childrenRes.data || [];
      const pointsData: TeamPoint[] = pointsRes.data || [];
      const teamsData: Team[] = teamsRes.data || [];

      setTotalChildren(childrenData.length);
      setTodayAttendance(attendanceRes.count || 0);
      setTotalConfessions(confessionRes.count || 0);
      setTotalPsalmRecitations(psalmRes.count || 0);

      // 3. Process & Rank Teams Efficiently (O(N) aggregation)
      const pointsMap = new Map<number, number>();
      pointsData.forEach((p) => {
        pointsMap.set(
          p.team_id,
          (pointsMap.get(p.team_id) || 0) + Number(p.points || 0)
        );
      });

      const childrenMap = new Map<number, number>();
      childrenData.forEach((c) => {
        childrenMap.set(c.team_id, (childrenMap.get(c.team_id) || 0) + 1);
      });

      const ranking: RankingTeam[] = teamsData.map((team) => ({
        id: team.id,
        name: team.name,
        points: pointsMap.get(team.id) || 0,
        childrenCount: childrenMap.get(team.id) || 0,
      }));

      // Sort Descending by Points
      ranking.sort((a, b) => b.points - a.points);

      setTeams(ranking);
      setFilteredTeams(ranking);
    } catch (err: unknown) {
      console.error("DASHBOARD FETCH ERROR:", err);
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("حدث خطأ غير متوقع أثناء تحميل البيانات.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial Load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Handle Search Filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTeams(teams);
    } else {
      const filtered = teams.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTeams(filtered);
    }
  }, [searchQuery, teams]);

  // Actions
  function logout() {
    localStorage.removeItem("marathon_user");
    router.replace("/");
  }

  function goTo(path: string) {
    setMenuOpen(false);
    router.push(path);
  }

  const greeting =
    gender === "female"
      ? `أهلاً يا تاسوني ${servantName}`
      : `أهلاً يا أستاذ ${servantName}`;

  // ==========================================
  // Loading View
  // ==========================================
  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-6 text-white">
        <div className="flex min-h-[90vh] flex-col items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <h2 className="mt-4 text-lg font-bold">جاري تحميل البيانات...</h2>
          <p className="mt-1 text-xs text-slate-400">يرجى الانتظار لحظات</p>
        </div>
      </main>
    );
  }

  // ==========================================
  // Render Main Component
  // ==========================================
  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto border-l border-slate-800 bg-slate-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-400">ماراثون الخدمة</p>
                <h2 className="mt-1 font-bold text-white">قائمة الخادم</h2>
                <p className="mt-1 text-xs text-slate-400">{servantName}</p>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <SidebarNavigation goTo={goTo} logout={logout} />
          </div>
        </div>
      )}

      {/* Desktop Permanent Sidebar */}
      <aside className="fixed right-0 top-0 hidden h-screen w-64 overflow-y-auto border-l border-slate-800 bg-slate-900 p-5 lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-400">ماراثون الخدمة</p>
          <h2 className="mt-1 text-xl font-bold text-white">لوحة الخادم</h2>
          <p className="mt-1 truncate text-xs text-slate-400">{servantName}</p>
        </div>

        <SidebarNavigation goTo={goTo} logout={logout} />
      </aside>

      {/* Content Wrapper */}
      <div className="lg:mr-64">
        {/* Mobile Header Bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur-md lg:hidden">
          <div>
            <p className="text-xs text-blue-400">ماراثون الخدمة</p>
            <p className="font-bold">لوحة الخادم</p>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold active:bg-slate-800"
          >
            ☰ القائمة
          </button>
        </div>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            {/* Error Notification Banner */}
            {errorMsg && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
                <p className="font-bold">⚠️ تعذر تحميل بعض البيانات:</p>
                <p className="mt-1 text-sm">{errorMsg}</p>
              </div>
            )}

            {/* Header Greeting */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                  لوحة المتابعة
                </p>
                <h1 className="text-2xl font-bold sm:text-3xl">{greeting}</h1>
                <p className="mt-1 text-sm text-slate-400">
                  تابع الإحصائيات وترتيب الفرق والإجراءات السريعة.
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="hidden rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800 sm:block"
              >
                تسجيل خروج
              </button>
            </div>

            {/* 1. Stat Cards Grid */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                title="إجمالي الأطفال"
                value={totalChildren}
                subtitle="طفل مسجل"
                icon="👦"
              />
              <StatCard
                title="حضور اليوم"
                value={todayAttendance}
                subtitle="طفل حاضر"
                icon="📋"
              />
              <StatCard
                title="الاعترافات"
                value={totalConfessions}
                subtitle="جلسة مسجلة"
                icon="✝️"
              />
              <StatCard
                title="تسميع المزمور"
                value={totalPsalmRecitations}
                subtitle="تسميع مقبول"
                icon="📖"
              />
            </div>

            {/* 2. Quick Actions Grid */}
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
              <div className="mb-4">
                <p className="text-xs text-blue-400">الوصول السريع</p>
                <h2 className="text-lg font-bold">تسجيل ورصد الخدمات</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <QuickAction
                  icon="📋"
                  title="تسجيل الحضور"
                  onClick={() => goTo("/attendance")}
                />
                <QuickAction
                  icon="⛪"
                  title="حضور القداس"
                  onClick={() => goTo("/mass")}
                />
                <QuickAction
                  icon="✝️"
                  title="الاعتراف"
                  onClick={() => goTo("/confession")}
                />
                <QuickAction
                  icon="📖"
                  title="تسميع المزمور"
                  onClick={() => goTo("/psalm")}
                />
                <QuickAction
                  icon="⭐"
                  title="تعديل النقاط"
                  onClick={() => goTo("/points")}
                />
              </div>
            </div>

            {/* 3. Team Ranking Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-blue-400">المنافسة الحالية</p>
                  <h2 className="text-xl font-bold sm:text-2xl">جدول ترتيب الفرق</h2>
                </div>

                {/* Search Box */}
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="بحث عن اسم فريق..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {filteredTeams.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">
                  <p className="text-slate-400">
                    {searchQuery ? "لا توجد نتائج تطابق بحثك." : "لا توجد فرق مسجلة بعد."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTeams.map((team, index) => (
                    <div
                      key={team.id}
                      className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition ${
                        index === 0
                          ? "border-yellow-600/40 bg-yellow-950/20"
                          : index === 1
                          ? "border-slate-500/40 bg-slate-800/20"
                          : index === 2
                          ? "border-amber-700/40 bg-amber-950/20"
                          : "border-slate-800 bg-slate-950"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Position Badge */}
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            index === 0
                              ? "border border-yellow-500/30 bg-yellow-500/20 text-yellow-400"
                              : index === 1
                              ? "border border-slate-400/30 bg-slate-400/20 text-slate-300"
                              : index === 2
                              ? "border border-amber-600/30 bg-amber-600/20 text-amber-400"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${index + 1}`}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-100">
                            {team.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {team.childrenCount} طفل مسجل
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-left">
                        <span className="text-xl font-black text-blue-400 sm:text-2xl">
                          {team.points}
                        </span>
                        <span className="mr-1 text-xs text-slate-400">نقطة</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Refresh Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={loadDashboard}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-500 active:scale-[0.99]"
              >
                <span>🔄</span>
                <span>تحديث البيانات الآن</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// Sub-Component: StatCard
// ==========================================
function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-black sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

// ==========================================
// Sub-Component: QuickAction
// ==========================================
function QuickAction({
  icon,
  title,
  onClick,
}: {
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-center transition hover:border-blue-500/50 hover:bg-slate-800/80 active:scale-95"
    >
      <span className="text-2xl sm:text-3xl">{icon}</span>
      <span className="text-xs font-bold text-slate-200 sm:text-sm">{title}</span>
    </button>
  );
}

// ==========================================
// Sub-Component: SidebarNavigation
// ==========================================
function SidebarNavigation({
  goTo,
  logout,
}: {
  goTo: (path: string) => void;
  logout: () => void;
}) {
  const menuItems = [
    { name: "الرئيسية", path: "/servant/dashboard", icon: "🏠" },
    { name: "إضافة طفل جديد", path: "/add-child", icon: "➕" },
    { name: "إضافة فريق", path: "/add-team", icon: "👥" },
    { name: "رصد الحضور", path: "/attendance", icon: "📋" },
    { name: "حضور القداس", path: "/mass", icon: "⛪" },
    { name: "سر الاعتراف", path: "/confession", icon: "✝️" },
    { name: "تسميع المزمور", path: "/psalm", icon: "📖" },
    { name: "تعديل النقاط", path: "/points", icon: "⭐" },
  ];

  return (
    <nav className="space-y-1.5">
      {menuItems.map((item) => (
        <button
          key={item.path}
          type="button"
          onClick={() => goTo(item.path)}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white active:bg-slate-700"
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.name}</span>
        </button>
      ))}

      <div className="my-4 border-t border-slate-800" />

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 active:bg-red-500/20"
      >
        <span className="text-base">🚪</span>
        <span>تسجيل الخروج</span>
      </button>
    </nav>
  );
}