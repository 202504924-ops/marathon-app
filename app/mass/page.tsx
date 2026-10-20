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
  const [massAttendance, setMassAttendance] = useState<MassAttendance[]>([]);

  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const [weekStart, setWeekStart] = useState("");

  const [showPresent, setShowPresent] = useState(false);
  const [showAbsent, setShowAbsent] = useState(false);


  useEffect(() => {

    const currentWeek = getMassWeekStart();

    setWeekStart(currentWeek);

    loadData(currentWeek);

  }, []);



  function getCairoDate(){

    return new Date(
      new Date().toLocaleString(
        "en-US",
        {
          timeZone:"Africa/Cairo"
        }
      )
    );

  }



  function formatDate(date:Date){

    const year = date.getFullYear();

    const month = String(
      date.getMonth()+1
    ).padStart(2,"0");

    const day = String(
      date.getDate()
    ).padStart(2,"0");


    return `${year}-${month}-${day}`;

  }



  function getMassWeekStart(){

    const today = getCairoDate();

    const day = today.getDay();

    const daysSinceFriday =
      (day + 2) % 7;


    const friday = new Date(today);


    friday.setDate(
      today.getDate() - daysSinceFriday
    );


    return formatDate(friday);

  }



  function getWeekEnd(start:string){

    const date = new Date(
      `${start}T00:00:00`
    );


    date.setDate(
      date.getDate()+6
    );


    return formatDate(date);

  }



  async function loadData(currentWeek:string){

    setLoading(true);

    setMessage("");


    try{


      const [
        childrenResult,
        teamsResult,
        massResult
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
        .from("mass_attendance")
        .select(
          "child_id,mass_week_start"
        )
        .eq(
          "mass_week_start",
          currentWeek
        )


      ]);



      if(
        childrenResult.error ||
        teamsResult.error ||
        massResult.error
      ){

        setMessage(
          "حصل خطأ أثناء تحميل البيانات"
        );

        return;

      }



      setChildren(
        childrenResult.data || []
      );


      setTeams(
        teamsResult.data || []
      );


      setMassAttendance(
        massResult.data || []
      );



    }
    catch(error){

      console.error(error);

      setMessage(
        "حصل خطأ أثناء تحميل بيانات القداس"
      );

    }
    finally{

      setLoading(false);

    }


  }



  function getTeamName(teamId:number){

    return (
      teams.find(
        team => team.id === teamId
      )?.name || "بدون فريق"
    );

  }



  function hasAttendedMass(childId:number){

    return massAttendance.some(
      item =>
        item.child_id === childId &&
        item.mass_week_start === weekStart
    );

  }



  function getMassPoints(percentage:number){

    if(percentage >= 75){

      return 100;

    }


    if(percentage >= 50){

      return 70;

    }


    return 40;

  }



  async function updateMassPoints(
    teamId:number,
    currentWeek:string
  ){

    const {
      data:teamChildren,
      error
    } = await supabase
      .from("children")
      .select("id")
      .eq(
        "team_id",
        teamId
      );


    if(error)
      throw error;



    const total =
      teamChildren?.length || 0;


    if(total === 0)
      return null;



    const ids =
      teamChildren.map(
        child=>child.id
      );



    const {
      data:attendance
    } = await supabase
      .from("mass_attendance")
      .select("child_id")
      .eq(
        "mass_week_start",
        currentWeek
      )
      .in(
        "child_id",
        ids
      );



    const present =
      attendance?.length || 0;



    const percentage =
      (present / total) * 100;



    const points =
      getMassPoints(
        percentage
      );



    await supabase
      .from("team_points")
      .upsert({

        team_id:teamId,

        points,

        type:"mass",

        activity_date:currentWeek,

        reason:
        `قداس ${currentWeek}`

      },
      {
        onConflict:
        "team_id,type,activity_date"
      });



    return {
      percentage,
      points
    };

  }
    async function registerMass(){

    if(!selectedChild){

      setMessage(
        "اختار الطفل أولاً"
      );

      return;

    }



    if(hasAttendedMass(selectedChild.id)){

      setMessage(
        "الطفل دا متسجل في قداس الأسبوع ده بالفعل"
      );

      return;

    }



    setRegistering(true);

    setMessage("");



    try{


      const {
        error
      } = await supabase
        .from("mass_attendance")
        .insert({

          child_id:selectedChild.id,

          mass_week_start:weekStart

        });



      if(error){

        if(error.code === "23505"){

          setMessage(
            "الطفل دا متسجل في قداس الأسبوع ده بالفعل"
          );

        }else{

          setMessage(
            "حصل خطأ أثناء تسجيل القداس"
          );

        }


        return;

      }



      const result =
        await updateMassPoints(
          selectedChild.team_id,
          weekStart
        );



      setMassAttendance(
        prev => [
          ...prev,
          {
            child_id:selectedChild.id,
            mass_week_start:weekStart
          }
        ]
      );



      if(result){

        setMessage(
          `تم تسجيل ${selectedChild.name} ✅ نسبة الفريق ${Math.round(result.percentage)}% ونقاط الأسبوع ${result.points}`
        );

      }else{

        setMessage(
          `تم تسجيل ${selectedChild.name} بنجاح`
        );

      }



      setSelectedChild(null);

      setSearch("");



    }
    catch(error){

      console.error(error);

      setMessage(
        "حصل خطأ أثناء التسجيل"
      );


    }
    finally{

      setRegistering(false);

    }

  }



  const filteredChildren =
    children.filter(child =>
      child.name
      .toLowerCase()
      .includes(
        search.toLowerCase()
      )
    );



  const weekEnd =
    weekStart
    ? getWeekEnd(weekStart)
    : "";



  const presentChildren =
    children.filter(child =>
      hasAttendedMass(child.id)
    );



  const absentChildren =
    children.filter(child =>
      !hasAttendedMass(child.id)
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
            window.location.href="/servant/dashboard"
          }
          className="mb-6 text-sm text-slate-400"
        >

          ← رجوع للوحة التحكم

        </button>



        <p className="text-sm text-blue-400">

          ماراثون الخدمة

        </p>



        <h1 className="mt-2 text-3xl font-bold">

          حضور القداس

        </h1>



        <p className="mt-2 text-slate-400">

          تسجيل قداس واحد لكل طفل في الأسبوع

        </p>




        <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">


          <div className="rounded-2xl bg-slate-950 p-4">

            <p className="text-sm text-slate-400">

              أسبوع القداس

            </p>


            <p className="mt-2 font-bold">

              الجمعة {weekStart}

            </p>


            <p className="text-sm text-slate-500">

              حتى الخميس {weekEnd}

            </p>


          </div>




          <div className="mt-5">

            <label className="mb-2 block text-sm text-slate-300">

              البحث عن الطفل

            </label>


            <input

              value={search}

              onChange={(e)=>{

                setSearch(e.target.value);

                setSelectedChild(null);

                setMessage("");

              }}

              placeholder="اكتب اسم الطفل..."

              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"

            />


          </div>





          {
            search.trim() &&
            !selectedChild &&
            (

              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950">


                {
                  loading ?

                  <p className="p-4 text-center">
                    جاري التحميل...
                  </p>


                  :

                  filteredChildren.map(child=>(


                    <button

                      key={child.id}

                      type="button"

                      onClick={()=>{

                        setSelectedChild(child);

                      }}

                      className="flex w-full justify-between border-b border-slate-800 p-4 text-right"

                    >

                      <div>

                        <p className="font-bold">

                          {child.name}

                        </p>


                        <p className="text-xs text-slate-500">

                          الفريق: {getTeamName(child.team_id)}

                        </p>


                      </div>



                      {
                        hasAttendedMass(child.id)

                        ?

                        <span className="text-green-400">

                          حضر

                        </span>

                        :

                        <span className="text-purple-400">

                          اختيار

                        </span>

                      }


                    </button>


                  ))

                }


              </div>

            )

          }






          {
            selectedChild &&

            <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">


              <h2 className="text-2xl font-bold">

                {selectedChild.name}

              </h2>


              <p className="text-sm text-slate-400">

                الفريق: {getTeamName(selectedChild.team_id)}

              </p>



              <button

                onClick={registerMass}

                disabled={registering}

                className="mt-5 w-full rounded-xl bg-purple-600 py-3 font-bold"

              >

                {
                  registering

                  ?

                  "جاري التسجيل..."

                  :

                  "تسجيل حضور القداس"

                }


              </button>



            </div>

          }






          {
            message &&

            <div className="mt-5 rounded-xl bg-slate-950 p-4 text-center font-bold">

              {message}

            </div>

          }






          <div className="mt-5 space-y-4">


            <button

              onClick={()=>setShowPresent(!showPresent)}

              className="flex w-full justify-between rounded-2xl border border-green-500/30 bg-green-500/10 p-4"

            >

              <span className="font-bold text-green-400">

                ✅ حضروا القداس ({presentChildren.length})

              </span>


              <span>

                {showPresent ? "▲" : "▼"}

              </span>


            </button>




            {
              showPresent &&

              <div className="rounded-2xl bg-slate-950 p-4">

                {
                  presentChildren.map(child=>(

                    <p key={child.id} className="mb-2">

                      ✅ {child.name}

                    </p>

                  ))
                }

              </div>

            }






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




            {
              showAbsent &&

              <div className="rounded-2xl bg-slate-950 p-4">

                {
                  absentChildren.map(child=>(

                    <p key={child.id} className="mb-2">

                      ❌ {child.name}

                    </p>

                  ))
                }


              </div>

            }



          </div>



        </div>


      </div>


    </main>

  );

}