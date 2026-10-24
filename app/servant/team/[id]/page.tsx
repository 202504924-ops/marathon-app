"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


type Child = {
  id:number;
  name:string;
  gender:"male" | "female";
  attendance_count:number;
  confession:boolean;
  psalm:boolean;
  mass:boolean;
};


type Team = {
  id:number;
  name:string;
};


type PointHistory = {
  id:number;
  points:number;
  type:string;
  reason:string;
  added_by:string | null;
  created_at:string;
};



export default function TeamPage(){


const router = useRouter();
const params = useParams();


const teamId = Number(params.id);



const [team,setTeam] =
useState<Team | null>(null);


const [children,setChildren] =
useState<Child[]>([]);


const [pointsHistory,setPointsHistory] =
useState<PointHistory[]>([]);


const [loading,setLoading] =
useState(true);


const [showPointsHistory,setShowPointsHistory] =
useState(false);




useEffect(()=>{


async function loadTeam(){


try{


const {
data:teamData,
error:teamError

}=await supabase
.from("teams")
.select("id,name")
.eq("id",teamId)
.single();



if(teamError)
throw teamError;



setTeam(teamData);





const {
data:childrenData,
error:childrenError

}=await supabase
.rpc(
"get_team_children_details",
{
team_id_input:teamId
}
);



if(childrenError)
throw childrenError;



setChildren(
childrenData || []
);






const {
data:pointsData,
error:pointsError

}=await supabase
.from("team_points")
.select("*")
.eq(
"team_id",
teamId
)
.order(
"created_at",
{
ascending:false
}
);



if(pointsError)
throw pointsError;



setPointsHistory(
pointsData || []
);



}

catch(error){

console.log(
"Team Error",
error
);

}

finally{

setLoading(false);

}


}



if(teamId)
loadTeam();



},[teamId]);






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

<div className="text-xl font-black">
جاري تحميل الفريق...
</div>

</main>

);

}





const totalPoints =
pointsHistory.reduce(
(sum,item)=>
sum + Number(item.points || 0),
0
);



const attendancePoints =
pointsHistory.filter(
item=>item.type==="attendance"
);



