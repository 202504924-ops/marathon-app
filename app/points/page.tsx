"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Team = {
  id: number;
  name: string;
};

export default function PointsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");

  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setMessage("");

    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .order("id");

    if (error) {
      console.error(
        "GET TEAMS ERROR:",
        JSON.stringify(error, null, 2)
      );

      setMessage("حصل خطأ أثناء تحميل الفرق");
      return;
    }

    setTeams(data || []);
  }

  async function updatePoints() {
    setMessage("");

    if (!teamId) {
      setMessage("اختار الفريق أولاً");
      return;
    }

    if (!points.trim()) {
      setMessage("اكتب عدد النقاط");
      return;
    }

    if (!/^\d+$/.test(points.trim())) {
      setMessage("عدد النقاط لازم يكون رقم صحيح");
      return;
    }

    const pointsNumber = Number(points);

    if (!Number.isSafeInteger(pointsNumber) || pointsNumber <= 0) {
      setMessage("اكتب عدد نقاط صحيح أكبر من صفر");
      return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setMessage("اكتب سبب تعديل النقاط");
      return;
    }

    const selectedTeam = teams.find(
      (team) => team.id === Number(teamId)
    );

    if (!selectedTeam) {
      setMessage("الفريق المختار غير موجود");
      return;
    }

    setLoading(true);

    try {
      const finalPoints =
        mode === "add"
          ? pointsNumber
          : -pointsNumber;

      const { error } = await supabase
        .from("team_points")
        .insert({
          team_id: selectedTeam.id,
          points: finalPoints,
          type: "manual",
          reason: cleanReason,
        });

      if (error) {
        console.error(
          "ADD POINTS ERROR:",
          JSON.stringify(error, null, 2)
        );

        setMessage(
          `حصل خطأ أثناء تعديل النقاط: ${error.message}`
        );

        return;
      }

      setMessage(
        mode === "add"
          ? `تم إضافة ${pointsNumber} نقطة لفريق ${selectedTeam.name} بنجاح`
          : `تم خصم ${pointsNumber} نقطة من فريق ${selectedTeam.name} بنجاح`
      );

      setTeamId("");
      setPoints("");
      setReason("");
      setMode("add");
    } catch (error) {
      console.error("UPDATE POINTS ERROR:", error);

      setMessage("حصل خطأ غير متوقع أثناء حفظ النقاط");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto w-full max-w-2xl">

        {/* الرجوع */}
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
          تعديل النقاط
        </h1>

        <p className="mt-2 text-slate-400">
          أضف أو اخصم نقاط من الفريق مع تسجيل السبب.
        </p>

        <div className="mt-8 space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">

          {/* الفريق */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              الفريق
            </label>

            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setMessage("");
              }}
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                اختار الفريق
              </option>

              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* إضافة / خصم */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              نوع التعديل
            </label>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => {
                  setMode("add");
                  setMessage("");
                }}
                disabled={loading}
                className={`rounded-xl border px-4 py-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === "add"
                    ? "border-green-500 bg-green-500/15 text-green-400"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800"
                }`}
              >
                + إضافة نقاط
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("subtract");
                  setMessage("");
                }}
                disabled={loading}
                className={`rounded-xl border px-4 py-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  mode === "subtract"
                    ? "border-red-500 bg-red-500/15 text-red-400"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800"
                }`}
              >
                − خصم نقاط
              </button>

            </div>
          </div>

          {/* عدد النقاط */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              عدد النقاط
            </label>

            <input
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={points}
              onChange={(e) => {
                setPoints(e.target.value);
                setMessage("");
              }}
              placeholder="مثال: 50"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-slate-500">
              {mode === "add"
                ? "النقاط هتتضاف للفريق."
                : "النقاط هتتخصم من الفريق."}
            </p>
          </div>

          {/* السبب */}
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              السبب
            </label>

            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setMessage("");
              }}
              placeholder="اكتب سبب إضافة أو خصم النقاط..."
              rows={4}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* معاينة */}
          {points && Number(points) > 0 && (
            <div
              className={`rounded-xl border p-4 text-center font-bold ${
                mode === "add"
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {mode === "add"
                ? `+ ${Number(points)} نقطة`
                : `− ${Number(points)} نقطة`}
            </div>
          )}

          {/* زر الحفظ */}
          <button
            type="button"
            onClick={updatePoints}
            disabled={loading}
            className={`w-full rounded-xl py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "add"
                ? "bg-green-600 hover:bg-green-500"
                : "bg-red-600 hover:bg-red-500"
            }`}
          >
            {loading
              ? "جاري الحفظ..."
              : mode === "add"
              ? "إضافة النقاط"
              : "خصم النقاط"}
          </button>

          {/* الرسالة */}
          {message && (
            <div
              className={`rounded-xl border p-4 text-center text-sm font-semibold ${
                message.includes("بنجاح")
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              {message}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}