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

export default function PsalmPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("marathon_user");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    try {
      const user = JSON.parse(saved);

      if (user.type !== "servant") {
        window.location.href = "/";
        return;
      }

      loadData();
    } catch {
      localStorage.removeItem("marathon_user");
      window.location.href = "/";
    }
  }, []);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [childrenResult, teamsResult] = await Promise.all([
        supabase
          .from("children")
          .select("id, name, team_id")
          .order("name"),

        supabase
          .from("teams")
          .select("id, name")
          .order("name"),
      ]);

      if (childrenResult.error) {
        throw childrenResult.error;
      }

      if (teamsResult.error) {
        throw teamsResult.error;
      }

      setChildren((childrenResult.data || []) as Child[]);
      setTeams((teamsResult.data || []) as Team[]);
    } catch (error) {
      console.error("PSALM LOAD ERROR:", error);

      setErrorMessage("حصل خطأ أثناء تحميل بيانات الأطفال.");
    } finally {
      setLoading(false);
    }
  }

  function getTeamName(teamId: number) {
    const team = teams.find((item) => item.id === teamId);

    return team?.name || "بدون فريق";
  }

  async function checkAlreadyRecited(childId: number) {
    const { data, error } = await supabase
      .from("psalm_recitations")
      .select("id")
      .eq("child_id", childId)
      .maybeSingle();

    if (error) {
      console.error("CHECK PSALM ERROR:", error);
      return false;
    }

    return !!data;
  }

  async function recordPsalm() {
    if (!selectedChild) {
      setErrorMessage("اختار الطفل الأول.");
      return;
    }

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      // التأكد إن الطفل مسمّعش قبل كده
      const alreadyRecited = await checkAlreadyRecited(
        selectedChild.id
      );

      if (alreadyRecited) {
        setErrorMessage(
          `الطفل ${selectedChild.name} مسجّل إنه سمّع المزمور بالفعل.`
        );
        return;
      }

      // تسجيل التسميع
      const { error: psalmError } = await supabase
        .from("psalm_recitations")
        .insert({
          child_id: selectedChild.id,
        });

      if (psalmError) {
        // 23505 = الطفل مسجل قبل كده
        if (psalmError.code === "23505") {
          setErrorMessage(
            `الطفل ${selectedChild.name} مسجّل إنه سمّع المزمور بالفعل.`
          );
          return;
        }

        throw psalmError;
      }

      // إضافة 20 نقطة للفريق
      const { error: pointsError } = await supabase
        .from("team_points")
        .insert({
          team_id: selectedChild.team_id,
          points: 20,
          type: "psalm",
        });

      // لو إضافة النقاط فشلت نحذف تسجيل التسميع
      if (pointsError) {
        console.error("PSALM POINTS ERROR:", pointsError);

        await supabase
          .from("psalm_recitations")
          .delete()
          .eq("child_id", selectedChild.id);

        throw pointsError;
      }

      setMessage(
        `تم تسجيل تسميع ${selectedChild.name} وإضافة 20 نقطة لفريق ${getTeamName(
          selectedChild.team_id
        )}.`
      );

      setSelectedChild(null);
      setSearch("");
    } catch (error) {
      console.error("PSALM ERROR:", error);

      setErrorMessage(
        "حصل خطأ أثناء تسجيل تسميع المزمور."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredChildren = children.filter((child) =>
    child.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080d18",
          color: "white",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "#111827",
            border: "1px solid #1e3a5f",
            padding: "40px",
            borderRadius: "24px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              fontSize: "40px",
              marginBottom: "15px",
            }}
          >
            📖
          </div>

          <h2 style={{ margin: 0 }}>
            جاري تحميل الأطفال...
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, #102d50 0%, #080d18 40%, #060a12 100%)",
        color: "#f8fafc",
        padding: "25px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <header
          style={{
            background:
              "linear-gradient(135deg, #0b2e55 0%, #0d47a1 50%, #1565c0 100%)",
            borderRadius: "25px",
            padding: "28px",
            marginBottom: "22px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
            border: "1px solid rgba(66,165,245,0.25)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#90caf9",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            MARATHON • PSALM
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
            }}
          >
            📖 تسميع المزمور
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#dbeafe",
              fontSize: "14px",
            }}
          >
            تسجيل تسميع المزمور وإضافة 20 نقطة للفريق
          </p>
        </header>

        {/* BACK BUTTON */}

        <button
          onClick={() => {
            window.location.href = "/servant/dashboard";
          }}
          style={{
            width: "100%",
            border: "1px solid #1d3552",
            background: "#0f1726",
            color: "#cbd5e1",
            padding: "14px",
            borderRadius: "15px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          ← رجوع للوحة التحكم
        </button>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div
            style={{
              background: "#0d2f25",
              color: "#86efac",
              border: "1px solid #166534",
              padding: "16px 18px",
              borderRadius: "15px",
              marginBottom: "18px",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {errorMessage && (
          <div
            style={{
              background: "#2a1518",
              color: "#fca5a5",
              border: "1px solid #7f1d1d",
              padding: "16px 18px",
              borderRadius: "15px",
              marginBottom: "18px",
              fontWeight: "bold",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* MAIN CARD */}

        <section
          style={{
            background: "#0f1726",
            borderRadius: "24px",
            padding: "25px",
            border: "1px solid #1c3554",
            boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
          }}
        >
          {/* POINTS */}

          <div
            style={{
              background: "#0b2a49",
              border: "1px solid #174a76",
              borderRadius: "18px",
              padding: "18px",
              marginBottom: "22px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "35px",
                marginBottom: "8px",
              }}
            >
              ⭐
            </div>

            <div
              style={{
                color: "#60a5fa",
                fontSize: "24px",
                fontWeight: "800",
              }}
            >
              +20 نقطة
            </div>

            <div
              style={{
                color: "#94a3b8",
                marginTop: "5px",
                fontSize: "13px",
              }}
            >
              لكل طفل يسمّع المزمور
            </div>
          </div>

          {/* SEARCH */}

          <label
            style={{
              display: "block",
              color: "#cbd5e1",
              fontWeight: "bold",
              marginBottom: "9px",
            }}
          >
            ابحث عن الطفل
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedChild(null);
              setMessage("");
              setErrorMessage("");
            }}
            placeholder="اكتب اسم الطفل..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0a1220",
              color: "white",
              border: "1px solid #294766",
              borderRadius: "14px",
              padding: "15px",
              outline: "none",
              fontSize: "15px",
              marginBottom: "15px",
            }}
          />

          {/* CHILDREN RESULTS */}

          {search.trim() && !selectedChild && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "9px",
                marginBottom: "18px",
                maxHeight: "350px",
                overflowY: "auto",
              }}
            >
              {filteredChildren.length === 0 ? (
                <div
                  style={{
                    background: "#0a1220",
                    border: "1px solid #1e293b",
                    color: "#94a3b8",
                    padding: "20px",
                    borderRadius: "14px",
                    textAlign: "center",
                  }}
                >
                  لا يوجد طفل بهذا الاسم
                </div>
              ) : (
                filteredChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChild(child);
                      setMessage("");
                      setErrorMessage("");
                    }}
                    style={{
                      width: "100%",
                      border: "1px solid #1d3552",
                      background: "#0b1321",
                      color: "white",
                      borderRadius: "15px",
                      padding: "15px",
                      cursor: "pointer",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                      }}
                    >
                      {child.name}
                    </div>

                    <div
                      style={{
                        color: "#60a5fa",
                        fontSize: "12px",
                        marginTop: "5px",
                      }}
                    >
                      فريق {getTeamName(child.team_id)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* SELECTED CHILD */}

          {selectedChild && (
            <div
              style={{
                background: "#0b1321",
                border: "1px solid #2563a8",
                borderRadius: "18px",
                padding: "18px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  marginBottom: "7px",
                }}
              >
                الطفل المختار
              </div>

              <div
                style={{
                  fontSize: "21px",
                  fontWeight: "800",
                  color: "#f8fafc",
                }}
              >
                {selectedChild.name}
              </div>

              <div
                style={{
                  color: "#60a5fa",
                  marginTop: "6px",
                  fontSize: "14px",
                }}
              >
                فريق {getTeamName(selectedChild.team_id)}
              </div>
            </div>
          )}

          {/* SAVE BUTTON */}

          <button
            onClick={recordPsalm}
            disabled={!selectedChild || saving}
            style={{
              width: "100%",
              border: "none",
              background:
                !selectedChild || saving
                  ? "#26364a"
                  : "linear-gradient(135deg, #1565c0, #42a5f5)",
              color:
                !selectedChild || saving
                  ? "#64748b"
                  : "white",
              padding: "16px",
              borderRadius: "15px",
              cursor:
                !selectedChild || saving
                  ? "not-allowed"
                  : "pointer",
              fontSize: "16px",
              fontWeight: "800",
              boxShadow:
                !selectedChild || saving
                  ? "none"
                  : "0 10px 25px rgba(21,101,192,0.25)",
            }}
          >
            {saving
              ? "جاري التسجيل..."
              : "✓ تسجيل تسميع المزمور +20 نقطة"}
          </button>
        </section>

        <div
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "13px",
            padding: "25px 0 5px",
          }}
        >
          ماراثون الخدمة • تسميع المزمور
        </div>
      </div>
    </main>
  );
}