const manualPoints =
pointsHistory.filter(
item=>item.type==="manual"
);
return(

<main
dir="rtl"
className="
min-h-screen
bg-[#050816]
text-white
px-5
py-8
"
>


<div className="max-w-3xl mx-auto">



<button

onClick={()=>router.back()}

className="
mb-6
text-slate-400
hover:text-white
transition
"

>

← رجوع

</button>





{/* HEADER */}

<div
className="
rounded-[40px]
p-7
bg-linear-to-br
from-blue-700
via-blue-900
to-black
shadow-2xl
"
>


<p
className="
text-blue-200
font-bold
"
>

🏆 الفريق

</p>



<h1
className="
mt-3
text-4xl
font-black
"
>

{team?.name}

</h1>




<div
className="
mt-7
flex
items-center
justify-between
gap-4
"
>


<div>

<p className="text-slate-300">
عدد الأطفال
</p>


<p
className="
text-5xl
font-black
text-blue-300
"
>

{children.length}

</p>


</div>





<button

onClick={()=>
setShowPointsHistory(!showPointsHistory)
}

className="
rounded-3xl
bg-yellow-500/20
border
border-yellow-400/40
px-5
py-4
font-black
text-yellow-300
hover:bg-yellow-500/30
transition
active:scale-95
"

>

📜
<br/>
سجل النقاط

</button>



</div>


</div>






{/* POINTS HISTORY */}


{showPointsHistory && (


<div
className="
mt-8
rounded-[35px]
bg-slate-900
border
border-yellow-500/20
p-6
animate-in
fade-in
slide-in-from-top-3
"
>



<div
className="
grid
grid-cols-3
gap-3
mb-6
"
>


<div
className="
rounded-2xl
bg-black/30
p-4
text-center
"
>

<p className="text-slate-400 text-sm">
إجمالي النقاط
</p>


<p
className="
text-3xl
font-black
text-yellow-400
"
>

{totalPoints}

</p>


</div>





<div
className="
rounded-2xl
bg-black/30
p-4
text-center
"
>

<p className="text-slate-400 text-sm">
الحضور
</p>


<p
className="
text-3xl
font-black
text-green-400
"
>

{attendancePoints.length}

</p>


</div>





<div
className="
rounded-2xl
bg-black/30
p-4
text-center
"
>

<p className="text-slate-400 text-sm">
يدوي
</p>


<p
className="
text-3xl
font-black
text-blue-400
"
>

{manualPoints.length}

</p>


</div>



</div>





<h2
className="
text-2xl
font-black
mb-5
"
>

📜 تفاصيل النقاط

</h2>




<div className="space-y-4">


{

pointsHistory.length===0 ?


<p className="text-center text-slate-400">
لا يوجد سجل نقاط
</p>



:


pointsHistory.map(point=>(


<div
key={point.id}
className="
rounded-3xl
bg-black/30
border
border-white/10
p-5
"
>



<div
className="
flex
justify-between
items-center
"
>


<div>

<h3 className="font-black text-lg">

{

point.type==="attendance"

?

"✅ نقاط حضور"

:

point.points < 0

?

"🔻 خصم نقاط"

:

"⭐ إضافة يدوية"

}

</h3>


</div>



<p
className={`
font-black
text-2xl
${
point.points >=0
?
"text-green-400"
:
"text-red-400"
}
`}
>


{
point.points>=0
?
"+"
:
""
}

{point.points}


</p>



</div>





<p className="mt-4 text-slate-300">

📝 السبب:
{" "}
{point.reason || "بدون سبب"}

</p>




{

point.type==="manual" &&

<p
className="
mt-2
text-blue-300
"
>

👤 أضافها:
{" "}
{point.added_by || "غير معروف"}

</p>

}




<p
className="
mt-2
text-sm
text-slate-500
"
>

📅

{" "}

{
new Date(point.created_at)
.toLocaleString("ar-EG")
}

</p>




</div>


))


}



</div>



</div>


)}







{/* CHILDREN */}


<div
className="
mt-8
rounded-[40px]
bg-white/5
border
border-white/10
p-6
"
>


<h2
className="
text-2xl
font-black
mb-5
"
>

👥 أعضاء الفريق

</h2>




<div className="space-y-5">


{

children.length===0 ?


<p className="text-center text-slate-400">
لا يوجد أطفال
</p>



:


children.map(child=>(


<div

key={child.id}

onClick={()=>
router.push(`/servant/child/${child.id}`)
}

className="
cursor-pointer
rounded-3xl
bg-black/30
border
border-white/10
p-5
hover:border-blue-500
transition
"

>



<div
className="
flex
items-center
gap-4
"
>


<div className="text-4xl">

{
child.gender==="female"
?
"👧"
:
"👦"
}

</div>



<div>

<h3 className="text-xl font-black">
{child.name}
</h3>


<p className="text-sm text-slate-400">
اضغط لعرض التفاصيل
</p>


</div>


</div>





<div
className="
mt-5
grid
grid-cols-4
gap-2
text-center
"
>


<div className="rounded-xl bg-white/5 p-3">

📋
<br/>
حضور
<br/>
{child.attendance_count}

</div>



<div className="rounded-xl bg-white/5 p-3">

✝️
<br/>
اعتراف
<br/>

{
child.confession
?
"✅"
:
"❌"
}

</div>



<div className="rounded-xl bg-white/5 p-3">

📖
<br/>
مزمور
<br/>

{
child.psalm
?
"✅"
:
"❌"
}

</div>



<div className="rounded-xl bg-white/5 p-3">

⛪
<br/>
قداس
<br/>

{
child.mass
?
"✅"
:
"❌"
}

</div>



</div>



</div>


))


}



</div>



</div>




</div>


</main>


);


}