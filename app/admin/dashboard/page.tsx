"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Team = {
  id: number;
  name: string;
};

type TeamPoint = {
  id: number;
  team_id: number;
  points: number;
  type: string;
};

type AdminUser = {
  id: number;
  name: string;
  type: "servant";
  role: "admin";
  gender?: "male" | "female";
};

type TeamRanking = {
  id: number;
  name: string;
  points: number;
};

export default function AdminDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);

  const [childrenCount, setChildrenCount] = useState(0);
  const [servantsCount, setServantsCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [confessionsCount, setConfessionsCount] = useState(0);
  const [psalmCount, setPsalmCount] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  const [ranking, setRanking] = useState<TeamRanking[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("marathon_user");

    if (!saved) {
      window.location.href = "/";
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (
        parsed.type !== "servant" ||
        parsed.role !== "admin"
      ) {
        localStorage.removeItem("marathon_user");
        window.location.href = "/";
        return;
      }

      setUser(parsed);
      loadDashboard();

    } catch {
      localStorage.removeItem("marathon_user");
      window.location.href = "/";
    }
  }, []);


  async function loadDashboard() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [
        childrenResult,
        servantsResult,
        teamsResult,
        pointsResult,
        confessionsResult,
        psalmResult,
      ] = await Promise.all([
        supabase
          .from("children")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("servants")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("teams")
          .select("id, name"),

        supabase
          .from("team_points")
          .select("id, team_id, points, type"),

        supabase
          .from("confessions")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("psalm_recitations")
          .select("id", { count: "exact", head: true }),
      ]);


      if (childrenResult.error) throw childrenResult.error;
      if (servantsResult.error) throw servantsResult.error;
      if (teamsResult.error) throw teamsResult.error;
      if (pointsResult.error) throw pointsResult.error;


      const teams = (teamsResult.data || []) as Team[];
      const points = (pointsResult.data || []) as TeamPoint[];


      setChildrenCount(childrenResult.count || 0);
      setServantsCount(servantsResult.count || 0);
      setTeamsCount(teams.length);
      setConfessionsCount(confessionsResult.count || 0);
      setPsalmCount(psalmResult.count || 0);


      const total = points.reduce(
        (sum, item) =>
          sum + Number(item.points || 0),
        0
      );

      setTotalPoints(total);


      const teamTotals = teams.map((team) => {

        const teamPoints = points
          .filter(
            (point) =>
              point.team_id === team.id
          )
          .reduce(
            (sum, point) =>
              sum + Number(point.points || 0),
            0
          );


        return {
          id: team.id,
          name: team.name,
          points: teamPoints,
        };

      });


      teamTotals.sort(
        (a, b) =>
          b.points - a.points
      );


      setRanking(teamTotals);


    } catch (error) {

      console.error(
        "ADMIN DASHBOARD ERROR:",
        error
      );

      setErrorMessage(
        "حصل خطأ أثناء تحميل بيانات لوحة الإدارة."
      );

    } finally {

      setLoading(false);

    }
  }


  function logout() {
    localStorage.removeItem("marathon_user");
    window.location.href = "/";
  }


  function goBack() {
    window.location.href =
      "/admin/dashboard";
  }
    if (!user || loading) {
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
          }}
        >
          <div style={{ fontSize: "35px" }}>
            ⚙️
          </div>

          <h2>
            جاري تحميل لوحة الإدارة...
          </h2>

          <p style={{ color: "#94a3b8" }}>
            لحظة واحدة
          </p>
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
          "radial-gradient(circle at top right,#102d50,#080d18 40%,#060a12)",
        color: "white",
        padding: "25px",
        fontFamily: "Arial, sans-serif",
      }}
    >

      <div
        style={{
          maxWidth: "1250px",
          margin: "auto",
        }}
      >

        <header
          style={{
            background:
              "linear-gradient(135deg,#0b2e55,#0d47a1,#1565c0)",
            borderRadius: "25px",
            padding: "30px",
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >

          <div>

            <div
              style={{
                color:"#90caf9",
                fontWeight:"bold",
                fontSize:"14px"
              }}
            >
              MARATHON ADMIN
            </div>


            <h1
              style={{
                marginTop:"10px",
                fontSize:"32px",
              }}
            >
              أهلاً يا {user.name}
            </h1>


            <p style={{color:"#dbeafe"}}>
              لوحة التحكم الرئيسية • ماراثون الخدمة
            </p>

          </div>


          <div
            style={{
              display:"flex",
              gap:"10px",
              flexWrap:"wrap"
            }}
          >

            <button
              onClick={goBack}
              style={buttonStyle}
            >
              لوحة الإدارة
            </button>


            <button
              onClick={logout}
              style={{
                ...buttonStyle,
                border:"1px solid #ef4444",
                color:"#fca5a5"
              }}
            >
              تسجيل الخروج
            </button>

          </div>


        </header>



        {errorMessage && (

          <div
            style={{
              background:"#2a1518",
              border:"1px solid #7f1d1d",
              padding:"15px",
              borderRadius:"15px",
              marginBottom:"20px",
              color:"#fca5a5"
            }}
          >

            {errorMessage}

          </div>

        )}



        <div
          style={{
            display:"grid",
            gridTemplateColumns:
            "repeat(auto-fit,minmax(190px,1fr))",
            gap:"18px",
            marginBottom:"25px"
          }}
        >

          <StatCard
            title="الأطفال"
            value={childrenCount}
            icon="👦"
          />

          <StatCard
            title="الخدام"
            value={servantsCount}
            icon="🙋"
          />

          <StatCard
            title="الفرق"
            value={teamsCount}
            icon="🏆"
          />

          <StatCard
            title="إجمالي النقاط"
            value={totalPoints}
            icon="⭐"
          />

          <StatCard
            title="الاعترافات"
            value={confessionsCount}
            icon="✝️"
          />

          <StatCard
            title="تسميع المزمور"
            value={psalmCount}
            icon="📖"
          />

        </div>



        <section style={sectionStyle}>

          <h2 style={titleStyle}>
            الإدارة
          </h2>


          <div
            style={{
              display:"grid",
              gridTemplateColumns:
              "repeat(auto-fit,minmax(190px,1fr))",
              gap:"14px"
            }}
          >

            <AdminButton
              title="إدارة الأطفال"
              icon="👦"
              onClick={() =>
                window.location.href="/admin/children"
              }
            />

            <AdminButton
              title="إدارة الخدام"
              icon="🙋"
              onClick={() =>
                window.location.href="/admin/servants"
              }
            />

            <AdminButton
              title="إدارة الفرق"
              icon="🏆"
              onClick={() =>
                window.location.href="/admin/teams"
              }
            />

            <AdminButton
              title="إدارة النقاط"
              icon="⭐"
              onClick={() =>
                window.location.href="/points"
              }
            />

            <AdminButton
              title="الحضور"
              icon="📋"
              onClick={() =>
                window.location.href="/attendance"
              }
            />

            <AdminButton
              title="حضور القداس"
              icon="⛪"
              onClick={() =>
                window.location.href="/mass"
              }
            />

            <AdminButton
              title="الاعتراف"
              icon="✝️"
              onClick={() =>
                window.location.href="/confession"
              }
            />

            <AdminButton
              title="سجل الإدارة"
              icon="📝"
              onClick={() =>
                window.location.href="/admin/logs"
              }
            />

          </div>

        </section>



        <section style={sectionStyle}>

          <div
            style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center",
              marginBottom:"20px"
            }}
          >

            <h2 style={titleStyle}>
              ترتيب الفرق
            </h2>


            <button
              onClick={loadDashboard}
              style={{
                background:"#0d47a1",
                color:"white",
                border:"1px solid #2563eb",
                padding:"10px 18px",
                borderRadius:"12px",
                cursor:"pointer"
              }}
            >
              🔄 تحديث
            </button>

          </div>


          {ranking.map((team,index)=>(

            <div
              key={team.id}
              style={{
                background:
                index===0
                ? "#102f52"
                :"#0b1321",
                border:"1px solid #1c3554",
                padding:"15px",
                borderRadius:"16px",
                marginBottom:"12px",
                display:"flex",
                justifyContent:"space-between"
              }}
            >

              <b>
                {index+1}. {team.name}
              </b>


              <span
                style={{
                  color:"#60a5fa",
                  fontWeight:"bold"
                }}
              >
                {team.points} نقطة
              </span>


            </div>

          ))}


        </section>


      </div>

    </main>
  );
}
const buttonStyle = {
  background:"rgba(255,255,255,0.08)",
  color:"white",
  padding:"12px 18px",
  borderRadius:"13px",
  cursor:"pointer",
  border:"1px solid rgba(255,255,255,0.2)",
  fontWeight:"bold"
};


