"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


type Child = {
  id:number;
  name:string;
  gender:"male"|"female";
  team_id:number;
};


type Team = {
  name:string;
};


export default function ChildDetails(){


  const router = useRouter();

  const params = useParams();

  const childId = Number(params.id);



  const [child,setChild] = useState<Child | null>(null);

  const [team,setTeam] = useState<Team | null>(null);


  const [attendance,setAttendance] = useState(0);

  const [confessions,setConfessions] = useState(0);

  const [psalm,setPsalm] = useState(0);

  const [points,setPoints] = useState(0);


  const [loading,setLoading] = useState(true);





  useEffect(()=>{


    async function loadChild(){


      try{


        const {data:childData,error:childError}
        =
        await supabase
        .from("children")
        .select(
          "id,name,gender,team_id"
        )
        .eq(
          "id",
          childId
        )
        .single();



        if(childError)
          throw childError;



        setChild(childData);





        const {data:teamData}
        =
        await supabase
        .from("teams")
        .select("name")
        .eq(
          "id",
          childData.team_id
        )
        .single();



        setTeam(teamData);





        const attendanceRes =
        await supabase
        .from("attendance")
        .select(
          "id",
          {
            count:"exact",
            head:true
          }
        )
        .eq(
          "child_id",
          childId
        );



        setAttendance(
          attendanceRes.count ?? 0
        );






        const confessionRes =
        await supabase
        .from("confessions")
        .select(
          "id",
          {
            count:"exact",
            head:true
          }
        )
        .eq(
          "child_id",
          childId
        );



        setConfessions(
          confessionRes.count ?? 0
        );







        const psalmRes =
        await supabase
        .from("psalm_recitations")
        .select(
          "id",
          {
            count:"exact",
            head:true
          }
        )
        .eq(
          "child_id",
          childId
        );



        setPsalm(
          psalmRes.count ?? 0
        );








        const {data:pointsData}
        =
        await supabase
        .from("points")
        .select(
          "points"
        )
        .eq(
          "child_id",
          childId
        );



        const totalPoints =
        pointsData?.reduce(
          (sum,item)=>
          sum + Number(item.points || 0),
          0
        )
        ||0;



        setPoints(totalPoints);





      }
      catch(error){

        console.log(
          "Child Details Error",
          error
        );

      }
      finally{

        setLoading(false);

      }



    }



    if(childId)
      loadChild();



  },[childId]);






  if(loading){

    return(

      <main
      dir="rtl"
      className="
      min-h-screen
      bg-[#050816]
      text-white
      flex
      items-center
      justify-center
      "
      >

        جاري تحميل بيانات الطفل...

      </main>

    );

  }





  return(

   <main
dir="rtl"
className="
min-h-screen
bg-[#050816]
text-white
px-5
py-8
page-enter
"
>


      <div
      className="
      max-w-3xl
      mx-auto
      "
      >


        <button

        onClick={()=>router.back()}

        className="
        text-slate-400
        mb-6
        "
        >

          ← رجوع

        </button>





        <div
        className="
        rounded-[40px]
        bg-gradient-to-br
        from-blue-700
        via-blue-900
        to-black
        p-7
        shadow-2xl
        "
        >


          <div
          className="
          text-6xl
          "
          >

            {
              child?.gender==="female"
              ?
              "👧"
              :
              "👦"
            }

          </div>



          <h1
          className="
          text-4xl
          font-black
          mt-4
          "
          >

            {child?.name}

          </h1>



          <p
          className="
          mt-2
          text-blue-200
          "
          >

            الفريق: {team?.name}

          </p>



        </div>







        <div
        className="
        mt-6
        grid
        grid-cols-2
        gap-4
        "
        >



          <Card
          icon="📋"
          title="الحضور"
          value={attendance}
          />



          <Card
          icon="✝️"
          title="الاعتراف"
          value={confessions}
          />



          <Card
          icon="📖"
          title="المزمور"
          value={psalm}
          />



          <Card
          icon="⭐"
          title="النقاط"
          value={points}
          />



        </div>





      </div>


    </main>

  );

}





function Card({

icon,

title,

value,

}:{

icon:string;

title:string;

value:number;

}){


return(

<div

className="
rounded-3xl
bg-white/10
border
border-white/10
p-5
backdrop-blur-xl
"

>


<div className="text-3xl">

{icon}

</div>


<p className="
mt-3
text-slate-400
">

{title}

</p>


<h2 className="
text-4xl
font-black
mt-2
">

{value}

</h2>


</div>


);


}