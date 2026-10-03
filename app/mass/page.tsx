"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Child = {
  id: number;
  name: string;
  team_id: number;
};

type Team = {
  id: number;
  name: string;
};

type MassAttendance = {
  child_id: number;
  mass_week_start: string;
};

export default function MassPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [massAttendance, setMassAttendance] = useState<
    MassAttendance[]
  >([]);

  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] =
    useState<Child | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const [weekStart, setWeekStart] = useState("");
  const [showPresent, setShowPresent] = useState(false);
const [showAbsent, setShowAbsent] = useState(false);

  useEffect(() => {
    const currentWeekStart = getMassWeekStart();

    setWeekStart(currentWeekStart);
    loadData(currentWeekStart);
  }, []);

  // الجمعة هي بداية أسبوع القداس
  function getMassWeekStart() {
    const today = new Date();
    const day = today.getDay();

    // الأحد = 0
    // الإثنين = 1
    // الثلاثاء = 2
    // الأربعاء = 3
    // الخميس = 4
    // الجمعة = 5
    // السبت = 6

    const daysSinceFriday = (day + 2) % 7;

    const friday = new Date(today);

    friday.setDate(
      today.getDate() - daysSinceFriday
    );

    return formatDate(friday);
  }

  function formatDate(date: Date) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getWeekEnd(startDate: string) {
    const date = new Date(
      `${startDate}T00:00:00`
    );

    date.setDate(
      date.getDate() + 6
    );

    return formatDate(date);
  }

  async function loadData(currentWeek: string) {
    setLoading(true);
    setMessage("");

    try {
      // تحميل الأطفال
      const {
        data: childrenData,
        error: childrenError,
      } = await supabase
        .from("children")
        .select("id, name, team_id")
        .order("name");

      if (childrenError) {
        console.error(
          "GET CHILDREN ERROR:",
          JSON.stringify(
            childrenError,
            null,
            2
          )
        );

        setMessage(
          "حصل خطأ أثناء تحميل الأطفال"
        );

        return;
      }

      // تحميل الفرق
      const {
        data: teamsData,
        error: teamsError,
      } = await supabase
        .from("teams")
        .select("id, name")
        .order("id");

      if (teamsError) {
        console.error(
          "GET TEAMS ERROR:",
          JSON.stringify(
            teamsError,
            null,
            2
          )
        );

        setMessage(
          "حصل خطأ أثناء تحميل الفرق"
        );

        return;
      }

      // تحميل حضور القداس للأسبوع الحالي
      const {
        data: massData,
        error: massError,
      } = await supabase
        .from("mass_attendance")
        .select(
          "child_id, mass_week_start"
        )
        .eq(
          "mass_week_start",
          currentWeek
        );

      if (massError) {
        console.error(
          "GET MASS ERROR:",
          JSON.stringify(
            massError,
            null,
            2
          )
        );

        setMessage(
          "حصل خطأ أثناء تحميل حضور القداس"
        );

        return;
      }

      setChildren(
        childrenData || []
      );

      setTeams(
        teamsData || []
      );

      setMassAttendance(
        massData || []
      );
    } catch (error) {
      console.error(
        "LOAD MASS DATA ERROR:",
        error
      );

      setMessage(
        "حصل خطأ أثناء تحميل بيانات القداس"
      );
    } finally {
      setLoading(false);
    }
  }

  function getTeamName(teamId: number) {
    return (
      teams.find(
        (team) => team.id === teamId
      )?.name || "بدون فريق"
    );
  }

  function hasAttendedMass(
    childId: number
  ) {
    return massAttendance.some(
      (item) =>
        item.child_id === childId &&
        item.mass_week_start === weekStart
    );
  }

  function getPointsFromPercentage(
    percentage: number
  ) {
    if (percentage >= 80) {
      return 100;
    }

    if (percentage >= 60) {
      return 70;
    }

    if (percentage >= 40) {
      return 40;
    }

    return 0;
  }

  async function updateMassPoints(
    teamId: number,
    currentWeek: string
  ) {
    // أطفال الفريق
    const {
      data: teamChildren,
      error: teamChildrenError,
    } = await supabase
      .from("children")
      .select("id")
      .eq(
        "team_id",
        teamId
      );

    if (teamChildrenError) {
      throw teamChildrenError;
    }

    const totalChildren =
      teamChildren?.length || 0;

    if (totalChildren === 0) {
      return {
        percentage: 0,
        points: 0,
        total: 0,
      };
    }

    // IDs أطفال الفريق
    const childIds =
      teamChildren.map(
        (child) => child.id
      );

    // حضور أطفال الفريق في الأسبوع الحالي
    const {
      data: attendanceData,
      error: attendanceError,
    } = await supabase
      .from("mass_attendance")
      .select("child_id")
      .eq(
        "mass_week_start",
        currentWeek
      )
      .in(
        "child_id",
        childIds
      );

    if (attendanceError) {
      throw attendanceError;
    }

    const attendedChildren =
      attendanceData?.length || 0;

    const percentage =
      (attendedChildren /
        totalChildren) *
      100;

    const weekPoints =
      getPointsFromPercentage(
        percentage
      );

    // هل يوجد سجل نقاط لهذا الأسبوع؟
    const {
      data: currentWeekPoint,
      error: currentWeekPointError,
    } = await supabase
      .from("team_points")
      .select(
        "id, points"
      )
      .eq(
        "team_id",
        teamId
      )
      .eq(
        "type",
        "mass"
      )
      .eq(
        "activity_date",
        currentWeek
      )
      .maybeSingle();

    if (currentWeekPointError) {
      throw currentWeekPointError;
    }

    const reason =
      `قداس الأسبوع ${currentWeek} - ` +
      `${Math.round(
        percentage
      )}% حضور`;

    // لو سجل الأسبوع موجود → نحدثه
    if (currentWeekPoint) {
      const oldPoints =
        Number(
          currentWeekPoint.points || 0
        );

      const {
        error: updateError,
      } = await supabase
        .from("team_points")
        .update({
          points: weekPoints,
          reason,
        })
        .eq(
          "id",
          currentWeekPoint.id
        );

      if (updateError) {
        throw updateError;
      }

      // حساب إجمالي نقاط القداسات بعد التحديث
      const {
        data: allMassPoints,
        error: allMassPointsError,
      } = await supabase
        .from("team_points")
        .select("points")
        .eq(
          "team_id",
          teamId
        )
        .eq(
          "type",
          "mass"
        );

      if (allMassPointsError) {
        throw allMassPointsError;
      }

      const total =
        (allMassPoints || []).reduce(
          (sum, row) =>
            sum +
            Number(
              row.points || 0
            ),
          0
        );

      return {
        percentage,
        points: weekPoints,
        total,
        oldPoints,
      };
    }

    // أول تسجيل لهذا الأسبوع
    const {
      error: insertError,
    } = await supabase
      .from("team_points")
      .insert({
        team_id: teamId,
        points: weekPoints,
        type: "mass",
        reason,
        activity_date: currentWeek,
      });

    if (insertError) {
      throw insertError;
    }

    // إجمالي نقاط القداسات
    const {
      data: allMassPoints,
      error: allMassPointsError,
    } = await supabase
      .from("team_points")
      .select("points")
      .eq(
        "team_id",
        teamId
      )
      .eq(
        "type",
        "mass"
      );

    if (allMassPointsError) {
      throw allMassPointsError;
    }

    const total =
      (allMassPoints || []).reduce(
        (sum, row) =>
          sum +
          Number(
            row.points || 0
          ),
        0
      );

    return {
      percentage,
      points: weekPoints,
      total,
    };
  }

  async function registerMass() {
    if (!selectedChild) {
      setMessage(
        "اختار الطفل أولاً"
      );
      return;
    }

    if (
      hasAttendedMass(
        selectedChild.id
      )
    ) {
      setMessage(
        "الطفل دا متسجل في قداس الأسبوع ده بالفعل"
      );
      return;
    }

    setRegistering(true);
    setMessage("");

    try {
      // تسجيل حضور الطفل
      const {
        error: insertError,
      } = await supabase
        .from("mass_attendance")
        .insert({
          child_id:
            selectedChild.id,
          mass_week_start:
            weekStart,
        });

      if (insertError) {
        console.error(
          "MASS INSERT ERROR:",
          JSON.stringify(
            insertError,
            null,
            2
          )
        );

        if (
          insertError.code ===
          "23505"
        ) {
          setMessage(
            "الطفل دا متسجل في قداس الأسبوع ده بالفعل"
          );
        } else {
          setMessage(
            `حصل خطأ أثناء تسجيل القداس: ${insertError.message}`
          );
        }

        return;
      }

      // تحديث نقاط الفريق
      const result =
        await updateMassPoints(
          selectedChild.team_id,
          weekStart
        );

      // تحديث الحضور على الشاشة
      setMassAttendance(
        (prev) => [
          ...prev,
          {
            child_id:
              selectedChild.id,
            mass_week_start:
              weekStart,
          },
        ]
      );

      if (result) {
        setMessage(
          `تم تسجيل ${selectedChild.name} في القداس — نسبة فريقه ${Math.round(
            result.percentage
          )}% — نقاط الأسبوع: ${result.points}`
        );
      } else {
        setMessage(
          `تم تسجيل ${selectedChild.name} في القداس`
        );
      }

      // تصفير البحث
      setSelectedChild(null);
      setSearch("");
    } catch (error: any) {
      console.error(
        "MASS POINTS ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setMessage(
        `تم تسجيل الحضور لكن حصل خطأ في حساب النقاط: ${
          error?.message ||
          "خطأ غير معروف"
        }`
      );
    } finally {
      setRegistering(false);
    }
  }

  const filteredChildren =
    children.filter((child) =>
      child.name
        .toLowerCase()
        .includes(
          search
            .toLowerCase()
        )
    );

  const weekEnd =
    weekStart
      ? getWeekEnd(
          weekStart
        )
      : "";

  const currentWeekAttendance =
    massAttendance.length;
    const presentChildren = children.filter((child) =>
  hasAttendedMass(child.id)
);

