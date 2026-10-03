"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Gender = "male" | "female" | null;

type Child = {
  id: number;
  name: string;
  team_id: number;
  gender: Gender;
};

type Servant = {
  id: number;
  name: string;
  password: string;
  gender: Gender;
  role: "servant" | "admin";
};

type LoggedUser = {
  id: number;
  name: string;
  type: "child" | "servant";
  gender: Gender;
  team_id?: number;
  role?: "servant" | "admin";
};

type Team = {
  id: number;
  name: string;
};

type TeamPoint = {
  team_id: number;
  points: number;
};

export default function Home() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [needPassword, setNeedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [loggedUser, setLoggedUser] =
    useState<LoggedUser | null>(null);

  // بيانات Dashboard الطفل
  const [teamName, setTeamName] = useState("جاري التحميل...");
  const [teamPoints, setTeamPoints] = useState(0);
  const [teamRank, setTeamRank] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);

type QuestionItem = {
  question: string;
  answers: string[];
  correctIndex: number | null;
  points: number;
};

const [questions, setQuestions] = useState<QuestionItem[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("marathon_user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        setLoggedUser(user);

        // لو طفل، نحمل بيانات الـ Dashboard
        if (user.type === "child") {
          loadChildDashboard(user);
        }

        // لو Admin أو Servant موجود بالفعل
        // نحوله تلقائيًا للوحة الخاصة به
        if (user.type === "servant") {
          if (user.role === "admin") {
            window.location.href = "/admin/dashboard";
          } else {
            window.location.href = "/servant/dashboard";
          }
        }
      } catch {
        localStorage.removeItem("marathon_user");
      }
    }
  }, []);

  async function loadChildDashboard(user: LoggedUser) {
    if (!user.team_id) {
      return;
    }

    setDashboardLoading(true);

    try {
      // =========================
      // جلب الفريق
      // =========================
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("id", user.team_id)
        .maybeSingle();

      if (teamError) {
        console.error("TEAM DASHBOARD ERROR:", teamError);
      }

      if (team) {
        setTeamName(team.name);
      }

      // =========================
      // جلب نقاط كل الفرق
      // =========================
      const { data: allPoints, error: pointsError } =
        await supabase
          .from("team_points")
          .select("team_id, points");

      if (pointsError) {
        console.error(
          "TEAM POINTS DASHBOARD ERROR:",
          pointsError
        );
      }

      const pointsByTeam: Record<number, number> = {};

      (allPoints || []).forEach((item: TeamPoint) => {
        if (!pointsByTeam[item.team_id]) {
          pointsByTeam[item.team_id] = 0;
        }

        pointsByTeam[item.team_id] += Number(item.points) || 0;
      });

      const currentTeamPoints =
        pointsByTeam[user.team_id] || 0;

      setTeamPoints(currentTeamPoints);

      // =========================
      // حساب ترتيب الفريق
      // =========================
      const sortedPoints = Object.entries(pointsByTeam)
        .map(([teamId, points]) => ({
          teamId: Number(teamId),
          points,
        }))
        .sort((a, b) => b.points - a.points);

      // الفرق الموجودة بدون نقاط
      const { data: allTeams, error: teamsError } =
        await supabase
          .from("teams")
          .select("id, name");

      if (teamsError) {
        console.error(
          "ALL TEAMS DASHBOARD ERROR:",
          teamsError
        );
      }

      const teams = (allTeams || []) as Team[];

      const allTeamIds = new Set(
        sortedPoints.map((item) => item.teamId)
      );

      teams.forEach((team) => {
        if (!allTeamIds.has(team.id)) {
          sortedPoints.push({
            teamId: team.id,
            points: 0,
          });
        }
      });

      sortedPoints.sort((a, b) => b.points - a.points);

      const rankIndex = sortedPoints.findIndex(
        (item) => item.teamId === user.team_id
      );

      if (rankIndex !== -1) {
        setTeamRank(rankIndex + 1);
      }

      // =========================
      // جلب حضور الطفل
      // =========================
      const {
        data: childAttendance,
        error: attendanceError,
      } = await supabase
        .from("attendance")
        .select("attendance_date")
        .eq("child_id", user.id);

      if (attendanceError) {
        console.error(
          "CHILD ATTENDANCE DASHBOARD ERROR:",
          attendanceError
        );
      }

      const attendanceDates = new Set(
        (childAttendance || []).map(
          (item) => item.attendance_date
        )
      );

      const childAttendanceCount =
        attendanceDates.size;

      setAttendanceCount(childAttendanceCount);

      // =========================
      // حساب نسبة الحضور
      // =========================
      const {
        data: allAttendance,
        error: allAttendanceError,
      } = await supabase
        .from("attendance")
        .select("attendance_date");

      if (allAttendanceError) {
        console.error(
          "ALL ATTENDANCE DASHBOARD ERROR:",
          allAttendanceError
        );
      }

      const serviceDays = new Set(
        (allAttendance || []).map(
          (item) => item.attendance_date
        )
      ).size;

      if (serviceDays > 0) {
        const percentage = Math.round(
          (childAttendanceCount / serviceDays) * 100
        );

        setAttendancePercentage(
          Math.min(percentage, 100)
        );
      } else {
        setAttendancePercentage(0);
      }
    } catch (error) {
      console.error(
        "CHILD DASHBOARD ERROR:",
        error
      );
    }

    setDashboardLoading(false);
  }

  async function login() {
    setMessage("");

    const cleanName = name.trim();

    if (!cleanName) {
      setMessage("اكتب اسمك الأول");
      return;
    }

    setLoading(true);

    try {
      // =========================
      // البحث عن الطفل
      // =========================
      const {
        data: children,
        error: childError,
      } = await supabase
        .from("children")
        .select("id, name, team_id, gender")
        .ilike("name", cleanName);

      if (childError) {
        console.error(
          "CHILD LOGIN ERROR:",
          JSON.stringify(childError, null, 2)
        );

        setMessage("حصل خطأ أثناء تسجيل الدخول");
        return;
      }

      // لو الطفل موجود
      if (children && children.length > 0) {
        if (children.length > 1) {
          setMessage(
            "الاسم ده موجود لأكتر من طالب، اكتب الاسم بالكامل"
          );
          return;
        }

        const child = children[0];

        const user: LoggedUser = {
          id: child.id,
          name: child.name,
          type: "child",
          gender: child.gender,
          team_id: child.team_id,
        };

        localStorage.setItem(
          "marathon_user",
          JSON.stringify(user)
        );

        setLoggedUser(user);

        // تحميل بيانات الطفل
        loadChildDashboard(user);

        return;
      }

      // =========================
      // البحث عن الخادم / Admin
      // =========================
      const {
        data: servants,
        error: servantError,
      } = await supabase
        .from("servants")
        .select("id, name, password, gender, role")
        .ilike("name", cleanName);

      if (servantError) {
        console.error(
          "SERVANT LOGIN ERROR:",
          JSON.stringify(servantError, null, 2)
        );

        setMessage("حصل خطأ أثناء تسجيل الدخول");
        return;
      }

      // لو خادم أو Admin موجود
      if (servants && servants.length > 0) {
        setNeedPassword(true);
        setMessage("اكتب كلمة السر");

        return;
      }

      // مش طفل ولا خادم
      setMessage("الاسم ده مش مسجل في الماراثون");
    } finally {
      setLoading(false);
    }
  }

  async function loginServant() {
    setMessage("");

    const cleanName = name.trim();

    if (!password) {
      setMessage("اكتب كلمة السر");
      return;
    }

    setLoading(true);

    try {
      const {
        data: servants,
        error,
      } = await supabase
        .from("servants")
        .select("id, name, password, gender, role")
        .ilike("name", cleanName);

      if (error) {
        console.error(
          "SERVANT LOGIN ERROR:",
          JSON.stringify(error, null, 2)
        );

        setMessage("حصل خطأ أثناء تسجيل الدخول");
        return;
      }

      const servant = servants?.find(
        (item) => item.password === password
      );

      if (!servant) {
        setMessage("كلمة السر غلط");
        return;
      }

      // =========================
      // تحديد نوع الحساب
      // =========================
      const user: LoggedUser = {
        id: servant.id,
        name: servant.name,
        type: "servant",
        gender: servant.gender,
        role: servant.role,
      };

      localStorage.setItem(
        "marathon_user",
        JSON.stringify(user)
      );

      // =========================
      // Admin
      // =========================
      if (servant.role === "admin") {
        window.location.href = "/admin/dashboard";
        return;
      }

      // =========================
      // Servant
      // =========================
      window.location.href = "/servant/dashboard";
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("marathon_user");

    setLoggedUser(null);
    setName("");
    setPassword("");
    setNeedPassword(false);
    setMessage("");
  }

  // =========================
  // التحية
  // =========================
  function getGreeting() {
    if (!loggedUser) {
      return "أهلاً يا بطل!";
    }

    // =========================
    // تحية الطفل
    // =========================
    if (loggedUser.type === "child") {
      if (loggedUser.gender === "female") {
        return `أهلاً يا بطلة (${loggedUser.name})`;
      }

      if (loggedUser.gender === "male") {
        return `أهلاً يا بطل (${loggedUser.name})`;
      }

      return `أهلاً يا (${loggedUser.name})`;
    }

    // =========================
    // تحية الخادم
    // =========================
    if (loggedUser.type === "servant") {
      if (loggedUser.gender === "female") {
        return `أهلاً يا تاسوني (${loggedUser.name})`;
      }

      if (loggedUser.gender === "male") {
        return `أهلاً يا أستاذ (${loggedUser.name})`;
      }
    }

    return `أهلاً يا (${loggedUser.name})`;
  }

function addQuestion() {
  setQuestions([
    ...questions,
    {
      question: "",
      answers: ["", "", "", ""],
      correctIndex: null,
      points: 10,
    },
  ]);
}

function updateQuestion(
  index: number,
  field: keyof QuestionItem,
  value: any
) {
  const newQuestions = [...questions];

  newQuestions[index] = {
    ...newQuestions[index],
    [field]: value,
  };

  setQuestions(newQuestions);
}

function updateAnswer(
  questionIndex: number,
  answerIndex: number,
  value: string
) {
  const newQuestions = [...questions];

  newQuestions[questionIndex].answers[answerIndex] = value;

  setQuestions(newQuestions);
}

function deleteQuestion(index: number) {
  setQuestions(
    questions.filter((_, i) => i !== index)
  );
}

  // =========================
  // صفحة تسجيل الدخول
  // =========================
  if (!loggedUser) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6"
      >
        <div className="mx-auto flex min-h-[90vh] w-full max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">

            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-medium text-blue-400">
                ماراثون الخدمة
              </p>

              <h1 className="text-3xl font-bold">
                أهلاً يا بطل!
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                اكتب اسمك عشان ندخلك على حسابك
              </p>
            </div>

            <div className="space-y-4">

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  الاسم
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setMessage("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !needPassword) {
                      login();
                    }

                    if (e.key === "Enter" && needPassword) {
                      loginServant();
                    }
                  }}
                  placeholder="اكتب اسمك"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              {needPassword && (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    كلمة السر
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setMessage("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loginServant();
                      }
                    }}
                    placeholder="اكتب كلمة السر"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={
                  needPassword
                    ? loginServant
                    : login
                }
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "جاري الدخول..."
                  : "دخول"}
              </button>

              {message && (
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-center text-sm font-semibold text-slate-200">
                  {message}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // حساب الخادم
  // =========================
  if (loggedUser.type === "servant") {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6"
      >
        <div className="mx-auto w-full max-w-5xl">

          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-blue-400">
                ماراثون الخدمة
              </p>

              <h1 className="text-2xl font-bold sm:text-3xl">
                {getGreeting()}
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                حساب الخادم
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
            >
              خروج
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">
                إضافة طفل
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                إضافة طفل جديد وتحديد فريقه ونوعه.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">
                إضافة فريق
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                إنشاء فريق جديد في الماراثون.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">
                الحضور
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                تسجيل حضور الأطفال ومتابعة الحضور.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">
                تعديل النقاط
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                إضافة أو خصم نقاط مع تسجيل السبب.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">
                الاعتراف
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                تسجيل اعتراف الأطفال وإضافة نقاط الفريق.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold">
                لوحة النتائج
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                متابعة ترتيب الفرق وإجمالي النقاط.
              </p>
            </div>

          </div>
        </div>
      </main>
    );
  }

  // =========================
  // حساب الطفل
  // =========================
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-6 sm:py-7"
    >
      <div className="mx-auto w-full max-w-5xl">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-400">
              ماراثون الخدمة
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              {getGreeting()}
            </h1>

            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              رحلتك بدأت... جاهز للتحدي؟
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
          >
            خروج
          </button>
        </div>

        {/* Team */}
        <div className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-900 p-5 shadow-xl sm:p-6">
          <p className="text-sm text-blue-100">
            فريقك
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold sm:text-3xl">
                {teamName}
              </h2>

              <p className="mt-2 text-sm text-blue-100 sm:text-base">
                مستعد للمنافسة؟
              </p>
            </div>

            <div className="shrink-0 text-4xl sm:text-5xl">
              🏆
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <p className="text-xs text-slate-400 sm:text-sm">
              ترتيب الفريق
            </p>

            <p className="mt-2 text-2xl font-bold sm:text-3xl">
              {dashboardLoading
                ? "..."
                : teamRank > 0
                ? `#${teamRank}`
                : "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <p className="text-xs text-slate-400 sm:text-sm">
              حضورك
            </p>

            <p className="mt-2 text-2xl font-bold sm:text-3xl">
              {dashboardLoading
                ? "..."
                : `${attendancePercentage}%`}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {attendanceCount} حضور
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:col-span-1 sm:p-5">
            <p className="text-xs text-slate-400 sm:text-sm">
              نقاط الفريق
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-400 sm:text-3xl">
              {dashboardLoading
                ? "..."
                : teamPoints}
            </p>
          </div>

        </div>

        {/* Progress */}
        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">

            <div>
              <p className="text-xs text-slate-400 sm:text-sm">
                تقدمك
              </p>

              <h2 className="mt-1 text-lg font-bold sm:text-xl">
                الأسبوع الأول
              </h2>
            </div>

            <span className="shrink-0 text-sm font-bold text-blue-400 sm:text-base">
              {attendancePercentage}/100
            </span>

          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800 sm:h-3">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${attendancePercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Weekly Lesson */}
<div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">

  <p className="mb-2 text-sm text-blue-400">
    درس الأسبوع
  </p>

  <h2 className="text-lg font-bold sm:text-xl">
    درس الأسبوع الحالي
  </h2>

  <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
    ادخل وشاهد شرح الدرس واحصل على نقاط فريقك.
  </p>

  <button
    type="button"
    onClick={() => {
      window.location.href = "/child-weekly-lesson";
    }}
    className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-500"
  >
    دخول الدرس 📖
  </button>

</div>

{/* Bible Reading */}

<div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">

  <p className="mb-2 text-sm text-green-400">
    قراءة الكتاب المقدس
  </p>

  <h2 className="text-lg font-bold sm:text-xl">
    قراءة اليوم 📖
  </h2>

  <p className="mt-2 text-sm leading-6 text-slate-400 sm:text-base">
    اقرأ الإصحاح المحدد وجاوب على سؤال اليوم لتحصل على نقطتين لفريقك.
  </p>

  <button
    type="button"
    onClick={() => {
      window.location.href = "/child-bible";
    }}
    className="mt-4 w-full rounded-xl bg-green-600 py-3 font-bold transition hover:bg-green-500"
  >
    دخول قراءة الكتاب المقدس ✝️
  </button>

</div>


      </div>
    </main>
  );
}