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

type AttendanceRow = {
  child_id: number;
};

type TeamAttendancePoint = {
  id: number;
  points: number;
  activity_date: string;
};

export default function AttendancePage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] =
    useState<Child | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // تحديد تاريخ اليوم
  // =========================
  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  // =========================
  // هل اليوم جمعة؟
  // =========================
  function isFriday(date: Date) {
    return date.getDay() === 5;
  }

  // =========================
  // تحميل البيانات
  // =========================
  async function loadData() {
    setMessage("");

    const today = getToday();

    const [
      childrenResult,
      teamsResult,
      attendanceResult,
    ] = await Promise.all([
      supabase
        .from("children")
        .select("id, name, team_id")
        .order("name"),

      supabase
        .from("teams")
        .select("id, name")
        .order("id"),

      supabase
        .from("attendance")
        .select("child_id")
        .eq("attendance_date", today),
    ]);

    if (childrenResult.error) {
      console.error(
        "GET CHILDREN ERROR:",
        JSON.stringify(childrenResult.error, null, 2)
      );

      setMessage("حصل خطأ أثناء تحميل الأطفال");
      return;
    }

    if (teamsResult.error) {
      console.error(
        "GET TEAMS ERROR:",
        JSON.stringify(teamsResult.error, null, 2)
      );

      setMessage("حصل خطأ أثناء تحميل الفرق");
      return;
    }

    if (attendanceResult.error) {
      console.error(
        "GET ATTENDANCE ERROR:",
        JSON.stringify(attendanceResult.error, null, 2)
      );

      setMessage("حصل خطأ أثناء تحميل الحضور");
      return;
    }

    setChildren(childrenResult.data || []);
    setTeams(teamsResult.data || []);

    setTodayAttendance(
      (attendanceResult.data || []).map(
        (item: AttendanceRow) => item.child_id
      )
    );
  }

  // =========================
  // اسم الفريق
  // =========================
  function getTeamName(teamId: number) {
    return (
      teams.find((team) => team.id === teamId)?.name ||
      "بدون فريق"
    );
  }

  // =========================
  // تسجيل الحضور
  // =========================
  async function registerAttendance() {
    setMessage("");

    if (!selectedChild) {
      setMessage("اختار الطفل أولاً");
      return;
    }

    const today = getToday();
    const todayDate = new Date();

    // الخدمة يوم الجمعة فقط
    if (!isFriday(todayDate)) {
      setMessage(
        "تسجيل الحضور متاح يوم الجمعة فقط"
      );
      return;
    }

    // منع تكرار حضور الطفل في نفس اليوم
    if (todayAttendance.includes(selectedChild.id)) {
      setMessage(
        "الطفل ده متسجل حضور النهارده بالفعل"
      );
      return;
    }

    setLoading(true);

    try {
      // =========================
      // تسجيل حضور الطفل
      // =========================
      const { error: attendanceError } =
        await supabase
          .from("attendance")
          .insert({
            child_id: selectedChild.id,
            attendance_date: today,
          });

      if (attendanceError) {
        console.error(
          "ADD ATTENDANCE ERROR:",
          JSON.stringify(
            attendanceError,
            null,
            2
          )
        );

        if (attendanceError.code === "23505") {
          setMessage(
            "الطفل ده متسجل حضور النهارده بالفعل"
          );
        } else {
          setMessage(
            `حصل خطأ أثناء تسجيل الحضور: ${attendanceError.message}`
          );
        }

        return;
      }

      // =========================
      // تحديث حضور اليوم على الشاشة
      // =========================
      setTodayAttendance((prev) => [
        ...prev,
        selectedChild.id,
      ]);

      // =========================
      // تحديث نقاط الفريق
      // =========================
      const pointsResult =
        await updateAttendancePoints(
          selectedChild.team_id,
          today
        );

      if (!pointsResult) {
        setMessage(
          `تم تسجيل حضور ${selectedChild.name}، لكن حصل خطأ أثناء تحديث نقاط الفريق`
        );
      } else {
        setMessage(
          `تم تسجيل حضور ${selectedChild.name} بنجاح`
        );
      }

      setSelectedChild(null);
      setSearch("");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // حساب نقاط حضور الفريق
  // =========================
  async function updateAttendancePoints(
    teamId: number,
    activityDate: string
  ): Promise<boolean> {
    // جلب أطفال الفريق
    const {
      data: teamChildren,
      error: childrenError,
    } = await supabase
      .from("children")
      .select("id")
      .eq("team_id", teamId);

    if (childrenError) {
      console.error(
        "GET TEAM CHILDREN ERROR:",
        JSON.stringify(
          childrenError,
          null,
          2
        )
      );

      return false;
    }

    const totalChildren =
      teamChildren?.length || 0;

    if (totalChildren === 0) {
      return true;
    }

    const teamChildIds =
      (teamChildren || []).map(
        (child) => child.id
      );

    // =========================
    // جلب كل حضور الفريق
    // =========================
    const {
      data: allAttendance,
      error: attendanceError,
    } = await supabase
      .from("attendance")
      .select(
        "child_id, attendance_date"
      )
      .in(
        "child_id",
        teamChildIds
      );

    if (attendanceError) {
      console.error(
        "GET ALL ATTENDANCE ERROR:",
        JSON.stringify(
          attendanceError,
          null,
          2
        )
      );

      return false;
    }

    // =========================
    // نجيب كل أيام الخدمة
    // الموجودة في النظام
    // =========================
    const serviceDates = Array.from(
      new Set(
        (allAttendance || [])
          .map(
            (item) =>
              item.attendance_date
          )
          .filter((date) => {
            const d = new Date(
              `${date}T00:00:00`
            );

            return isFriday(d);
          })
      )
    );

    if (serviceDates.length === 0) {
      return true;
    }

    /*
      كل جمعة = فرصة كاملة لكل أطفال الفريق.

      مثال:
      10 أطفال
      2 جمع

      إجمالي الفرص = 20
    */

    const totalPossibleAttendance =
      totalChildren *
      serviceDates.length;

    // =========================
    // إجمالي الحضور الفعلي
    // =========================
    const totalActualAttendance =
      (allAttendance || []).filter(
        (item) =>
          serviceDates.includes(
            item.attendance_date
          )
      ).length;

    // =========================
    // نسبة الحضور
    // =========================
    const percentage =
      totalPossibleAttendance > 0
        ? (totalActualAttendance /
            totalPossibleAttendance) *
          100
        : 0;

    // =========================
    // تحديد نقاط الجمعة الحالية
    // =========================
    let currentPoints = 0;

    if (percentage >= 80) {
      currentPoints = 100;
    } else if (percentage >= 60) {
      currentPoints = 70;
    } else if (percentage >= 40) {
      currentPoints = 40;
    } else {
      currentPoints = 0;
    }

    /*
      مهم:

      بما إن النقاط تراكمية،
      كل جمعة لها حركة نقاط واحدة فقط.

      لكن النقاط المطلوبة تعتمد على
      النسبة الحالية للفريق.

      لذلك لو سجلنا أول حضور في الجمعة:
      نعمل حركة للجمعة.

      ولو حضر طفل آخر من نفس الفريق
      في نفس الجمعة:
      نحدث نفس الحركة بدل
      ما نضيف حركة جديدة.
    */

    // =========================
    // هل فيه نقاط حضور لهذه الجمعة؟
    // =========================
    const {
      data: existingPoint,
      error: existingPointError,
    } = await supabase
      .from("team_points")
      .select(
        "id, points, activity_date"
      )
      .eq("team_id", teamId)
      .eq("type", "attendance")
      .eq(
        "activity_date",
        activityDate
      )
      .maybeSingle();

    if (existingPointError) {
      console.error(
        "GET EXISTING ATTENDANCE POINT ERROR:",
        JSON.stringify(
          existingPointError,
          null,
          2
        )
      );

      return false;
    }

    // =========================
    // تحديث نقاط الجمعة
    // =========================
    if (existingPoint) {
      const {
        error: updateError,
      } = await supabase
        .from("team_points")
        .update({
          points: currentPoints,
          reason: `نقاط الحضور - نسبة الحضور ${percentage.toFixed(
            1
          )}%`,
        })
        .eq(
          "id",
          existingPoint.id
        );

      if (updateError) {
        console.error(
          "UPDATE ATTENDANCE POINT ERROR:",
          JSON.stringify(
            updateError,
            null,
            2
          )
        );

        return false;
      }
    } else {
      // =========================
      // إنشاء نقاط الجمعة لأول مرة
      // =========================
      const {
        error: insertError,
      } = await supabase
        .from("team_points")
        .insert({
          team_id: teamId,
          points: currentPoints,
          type: "attendance",
          reason: `نقاط الحضور - نسبة الحضور ${percentage.toFixed(
            1
          )}%`,
          activity_date: activityDate,
        });

      if (insertError) {
        console.error(
          "INSERT ATTENDANCE POINT ERROR:",
          JSON.stringify(
            insertError,
            null,
            2
          )
        );

        return false;
      }
    }

    return true;
  }

  // =========================
  // البحث
  // =========================
  const filteredChildren =
    children.filter((child) =>
      child.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  // =========================
  // واجهة الصفحة
  // =========================
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
          الحضور
        </h1>

        <p className="mt-2 text-slate-400">
          الخدمة يوم الجمعة فقط. ابحث عن الطفل وسجل حضوره.
        </p>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">

          {/* البحث */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              البحث عن الطفل
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
              placeholder="اكتب اسم الطفل..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* النتائج */}
          {search.trim() &&
            !selectedChild && (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950">

                {filteredChildren.length ===
                0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">
                    مفيش طفل بالاسم ده
                  </p>
                ) : (
                  filteredChildren.map(
                    (child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => {
                          setSelectedChild(
                            child
                          );
                          setSearch(
                            child.name
                          );
                        }}
                        className="flex w-full items-center justify-between border-b border-slate-800 px-4 py-3 text-right transition last:border-b-0 hover:bg-slate-800"
                      >
                        <div>
                          <p className="font-semibold">
                            {child.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getTeamName(
                              child.team_id
                            )}
                          </p>
                        </div>

                        {todayAttendance.includes(
                          child.id
                        ) ? (
                          <span className="text-xs font-bold text-green-400">
                            حاضر
                          </span>
                        ) : (
                          <span className="text-xs text-blue-400">
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
            <div className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">

              <p className="text-xs text-blue-400">
                الطفل المختار
              </p>

              <h2 className="mt-1 text-xl font-bold">
                {selectedChild.name}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                الفريق:{" "}
                {getTeamName(
                  selectedChild.team_id
                )}
              </p>

              {todayAttendance.includes(
                selectedChild.id
              ) && (
                <div className="mt-3 rounded-xl bg-green-500/10 p-3 text-center text-sm font-bold text-green-400">
                  الطفل ده متسجل حضوره النهارده
                </div>
              )}

            </div>
          )}

          {/* زر الحضور */}
          <button
            type="button"
            onClick={
              registerAttendance
            }
            disabled={
              loading ||
              !selectedChild ||
              todayAttendance.includes(
                selectedChild?.id || -1
              )
            }
            className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "جاري تسجيل الحضور..."
              : "تسجيل الحضور"}
          </button>

          {/* الرسالة */}
          {message && (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4 text-center text-sm font-semibold">
              {message}
            </div>
          )}

          {/* عدد الحضور */}
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center">

            <p className="text-sm text-slate-400">
              عدد الحضور اليوم
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-400">
              {todayAttendance.length}
            </p>

          </div>

        </div>
      </div>
    </main>
  );
}