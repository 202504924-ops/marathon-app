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

type Confession = {
  child_id: number;
};

export default function ConfessionPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [confessions, setConfessions] = useState<Confession[]>([]);

  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] =
    useState<Child | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showConfessed, setShowConfessed] = useState(false);
const [showNotConfessed, setShowNotConfessed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const { data: childrenData, error: childrenError } =
        await supabase
          .from("children")
          .select("id, name, team_id")
          .order("name");

      if (childrenError) {
        console.error(
          "GET CHILDREN ERROR:",
          JSON.stringify(childrenError, null, 2)
        );

        setMessage("حصل خطأ أثناء تحميل الأطفال");
        return;
      }

      const { data: teamsData, error: teamsError } =
        await supabase
          .from("teams")
          .select("id, name")
          .order("id");

      if (teamsError) {
        console.error(
          "GET TEAMS ERROR:",
          JSON.stringify(teamsError, null, 2)
        );

        setMessage("حصل خطأ أثناء تحميل الفرق");
        return;
      }

      const {
        data: confessionsData,
        error: confessionsError,
      } = await supabase
        .from("confessions")
        .select("child_id");

      if (confessionsError) {
        console.error(
          "GET CONFESSIONS ERROR:",
          JSON.stringify(confessionsError, null, 2)
        );

        setMessage("حصل خطأ أثناء تحميل بيانات الاعتراف");
        return;
      }

      setChildren(childrenData || []);
      setTeams(teamsData || []);
      setConfessions(confessionsData || []);
    } finally {
      setLoading(false);
    }
  }

  function getTeamName(teamId: number) {
    return (
      teams.find((team) => team.id === teamId)?.name ||
      "بدون فريق"
    );
  }

  function hasConfessed(childId: number) {
    return confessions.some(
      (item) => item.child_id === childId
    );
  }

  async function registerConfession() {
    if (!selectedChild) {
      setMessage("اختار الطفل أولاً");
      return;
    }

    if (hasConfessed(selectedChild.id)) {
      setMessage(
        "الطفل دا متسجل اعترافه بالفعل في الماراثون"
      );
      return;
    }

    setRegistering(true);
    setMessage("");

    try {
      const { error: confessionError } =
        await supabase
          .from("confessions")
          .insert({
            child_id: selectedChild.id,
          });

      if (confessionError) {
        console.error(
          "CONFESSION INSERT ERROR:",
          JSON.stringify(confessionError, null, 2)
        );

        if (confessionError.code === "23505") {
          setMessage(
            "الطفل دا متسجل اعترافه بالفعل في الماراثون"
          );
        } else {
          setMessage(
            `حصل خطأ أثناء تسجيل الاعتراف: ${confessionError.message}`
          );
        }

        return;
      }

      const { error: pointsError } =
        await supabase
          .from("team_points")
          .insert({
            team_id: selectedChild.team_id,
            points: 50,
            type: "confession",
            reason: `اعتراف ${selectedChild.name}`,
          });

      if (pointsError) {
        console.error(
          "CONFESSION POINTS ERROR:",
          JSON.stringify(pointsError, null, 2)
        );

        setMessage(
          "تم تسجيل الاعتراف لكن حصل خطأ أثناء إضافة النقاط"
        );

        return;
      }

      setConfessions((prev) => [
        ...prev,
        {
          child_id: selectedChild.id,
        },
      ]);

      setMessage(
        `تم تسجيل اعتراف ${selectedChild.name} وإضافة 50 نقطة لفريقه`
      );

      setSelectedChild(null);
      setSearch("");
    } finally {
      setRegistering(false);
    }
  }

  const filteredChildren = children.filter((child) =>
    child.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const confessedChildren = children.filter((child) =>
  hasConfessed(child.id)
);

const notConfessedChildren = children.filter((child) =>
  !hasConfessed(child.id)
);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto w-full max-w-2xl">

        {/* الرجوع */}
        <button
          onClick={() =>
            (window.location.href = "/servant/dashboard")
          }
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          ← رجوع للوحة التحكم
        </button>

        {/* العنوان */}
        <p className="mb-2 text-sm text-purple-400">
          ماراثون الخدمة
        </p>

        <h1 className="text-3xl font-bold">
          تسجيل الاعتراف
        </h1>

        <p className="mt-2 text-slate-400">
          سجل اعتراف الطفل. كل طفل يحصل فريقه على 50 نقطة
          مرة واحدة فقط.
        </p>

        {/* الإحصائيات */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">
            إجمالي الأطفال الذين اعترفوا
          </p>

          <p className="mt-1 text-3xl font-bold text-purple-400">
            {confessions.length}
          </p>
        </div>

        {/* التسجيل */}
        <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">

          {/* البحث */}
          <label className="mb-2 block text-sm text-slate-300">
            اسم الطفل
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedChild(null);
              setMessage("");
            }}
            placeholder="اكتب اسم الطفل للبحث..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-purple-500"
          />

          {/* قائمة الأطفال */}
          {search.trim() && !selectedChild && (
            <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950">

              {loading ? (
                <p className="p-4 text-center text-slate-400">
                  جاري تحميل الأطفال...
                </p>
              ) : filteredChildren.length === 0 ? (
                <p className="p-4 text-center text-slate-400">
                  مفيش طفل بالاسم ده
                </p>
              ) : (
                filteredChildren.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setSelectedChild(child);
                      setMessage("");
                    }}
                    className="flex w-full items-center justify-between border-b border-slate-800 px-4 py-3 text-right transition last:border-b-0 hover:bg-slate-800"
                  >
                    <div>
                      <p className="font-semibold">
                        {child.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        الفريق: {getTeamName(child.team_id)}
                      </p>
                    </div>

                    {hasConfessed(child.id) ? (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                        تم الاعتراف
                      </span>
                    ) : (
                      <span className="text-sm text-purple-400">
                        اختيار
                      </span>
                    )}
                  </button>
                ))
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
                {selectedChild.name}
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                الفريق: {getTeamName(selectedChild.team_id)}
              </p>

              {hasConfessed(selectedChild.id) ? (
                <div className="mt-4 rounded-xl bg-green-500/10 p-3 text-center font-bold text-green-400">
                  الطفل دا سجل اعترافه بالفعل في الماراثون
                </div>
              ) : (
                <button
                  type="button"
                  onClick={registerConfession}
                  disabled={registering}
                  className="mt-5 w-full rounded-xl bg-purple-600 py-3 font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {registering
                    ? "جاري تسجيل الاعتراف..."
                    : "تسجيل الاعتراف +50 نقطة"}
                </button>
              )}

            </div>
          )}

          {/* الرسالة */}
          {message && (
            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4 text-center text-sm font-semibold">
              {message}
            </div>
          )}

        </div>