const sectionStyle = {
  background:"#0f1726",
  borderRadius:"24px",
  padding:"27px",
  marginBottom:"25px",
  border:"1px solid #1c3554"
};


const titleStyle = {
  color:"#60a5fa",
  fontSize:"24px",
  marginBottom:"20px"
};
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div
      style={{
        background:"#0f1726",
        border:"1px solid #1c3554",
        borderRadius:"20px",
        padding:"20px",
      }}
    >
      <div style={{fontSize:"30px"}}>
        {icon}
      </div>

      <p style={{color:"#94a3b8"}}>
        {title}
      </p>

      <h2
        style={{
          color:"#60a5fa",
          fontSize:"32px",
          margin:0
        }}
      >
        {value}
      </h2>
    </div>
  );
}


function AdminButton({
  title,
  icon,
  onClick,
}: {
  title:string;
  icon:string;
  onClick:()=>void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background:"#0b1321",
        border:"1px solid #1d3552",
        color:"white",
        padding:"20px",
        borderRadius:"18px",
        cursor:"pointer",
        fontWeight:"bold",
        fontSize:"16px",
        textAlign:"right",
      }}
    >
      <div style={{fontSize:"28px"}}>
        {icon}
      </div>

      <div style={{marginTop:"10px"}}>
        {title}
      </div>
    </button>
  );
}