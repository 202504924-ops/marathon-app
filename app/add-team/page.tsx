"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddTeamPage() {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("marathon_user");

    if (!savedUser) {
      window.location.href = "/";
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      if (user.type !== "servant") {
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/";
    }
  }, []);

  async function addTeam() {
    const cleanName = teamName.trim();

    if (!cleanName) {
      setMessage("اكتب اسم الفريق الأول");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data: existingTeam, error: checkError } = await supabase
        .from("teams")
        .select("id, name")
        .ilike("name", cleanName)
        .maybeSingle();

      if (checkError) {
        console.error(checkError);
        setMessage("حصل خطأ أثناء التأكد من الفريق");
        setLoading(false);
        return;
      }

      if (existingTeam) {
        setMessage("الفريق ده موجود بالفعل");
        setLoading(false);
        return;
      }

      const { error } = await supabase
  .from("teams")
  .insert({
    name: cleanName,
    points: 0,
  });

      if (error) {
        console.error(error);
        setMessage("حصل خطأ أثناء إضافة الفريق");
        setLoading(false);
        return;
      }

      setTeamName("");
      setMessage("تم إضافة الفريق بنجاح");

    } catch (error) {
      console.error(error);
      setMessage("حصل خطأ غير متوقع");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="mx-auto max-w-xl">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => (window.location.href = "/servant/dashboard")}
            className="mb-5 text-sm text-slate-400 hover:text-white transition"
          >
            ← رجوع للوحة التحكم
          </button>

          <h1 className="text-3xl font-bold">
            إضافة فريق
          </h1>

          <p className="mt-2 text-slate-400">
            أضف فريق جديد للماراثون
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">

          <label className="mb-3 block text-sm font-medium text-slate-300">
            اسم الفريق
          </label>

          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addTeam();
              }
            }}
            placeholder="مثال: فريق النور"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
          />

          <button
            onClick={addTeam}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-4 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جاري الإضافة..." : "إضافة الفريق"}
          </button>

          {message && (
            <div
              className={`mt-4 rounded-xl px-4 py-3 text-center text-sm ${
                message.includes("بنجاح")
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
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