{/* قوائم الاعتراف */}

<div className="mt-5 space-y-4">

  {/* زرار اللي اعترفوا */}
  <button
    type="button"
    onClick={() =>
      setShowConfessed(!showConfessed)
    }
    className="flex w-full items-center justify-between rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-right"
  >
    <span className="font-bold text-green-400">
      ✅ اعترفوا ({confessedChildren.length})
    </span>

    <span>
      {showConfessed ? "▲" : "▼"}
    </span>
  </button>


  {showConfessed && (
    <div className="rounded-2xl border border-green-500/20 bg-slate-950 p-4">

      {confessedChildren.length === 0 ? (
        <p className="text-sm text-slate-400">
          لا يوجد أطفال اعترفوا حتى الآن
        </p>
      ) : (
        <div className="space-y-2">
          {confessedChildren.map((child) => (
            <div
              key={child.id}
              className="rounded-xl bg-slate-900 p-3"
            >
              {child.name}
            </div>
          ))}
        </div>
      )}

    </div>
  )}



  {/* زرار اللي معترفوش */}
  <button
    type="button"
    onClick={() =>
      setShowNotConfessed(!showNotConfessed)
    }
    className="flex w-full items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-right"
  >
    <span className="font-bold text-red-400">
      ❌ لم يعترفوا ({notConfessedChildren.length})
    </span>

    <span>
      {showNotConfessed ? "▲" : "▼"}
    </span>
  </button>


  {showNotConfessed && (
    <div className="rounded-2xl border border-red-500/20 bg-slate-950 p-4">

      {notConfessedChildren.length === 0 ? (
        <p className="text-sm text-slate-400">
          كل الأطفال اعترفوا 🎉
        </p>
      ) : (
        <div className="space-y-2">
          {notConfessedChildren.map((child) => (
            <div
              key={child.id}
              className="rounded-xl bg-slate-900 p-3"
            >
              {child.name}
            </div>
          ))}
        </div>
      )}

    </div>
  )}

</div>

      </div>
    </main>
  );
}