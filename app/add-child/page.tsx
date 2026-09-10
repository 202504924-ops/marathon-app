"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Gender = "male" | "female";

type Team = {
  id: number;
  name: string;
};

type Child = {
  id: number;
  name: string;
  team_id: number;
  qr_token: string;
  gender: Gender;
};

export default function AddChild() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [addedChild, setAddedChild] = useState<Child | null>(null);

  useEffect(() => {
    async function getTeams() {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .order("id");

      if (error) {
        console.error(
          "GET TEAMS ERROR:",
          JSON.stringify(error, null, 2)
        );
        return;
      }

      setTeams(data || []);
    }

    getTeams();
  }, []);

  async function addChild() {
    setMessage("");
    setAddedChild(null);

    const cleanName = name.trim();

    if (!cleanName) {
      setMessage("اكتب اسم الطفل أولاً");
      return;
    }

    if (!gender) {
      setMessage("اختار نوع الطفل أولاً");
      return;
    }

    if (!teamId) {
      setMessage("اختار فريق الطفل أولاً");
      return;
    }

    setLoading(true);

    try {
      const { data: existingChild, error: checkError } =
        await supabase
          .from("children")
          .select("id, name")
          .eq("name", cleanName)
          .eq("team_id", Number(teamId))
          .maybeSingle();

      if (checkError) {
        console.error(
          "CHECK CHILD ERROR:",
          JSON.stringify(checkError, null, 2)
        );

        setMessage("حصل خطأ أثناء التأكد من الاسم");
        return;
      }

      if (existingChild) {
        setMessage("الاسم دا موجود فعلاً في الفريق");
        return;
      }

      const qrToken = crypto.randomUUID();

      const { data: newChild, error: insertError } =
        await supabase
          .from("children")
          .insert({
            name: cleanName,
            team_id: Number(teamId),
            gender: gender,
            qr_token: qrToken,
          })
          .select("id, name, team_id, gender, qr_token")
          .single();

      if (insertError) {
        console.error(
          "ADD CHILD ERROR:",
          JSON.stringify(insertError, null, 2)
        );

        if (insertError.code === "23505") {
          setMessage("الاسم دا موجود فعلاً في الفريق");
        } else {
          setMessage(
            `حصل خطأ أثناء إضافة الطفل: ${insertError.message}`
          );
        }

        return;
      }

      setAddedChild(newChild);
      setName("");
      setTeamId("");
      setGender("");

      setMessage("تم إضافة الطفل بنجاح");
    } finally {
      setLoading(false);
    }
  }

  function downloadQR() {
    if (!addedChild) return;

    const canvas = document.getElementById(
      "child-qr"
    ) as HTMLCanvasElement | null;

    if (!canvas) {
      setMessage("مش قادر أحمل الـQR حالياً");
      return;
    }

    const image = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = `${addedChild.name}-QR.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const addedTeam = teams.find(
    (team) => team.id === addedChild?.team_id
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6"
    >
      <div className="mx-auto w-full max-w-xl">

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
          إضافة طفل
        </h1>

        <p className="mt-2 text-slate-400">
          أضف بيانات الطفل واربطه بفريقه.
        </p>

        <div className="mt-8 space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              اسم الطفل
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسم الطفل"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              النوع
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`rounded-xl border px-4 py-4 font-bold transition ${
                  gender === "male"
                    ? "border-blue-500 bg-blue-500/15 text-blue-400"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800"
                }`}
              >
                ولد
              </button>

              <button
                type="button"
                onClick={() => setGender("female")}
                className={`rounded-xl border px-4 py-4 font-bold transition ${
                  gender === "female"
                    ? "border-pink-500 bg-pink-500/15 text-pink-400"
                    : "border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800"
                }`}
              >
                بنت
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              الفريق
            </label>

            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
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

          <button
            type="button"
            onClick={addChild}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جاري الإضافة..." : "إضافة الطفل"}
          </button>

          {message && (
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-center text-sm">
              {message}
            </div>
          )}

          {addedChild && (
            <div className="mt-6 rounded-2xl border border-slate-700 bg-white p-5 text-center text-slate-900">
              <h2 className="text-xl font-bold">
                تم إضافة الطفل بنجاح
              </h2>

              <p className="mt-2 text-lg font-semibold">
                {addedChild.name}
              </p>

              {addedTeam && (
                <p className="mt-1 text-sm text-slate-500">
                  الفريق: {addedTeam.name}
                </p>
              )}

              <p className="mt-1 text-sm text-slate-500">
                النوع:{" "}
                {addedChild.gender === "male"
                  ? "ولد"
                  : "بنت"}
              </p>

              <div className="mt-5 flex justify-center">
                <div className="rounded-2xl bg-white p-4 shadow-lg">
                  <QRCodeCanvas
                    id="child-qr"
                    value={addedChild.qr_token}
                    size={260}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                ID الطفل
              </p>

              <p className="font-bold">
                {addedChild.id}
              </p>

              <button
                type="button"
                onClick={downloadQR}
                className="mt-5 w-full rounded-xl bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800"
              >
                تحميل QR كصورة
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}