const absentChildren = children.filter((child) =>
  !hasAttendedMass(child.id)
);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto w-full max-w-2xl">

        {/* Back Button */}
        <button
          type="button"
          onClick={() =>
            (window.location.href = "/servant/dashboard")
          }
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          ← رجوع للوحة التحكم
        </button>

        <p className="mb-2 text-sm text-blue-400">
          ماراثون الخدمة
        </p>

        <h1 className="text-3xl font-bold">
          حضور القداس
        </h1>

        <p className="mt-2 text-slate-400">
          قداس واحد كل أسبوع من الجمعة للخميس.
        </p>

        {/* الأسبوع الحالي */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <p className="text-sm text-slate-400">
            أسبوع القداس الحالي
          </p>

          <p className="mt-2 text-xl font-bold">
            الجمعة {weekStart}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            حتى الخميس {weekEnd}
          </p>

        </div>

        {/* عدد الحضور */}
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <p className="text-sm text-slate-400">
            عدد حضور القداس هذا الأسبوع
          </p>

          <p className="mt-1 text-3xl font-bold text-purple-400">
            {currentWeekAttendance}
          </p>

        </div>

        </div>  




{/* التسجيل */}
<div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">

        {/* التسجيل */}
        <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">

          <label className="mb-2 block text-sm text-slate-300">
            اسم الطفل
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );
              setSelectedChild(
                null
              );
              setMessage("");
            }}
            placeholder="اكتب اسم الطفل للبحث..."
            disabled={registering}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          />

          {/* نتائج البحث */}
          {search.trim() &&
            !selectedChild && (
              <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950">

                {loading ? (
                  <p className="p-4 text-center text-slate-400">
                    جاري تحميل الأطفال...
                  </p>
                ) : filteredChildren.length ===
                  0 ? (
                  <p className="p-4 text-center text-slate-400">
                    مفيش طفل بالاسم ده
                  </p>
                ) : (
                  filteredChildren.map(
                    (child) => (
                      <button
                        key={
                          child.id
                        }
                        type="button"
                        onClick={() => {
                          setSelectedChild(
                            child
                          );
                          setMessage("");
                        }}
                        disabled={
                          registering
                        }
                        className="flex w-full items-center justify-between border-b border-slate-800 px-4 py-3 text-right transition last:border-b-0 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div>
                          <p className="font-semibold">
                            {
                              child.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            الفريق:{" "}
                            {getTeamName(
                              child.team_id
                            )}
                          </p>
                        </div>

                        {hasAttendedMass(
                          child.id
                        ) ? (
                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                            حضر
                          </span>
                        ) : (
                          <span className="text-sm text-purple-400">
                            اختيار
                          </span>
                        )}
                      </button>
                    )
                  )
                )}

              </div>
            )}

          {/* الطفل المختار */}
          {selectedChild && (
            <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">

              <p className="text-sm text-slate-400">
                الطفل المختار
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {
                  selectedChild.name
                }
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                الفريق:{" "}
                {getTeamName(
                  selectedChild.team_id
                )}
              </p>

              {hasAttendedMass(
                selectedChild.id
              ) ? (
                <div className="mt-4 rounded-xl bg-green-500/10 p-3 text-center font-bold text-green-400">
                  الطفل دا حضر قداس الأسبوع ده بالفعل
                </div>
              ) : (
                <button
                  type="button"
                  onClick={
                    registerMass
                  }
                  disabled={
                    registering
                  }
                  className="mt-5 w-full rounded-xl bg-purple-600 py-3 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {registering
                    ? "جاري تسجيل القداس..."
                    : "تسجيل حضور القداس"}
                </button>
              )}

            </div>
          )}

          {/* الرسالة */}
          {message && (
            <div
              className={`mt-5 rounded-xl border p-4 text-center text-sm font-semibold ${
                message.includes(
                  "تم تسجيل"
                )
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              {message}
            </div>
          )}

{/* قائمة حضور وغياب القداس */}

<div className="mt-5 space-y-4">

  {/* الحاضرين */}
  <button
    type="button"
    onClick={() => setShowPresent(!showPresent)}
    className="flex w-full items-center justify-between rounded-2xl border border-green-500/30 bg-green-500/10 p-4"
  >
    <span className="font-bold text-green-400">
      ✅ حضروا القداس ({presentChildren.length})
    </span>

    <span>
      {showPresent ? "▲" : "▼"}
    </span>

  </button>


  {showPresent && (
    <div className="rounded-2xl bg-slate-950 p-4">

      {presentChildren.map((child)=>(
        <div
          key={child.id}
          className="mb-2 rounded-xl bg-slate-900 p-3"
        >
          {child.name}
        </div>
      ))}

    </div>
  )}



  {/* الغائبين */}
  <button
    type="button"
    onClick={() => setShowAbsent(!showAbsent)}
    className="flex w-full items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 p-4"
  >

    <span className="font-bold text-red-400">
      ❌ لم يحضروا القداس ({absentChildren.length})
    </span>

    <span>
      {showAbsent ? "▲" : "▼"}
    </span>

  </button>


  {showAbsent && (
    <div className="rounded-2xl bg-slate-950 p-4">

      {absentChildren.map((child)=>(
        <div
          key={child.id}
          className="mb-2 rounded-xl bg-slate-900 p-3"
        >
          {child.name}
        </div>
      ))}

    </div>
  )}

</div>

        </div>

      </div>
    </main>
  );
}