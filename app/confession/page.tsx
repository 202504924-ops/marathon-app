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


  const [showConfessed, setShowConfessed] =
    useState(false);

  const [showNotConfessed, setShowNotConfessed] =
    useState(false);



  useEffect(() => {
    loadData();
  }, []);




  async function loadData(){

    setLoading(true);

    try{


      const [
        childrenResult,
        teamsResult,
        confessionsResult
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
          .from("confessions")
          .select("child_id")


      ]);



      if(
        childrenResult.error ||
        teamsResult.error ||
        confessionsResult.error
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


      setConfessions(
        confessionsResult.data || []
      );



    }

    catch(error){

      console.error(error);

      setMessage(
        "حصل خطأ أثناء تحميل الصفحة"
      );

    }


    finally{

      setLoading(false);

    }

  }




  function getToday(){

    return new Date()
      .toLocaleDateString(
        "en-CA",
        {
          timeZone:"Africa/Cairo"
        }
      );

  }





  function getTeamName(teamId:number){

    return (
      teams.find(
        team =>
          team.id === teamId
      )?.name || "بدون فريق"
    );

  }




  function hasConfessed(childId:number){

    return confessions.some(
      item =>
        item.child_id === childId
    );

  }




  function getConfessionPoints(
    percentage:number
  ){

    if(percentage >= 75){

      return 500;

    }


    if(percentage >= 50){

      return 350;

    }


    return 200;

  }





  async function calculateTeamConfession(
    teamId:number
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



    if(total === 0){

      return {
        percentage:0,
        points:0
      };

    }



    const ids =
      teamChildren.map(
        child =>
          child.id
      );



    const {
      data:teamConfessions,
      error:confessionError
    } = await supabase
      .from("confessions")
      .select("child_id")
      .in(
        "child_id",
        ids
      );



    if(confessionError)
      throw confessionError;




    const confessed =
      teamConfessions?.length || 0;



    const percentage =
      (confessed / total) * 100;



    return {

      percentage,

      points:
        getConfessionPoints(
          percentage
        )

    };


  }
    async function registerConfession(){

    if(!selectedChild){

      setMessage(
        "اختار الطفل أولاً"
      );

      return;

    }



    if(hasConfessed(selectedChild.id)){

      setMessage(
        "الطفل دا سجل اعترافه بالفعل"
      );

      return;

    }



    setRegistering(true);
    setMessage("");



    try{


      // تسجيل اعتراف الطفل
      const {
        error: confessionError
      } = await supabase
        .from("confessions")
        .insert({

          child_id:
            selectedChild.id

        });



      if(confessionError){

        console.error(confessionError);

        setMessage(
          "حصل خطأ أثناء تسجيل الاعتراف"
        );

        return;

      }




      // حساب نسبة الفريق
      const result =
        await calculateTeamConfession(
          selectedChild.team_id
        );




      const today =
        getToday();



      const reason =
        `اعترافات الفريق ${Math.round(
          result.percentage
        )}%`;





     // البحث عن نقاط الاعتراف الحالية للفريق
const {
  data: oldPoint,
  error: oldPointError
} = await supabase
  .from("team_points")
  .select("id")
  .eq(
    "team_id",
    selectedChild.team_id
  )
  .eq(
    "type",
    "confession"
  )
  .maybeSingle();



if(oldPointError){

  throw oldPointError;

}



// لو موجودة نحدثها
if(oldPoint){


  const {
    error:updateError
  } = await supabase
    .from("team_points")
    .update({

      points:
        result.points,

      reason,

      activity_date:
        today

    })
    .eq(
      "id",
      oldPoint.id
    );


  if(updateError){

    throw updateError;

  }


}


// لو مش موجودة نضيفها
else{


  const {
    error:insertError
  } = await supabase
    .from("team_points")
    .insert({

      team_id:
        selectedChild.team_id,

      points:
        result.points,

      type:
        "confession",

      reason,

      activity_date:
        today

    });


  if(insertError){

    throw insertError;

  }

}





      setConfessions(prev => [

        ...prev,

        {
          child_id:
            selectedChild.id
        }

      ]);




      setMessage(
        `تم تسجيل اعتراف ${selectedChild.name} ✅ نسبة الفريق ${Math.round(result.percentage)}% والنقاط ${result.points}`
      );



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





  const confessedChildren =
    children.filter(
      child =>
        hasConfessed(child.id)
    );




  const notConfessedChildren =
    children.filter(
      child =>
        !hasConfessed(child.id)
    );






  return (

    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white"
    >

      <div className="mx-auto w-full max-w-2xl">


        <button
          onClick={() =>
            window.location.href =
            "/servant/dashboard"
          }
          className="mb-6 text-sm text-slate-400"
        >

          ← رجوع للوحة التحكم

        </button>



        <p className="text-sm text-purple-400">
          ماراثون الخدمة
        </p>



        <h1 className="mt-2 text-3xl font-bold">
          تسجيل الاعتراف
        </h1>



        <p className="mt-2 text-slate-400">
          النقاط تحسب حسب نسبة اعترافات الفريق
        </p>




        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">

          <p className="text-sm text-slate-400">
            عدد الأطفال الذين اعترفوا
          </p>


          <p className="mt-2 text-4xl font-bold text-purple-400">

            {confessions.length}

          </p>

        </div>






        <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-900 p-5">


          <label className="text-sm text-slate-300">
            اسم الطفل
          </label>



          <input

            value={search}

            onChange={(e)=>{

              setSearch(e.target.value);

              setSelectedChild(null);

              setMessage("");

            }}

            placeholder="اكتب اسم الطفل..."

            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"

          />




          {search.trim() &&
          !selectedChild && (

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

                    onClick={() =>
                      setSelectedChild(child)
                    }

                    className="flex w-full justify-between border-b border-slate-800 p-4 text-right"

                  >

                    <div>

                      <p className="font-bold">
                        {child.name}
                      </p>


                      <p className="text-xs text-slate-500">
                        الفريق:
                        {getTeamName(child.team_id)}
                      </p>


                    </div>



                    {
                      hasConfessed(child.id)

                      ?

                      <span className="text-green-400">
                        تم
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

          )}






          {selectedChild && (

            <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">


              <h2 className="text-2xl font-bold">
                {selectedChild.name}
              </h2>


              <p className="text-sm text-slate-400">
                الفريق:
                {getTeamName(selectedChild.team_id)}
              </p>




              <button

                onClick={registerConfession}

                disabled={registering}

                className="mt-5 w-full rounded-xl bg-purple-600 py-3 font-bold"

              >

                {
                  registering

                  ?

                  "جاري التسجيل..."

                  :

                  "تسجيل الاعتراف"

                }


              </button>



            </div>

          )}






          {message && (

            <div className="mt-5 rounded-xl bg-slate-950 p-4 text-center font-bold">

              {message}

            </div>

          )}



        </div>



      </div>


    </main>

  );

}