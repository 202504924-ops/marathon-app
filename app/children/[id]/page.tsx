"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";


type Child = {
  id:number;
  name:string;
  gender:"male"|"female";
  team_id:number;

  father_name:string | null;
  father_phone:string | null;

  mother_name:string | null;
  mother_phone:string | null;

  address:string | null;
  child_phone:string | null;
};


type Team = {
  id:number;
  name:string;
};



export default function ChildProfile(){


const params = useParams();

const router = useRouter();

const id = Number(params.id);



const [child,setChild] = useState<Child|null>(null);

const [team,setTeam] = useState<Team|null>(null);


const [attendanceCount,setAttendanceCount] = useState(0);

const [points,setPoints] = useState(0);
const [massCount,setMassCount] = useState(0);
const [confessionCount,setConfessionCount] = useState(0);

const [loading,setLoading] = useState(true);




useEffect(()=>{

loadChild();

},[]);




async function loadChild(){



const {data,error} = await supabase
.from("children")
.select("*")
.eq("id",id)
.single();



if(error){

console.log(error);

setLoading(false);

return;

}



setChild(data);





const {data:teamData} = await supabase
.from("teams")
.select("id,name")
.eq("id",data.team_id)
.single();



setTeam(teamData);





// =====================
// الحضور
// =====================

const {count:attendance} = await supabase
.from("attendance")
.select("id",{count:"exact",head:true})
.eq("child_id",id);



setAttendanceCount(attendance || 0);





// =====================
// النقاط
// =====================

const {data:answers} = await supabase
.from("child_lesson_answers")
.select("points")
.eq("child_id",id);



const totalPoints = (answers || [])
.reduce(
(sum,item)=> sum + (item.points || 0),
0
);



setPoints(totalPoints);




setLoading(false);


}





if(loading){

return(

<main
dir="rtl"
className="min-h-screen bg-slate-950 text-white flex items-center justify-center"
>

جاري تحميل الملف...

</main>

)

}





if(!child){

return(

<main
dir="rtl"
className="min-h-screen bg-slate-950 text-white p-6"
>

الطفل غير موجود

</main>

)

}





return(


<main
dir="rtl"
className="min-h-screen bg-slate-950 text-white p-5"
>


<div className="mx-auto max-w-3xl">



<button
onClick={()=>router.back()}
className="mb-6 text-slate-400"
>

← رجوع

</button>

<button
  onClick={() => router.push(`/children/${child.id}/edit`)}
  className="mb-6 rounded-xl bg-blue-600 px-4 py-2 font-bold"
>
  ✏️ تعديل بيانات الطفل
</button>



<div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">





<h1 className="text-3xl font-bold">

👦 {child.name}

</h1>




<p className="mt-2 text-blue-400">

الفريق: {team?.name || "غير محدد"}

</p>




<p className="text-slate-400">

النوع:
{" "}
{child.gender==="male"
?"ولد"
:"بنت"
}

</p>







<div className="mt-8 rounded-2xl bg-slate-950 p-5">


<h2 className="mb-4 text-xl font-bold">

👨‍👩‍👦 بيانات الأسرة

</h2>




<p>
الأب:
<span className="text-slate-400">
{" "}
{child.father_name || "غير مسجل"}
</span>
</p>



<p className="mt-2">

رقم الأب:

<span className="text-slate-400">
{" "}
{child.father_phone || "غير مسجل"}
</span>

</p>




<p className="mt-2">

الأم:

<span className="text-slate-400">
{" "}
{child.mother_name || "غير مسجل"}
</span>

</p>




<p className="mt-2">

رقم الأم:

<span className="text-slate-400">
{" "}
{child.mother_phone || "غير مسجل"}
</span>

</p>




<p className="mt-2">

العنوان:

<span className="text-slate-400">
{" "}
{child.address || "غير مسجل"}
</span>

</p>




<p className="mt-2">

رقم الطفل:

<span className="text-slate-400">
{" "}
{child.child_phone || "غير مسجل"}
</span>

</p>



</div>









<div className="mt-6 grid grid-cols-2 gap-4">



<div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

<p className="text-sm text-slate-400">

📋 الحضور

</p>


<h3 className="text-2xl font-bold">

{attendanceCount}

</h3>


</div>






<div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">

<p className="text-sm text-slate-400">

⭐ النقاط

</p>


<h3 className="text-2xl font-bold">

{points}

</h3>


</div>




</div>







<div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">


<h2 className="text-xl font-bold">

📌 المتابعة

</h2>


<p className="mt-3 text-slate-400">

⛪ القداسات: سيتم ربطها بعد إنشاء جدول القداس

</p>


<p className="mt-2 text-slate-400">

✝️ الاعترافات: سيتم ربطها بعد إنشاء جدول الاعتراف

</p>


<p className="mt-2 text-slate-400">

📖 الكتاب المقدس: سيتم إضافته في النظام الجديد

</p>


</div>





</div>


</div>


</main>


)


}