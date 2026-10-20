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
  points: number;
};

export default function AttendancePage() {

  const [children, setChildren] = useState<Child[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] =
    useState<Child | null>(null);

  const [loading, setLoading] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [showPresent, setShowPresent] = useState(false);
  const [showAbsent, setShowAbsent] = useState(false);


  useEffect(() => {
    loadData();
  }, []);


  function getToday() {
    return new Date().toLocaleDateString("en-CA", {
      timeZone: "Africa/Cairo",
    });
  }


  function isFriday(date: Date) {
    return date.getDay() === 5;
  }


  async function loadData() {

    const today = getToday();

    const [
      childrenResult,
      teamsResult,
      attendanceResult,
    ] = await Promise.all([

      supabase
        .from("children")
        .select("id,name,team_id")
        .order("name"),

      supabase
        .from("teams")
        .select("id,name")
        .order("id"),

      supabase
  .from("attendance")
  .select("child_id, points")
  .eq("attendance_date", today)

    ]);


    if (
      childrenResult.error ||
      teamsResult.error ||
      attendanceResult.error
    ) {
      setMessage("حصل خطأ أثناء تحميل البيانات");
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


  function getTeamName(teamId:number){

    return (
      teams.find(
        team => team.id === teamId
      )?.name || "بدون فريق"
    );

  }


  async function registerAttendance(){

    setMessage("");

    if(!selectedChild){
      setMessage("اختار الطفل أولاً");
      return;
    }


    if(!isFriday(new Date())){
      setMessage("تسجيل الحضور متاح يوم الجمعة فقط");
      return;
    }


    if(todayAttendance.includes(selectedChild.id)){
      setMessage("الطفل ده متسجل حضوره بالفعل");
      return;
    }


    setLoading(true);


    const today = getToday();


    const now = new Date();

const cairoTime = new Date(
  now.toLocaleString("en-US", {
    timeZone: "Africa/Cairo",
  })
);

const hour = cairoTime.getHours();
const minute = cairoTime.getMinutes();

let attendancePoints = 0;

if (
  hour === 10 &&
  minute >= 30 &&
  minute < 35
) {
  attendancePoints = 100;
}

else if (
  hour === 10 &&
  minute >= 35 &&
  minute < 40
) {
  attendancePoints = 70;
}

else if (
  hour === 10 &&
  minute >= 40 &&
  minute < 41
) {
  attendancePoints = 40;
}

else {
  setMessage("وقت تسجيل الحضور انتهى");
  setLoading(false);
  return;
}


const { error } = await supabase
  .from("attendance")
  .insert({

    child_id: selectedChild.id,

    attendance_date: today,

    attendance_time:
      `${hour}:${minute}`,

    points: attendancePoints,

  });



    if(error){

      console.error(error);

      setMessage("حصل خطأ أثناء تسجيل الحضور");

      setLoading(false);

      return;
    }



    setTodayAttendance(prev => [
      ...prev,
      selectedChild.id
    ]);



    setMessage(
      `تم تسجيل حضور ${selectedChild.name} بنجاح`
    );


    setSelectedChild(null);
    setSearch("");

    setLoading(false);

  }



  async function calculateAttendancePoints(){

    setMessage("");

    if(!isFriday(new Date())){
      setMessage("حساب النقاط متاح يوم الجمعة فقط");
      return;
    }


    setPointsLoading(true);


    try{

      for(const team of teams){

        const teamChildren = children.filter(
          child => child.team_id === team.id
        );


        if(teamChildren.length === 0)
          continue;



        const presentCount = teamChildren.filter(
          child => todayAttendance.includes(child.id)
        ).length;



        const percentage =
          (presentCount / teamChildren.length) * 100;



       let teamAttendancePoints = 40;

if(percentage > 75){
  teamAttendancePoints = 100;
}
else if(percentage >= 50){
  teamAttendancePoints = 70;
}
else {
  teamAttendancePoints = 40;
}



        const { data: oldPoint } = await supabase
          .from("team_points")
          .select("id")
          .eq("team_id",team.id)
          .eq("type","attendance")
          .eq(
            "reason",
            `attendance-${getToday()}`
          )
          .maybeSingle();



        if(oldPoint){
          continue;
        }



        await supabase
          .from("team_points")
          .insert({

            team_id:team.id,
            points: teamAttendancePoints,
            type:"attendance",
            reason:`attendance-${getToday()}`

          });

      }


      setMessage(
        "تم حساب نقاط الحضور للفرق ✅"
      );


    }
    catch(error){

      console.error(error);

      setMessage(
        "حصل خطأ أثناء حساب النقاط"
      );

    }
    finally{

      setPointsLoading(false);

    }

  }


  const filteredChildren = children.filter((child) =>
    child.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  const presentChildren = children.filter((child) =>
    todayAttendance.includes(child.id)
  );


  const absentChildren = children.filter((child) =>
    !todayAttendance.includes(child.id)
  );


  return (
        <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white"
    >

      <div className="mx-auto w-full max-w-2xl">


        <button
          type="button"
          onClick={() =>
            (window.location.href="/servant/dashboard")
          }
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← رجوع للوحة التحكم
        </button>



        <p className="mb-2 text-sm text-blue-400">
          ماراثون الخدمة
        </p>


        <h1 className="text-3xl font-bold">
          تسجيل الحضور
        </h1>


        <p className="mt-2 text-slate-400">
          الحضور يوم الجمعة فقط
        </p>




        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-5">


          <label className="mb-2 block text-sm text-slate-300">
            البحث عن الطفل
          </label>



          <input

            type="text"

            value={search}

            onChange={(e)=>{

              setSearch(e.target.value);

              setSelectedChild(null);

              setMessage("");

            }}

            placeholder="اكتب اسم الطفل..."

            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"

          />




          {search.trim() && !selectedChild && (

            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950">


              {filteredChildren.length === 0 ? (

                <p className="p-4 text-center text-slate-500">
                  مفيش طفل بالاسم ده
                </p>

              ) : (

                filteredChildren.map((child)=>(


                  <button

                    key={child.id}

                    type="button"

                    onClick={()=>{

                      setSelectedChild(child);

                      setSearch(child.name);

                    }}

                    className="flex w-full justify-between border-b border-slate-800 px-4 py-3 text-right hover:bg-slate-800"

                  >

                    <div>

                      <p className="font-bold">
                        {child.name}
                      </p>


                      <p className="text-xs text-slate-500">
                        الفريق: {getTeamName(child.team_id)}
                      </p>

                    </div>


                    {todayAttendance.includes(child.id)

                      ?

                      <span className="text-green-400">
                        حاضر
                      </span>

                      :

                      <span className="text-blue-400">
                        اختيار
                      </span>

                    }


                  </button>


                ))

              )}


            </div>

          )}






          {selectedChild && (

            <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">


              <p className="text-slate-400">
                الطفل المختار
              </p>


              <h2 className="text-2xl font-bold">
                {selectedChild.name}
              </h2>


              <p className="text-sm text-slate-400">
                الفريق: {getTeamName(selectedChild.team_id)}
              </p>



              <button

                onClick={registerAttendance}

                disabled={loading}

                className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-bold"

              >

                {loading
                  ? "جاري التسجيل..."
                  : "تسجيل الحضور"
                }

              </button>


            </div>

          )}






          {message && (

            <div className="mt-5 rounded-xl bg-slate-950 p-4 text-center font-bold">

              {message}

            </div>

          )}






          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center">


            <p className="text-slate-400">
              عدد الحضور اليوم
            </p>


            <p className="mt-2 text-4xl font-bold text-blue-400">

              {todayAttendance.length}

            </p>


          </div>





          <button

            type="button"

            onClick={calculateAttendancePoints}

            disabled={pointsLoading}

            className="mt-5 w-full rounded-xl bg-green-600 py-3 font-bold hover:bg-green-500 disabled:opacity-50"

          >

            {pointsLoading

              ? "جاري حساب النقاط..."

              : "⭐ حساب نقاط الحضور للفرق"

            }

          </button>








          <div className="mt-5 space-y-4">



            <button

              onClick={()=>setShowPresent(!showPresent)}

              className="flex w-full justify-between rounded-2xl border border-green-500/30 bg-green-500/10 p-4"

            >

              <span className="font-bold text-green-400">

                ✅ حضروا اليوم ({presentChildren.length})

              </span>


              <span>
                {showPresent ? "▲" : "▼"}
              </span>


            </button>





            {showPresent && (

              <div className="rounded-2xl bg-slate-950 p-4">


                {presentChildren.length === 0 ? (

                  <p className="text-slate-400">
                    لا يوجد حضور حتى الآن
                  </p>

                ) : (

                  presentChildren.map(child=>(

                    <p
                      key={child.id}
                      className="mb-2"
                    >

                      ✅ {child.name}

                    </p>

                  ))

                )}


              </div>

            )}







            <button

              onClick={()=>setShowAbsent(!showAbsent)}

              className="flex w-full justify-between rounded-2xl border border-red-500/30 bg-red-500/10 p-4"

            >

              <span className="font-bold text-red-400">

                ❌ لم يحضروا ({absentChildren.length})

              </span>


              <span>
                {showAbsent ? "▲" : "▼"}
              </span>


            </button>







            {showAbsent && (

              <div className="rounded-2xl bg-slate-950 p-4">


                {absentChildren.length === 0 ? (

                  <p className="text-slate-400">
                    كل الأطفال حضروا 🎉
                  </p>

                ) : (

                  absentChildren.map(child=>(

                    <p
                      key={child.id}
                      className="mb-2"
                    >

                      ❌ {child.name}

                    </p>

                  ))

                )}


              </div>

            )}






          </div>




        </div>


      </div>


    </main>
  );

}
