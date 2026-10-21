"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


type Child = {
  id:number;
  name:string;
  team_id:number;
};


type Team = {
  id:number;
  name:string;
};


type AttendanceRow = {
  child_id:number;
};


type AttendanceReport = {
  teamName:string;
  present:number;
  total:number;
  percentage:number;
  points:number;
};



export default function AttendancePage(){


const [children,setChildren] =
useState<Child[]>([]);


const [teams,setTeams] =
useState<Team[]>([]);


const [todayAttendance,setTodayAttendance] =
useState<number[]>([]);


const [search,setSearch] =
useState("");


const [selectedChild,setSelectedChild] =
useState<Child|null>(null);


const [loading,setLoading] =
useState(false);


const [pointsLoading,setPointsLoading] =
useState(false);


const [message,setMessage] =
useState("");


const [attendanceReport,setAttendanceReport] =
useState<AttendanceReport[]>([]);



const [showPresent,setShowPresent] =
useState(false);


const [showAbsent,setShowAbsent] =
useState(false);




useEffect(()=>{

loadData();

},[]);




function getToday(){

return new Date().toLocaleDateString(
"en-CA",
{
timeZone:"Africa/Cairo"
}
);

}



function isFriday(date:Date){

return date.getDay()===5;

}




async function loadData(){


const today=getToday();



const [
childrenResult,
teamsResult,
attendanceResult
]=await Promise.all([


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
.select("child_id")
.eq(
"attendance_date",
today
)


]);




if(
childrenResult.error ||
teamsResult.error ||
attendanceResult.error
){

setMessage(
"حصل خطأ أثناء تحميل البيانات"
);

return;

}



setChildren(childrenResult.data || []);


setTeams(teamsResult.data || []);



setTodayAttendance(
(attendanceResult.data || [])
.map(
(item:AttendanceRow)=>item.child_id
)
);


}





function getTeamName(teamId:number){

return (
teams.find(
team=>team.id===teamId
)?.name || "بدون فريق"
);

}





async function registerAttendance(){


setMessage("");



if(!selectedChild){

setMessage("اختار الطفل أولاً");

return;

}



const cairoDate = new Date(
new Date().toLocaleString(
"en-US",
{
timeZone:"Africa/Cairo"
}
)
);



if(!isFriday(cairoDate)){

setMessage(
"تسجيل الحضور متاح يوم الجمعة فقط"
);

return;

}



if(
todayAttendance.includes(selectedChild.id)
){

setMessage(
"الطفل ده متسجل حضوره بالفعل"
);

return;

}



setLoading(true);



const {error}=await supabase
.from("attendance")
.insert({

child_id:selectedChild.id,

attendance_date:getToday(),

attendance_time:
cairoDate.toLocaleTimeString(),

points:0

});




if(error){

console.log(error);

setMessage(
"حصل خطأ أثناء التسجيل"
);

setLoading(false);

return;

}



setTodayAttendance(prev=>[
...prev,
selectedChild.id
]);



setMessage(
`تم تسجيل حضور ${selectedChild.name} ✅`
);



setSelectedChild(null);

setSearch("");

setLoading(false);


}





async function calculateAttendancePoints(){


setMessage("");



const cairoDate = new Date(
new Date().toLocaleString(
"en-US",
{
timeZone:"Africa/Cairo"
}
)
);



if(!isFriday(cairoDate)){

setMessage(
"حساب النقاط يوم الجمعة فقط"
);

return;

}



setPointsLoading(true);



const report:AttendanceReport[]=[];



try{


for(const team of teams){


const teamChildren =
children.filter(
child=>child.team_id===team.id
);



if(teamChildren.length===0)
continue;



const present =
teamChildren.filter(
child=>
todayAttendance.includes(child.id)
).length;



const total =
teamChildren.length;



const percentage =
Math.round(
(present / total) * 100
);



let points = 0;



if(percentage >= 75){

points = 100;

}

else if(percentage >= 50){

points = 70;

}

else if(percentage >= 20){

points = 40;

}




report.push({

teamName:team.name,

present,

total,

percentage,

points

});




const {data:oldPoint}=await supabase
.from("team_points")
.select("id")
.eq("team_id",team.id)
.eq("type","attendance")
.eq(
"reason",
`attendance-${getToday()}`
)
.maybeSingle();



if(!oldPoint){


await supabase
.from("team_points")
.insert({

team_id:team.id,

points,

type:"attendance",

reason:
`attendance-${getToday()}`

});


}



}



setAttendanceReport(report);


setMessage(
"تم اعتماد نقاط الحضور للفرق ✅"
);



}

catch(error){

console.log(error);

setMessage(
"حصل خطأ أثناء الحساب"
);

}

finally{

setPointsLoading(false);

}


}





const filteredChildren =
children.filter(child=>
child.name
.toLowerCase()
.includes(
search.toLowerCase()
)
);



const presentChildren =
children.filter(child=>
todayAttendance.includes(child.id)
);



const absentChildren =
children.filter(child=>
!todayAttendance.includes(child.id)
);



const presentCount =
presentChildren.length;


const absentCount =
absentChildren.length;
return (

<main
dir="rtl"
className="
min-h-screen
bg-slate-950
px-4
py-6
text-white
"
>

<div className="mx-auto max-w-2xl">


<button
onClick={()=>
window.location.href="/servant/dashboard"
}
className="
mb-6
text-slate-400
hover:text-white
"
>
← رجوع للوحة التحكم
</button>



<div
className="
rounded-3xl
bg-gradient-to-br
from-blue-900
to-slate-900
border
border-slate-800
p-6
"
>

<p className="text-blue-300 font-bold">
🏃 ماراثون الخدمة
</p>


<h1 className="
mt-2
text-3xl
font-black
">
تسجيل الحضور
</h1>


<p className="
mt-2
text-slate-300
">
سجل حضور الأطفال واحسب نقاط الفرق
</p>



<div className="
mt-5
grid
grid-cols-2
gap-3
">


<div className="
rounded-2xl
bg-slate-950
p-4
text-center
">

<p className="text-slate-400">
الحضور
</p>

<p className="
text-3xl
font-black
text-green-400
">
{presentCount}
</p>

</div>



<div className="
rounded-2xl
bg-slate-950
p-4
text-center
">

<p className="text-slate-400">
الغياب
</p>

<p className="
text-3xl
font-black
text-red-400
">
{absentCount}
</p>

</div>


</div>


</div>





<div className="
mt-6
rounded-3xl
bg-slate-900
border
border-slate-800
p-6
"
>

<h2 className="
text-xl
font-black
mb-4
">
🔍 البحث عن طفل
</h2>


<input

value={search}

onChange={(e)=>{

setSearch(e.target.value);

setSelectedChild(null);

}}

placeholder="اكتب اسم الطفل..."

className="
w-full
rounded-xl
bg-slate-950
border
border-slate-700
px-4
py-3
"
/>





{search && !selectedChild && (

<div className="
mt-3
rounded-xl
overflow-hidden
border
border-slate-700
"
>

{

filteredChildren.length === 0 ?

<p className="p-4 text-center text-slate-400">
لا يوجد طفل بهذا الاسم
</p>

:

filteredChildren.map(child=>(

<button

key={child.id}

onClick={()=>{

setSelectedChild(child);

setSearch(child.name);

}}

className="
w-full
bg-slate-950
border-b
border-slate-800
p-4
text-right
hover:bg-slate-800
"

>

<p className="font-bold">
{child.name}
</p>

<p className="text-sm text-slate-400">
🏆 {getTeamName(child.team_id)}
</p>


</button>

))

}


</div>

)}






{selectedChild && (

<div className="
mt-5
rounded-2xl
border
border-blue-500/30
bg-blue-500/10
p-5
"
>

<h2 className="
text-xl
font-black
">
{selectedChild.name}
</h2>


<p className="text-slate-400">
🏆 {getTeamName(selectedChild.team_id)}
</p>


<button

onClick={registerAttendance}

disabled={loading}

className="
mt-4
w-full
rounded-xl
bg-blue-600
py-3
font-black
"

>

{
loading
?
"جاري التسجيل..."
:
"✅ تسجيل الحضور"
}


</button>


</div>

)}




{message && (

<div className="
mt-5
rounded-xl
bg-slate-950
p-4
text-center
font-bold
">
{message}
</div>

)}




</div>





{/* قوائم الحضور والغياب */}

<div className="
mt-6
space-y-4
">


<button

onClick={()=>setShowPresent(!showPresent)}

className="
w-full
rounded-2xl
border
border-green-500/30
bg-green-500/10
p-4
text-right
font-bold
"

>

✅ الحاضرين اليوم ({presentChildren.length})

</button>



{showPresent && (

<div className="
rounded-2xl
bg-slate-900
p-4
space-y-2
"
>

{
presentChildren.map(child=>(

<p key={child.id}>
✅ {child.name}
</p>

))
}

</div>

)}





<button

onClick={()=>setShowAbsent(!showAbsent)}

className="
w-full
rounded-2xl
border
border-red-500/30
bg-red-500/10
p-4
text-right
font-bold
"

>

❌ الغائبين ({absentChildren.length})

</button>



{showAbsent && (

<div className="
rounded-2xl
bg-slate-900
p-4
space-y-2
"
>

{
absentChildren.map(child=>(

<p key={child.id}>
❌ {child.name}
</p>

))
}

</div>

)}



</div>






{/* حساب النقاط */}

<div className="
mt-10
rounded-3xl
border
border-yellow-500/30
bg-yellow-500/10
p-5
"
>


<h2 className="font-black text-lg">
⭐ اعتماد نقاط الحضور
</h2>


<p className="
mt-2
text-sm
text-slate-300
">

75% فأكثر = 100 نقطة
<br/>
50% إلى أقل من 75% = 70 نقطة
<br/>
20% إلى أقل من 50% = 40 نقطة
<br/>
أقل من 20% = 0 نقطة

</p>




<button

onClick={()=>{

const ok =
window.confirm(
"هل أنت متأكد من اعتماد نقاط الحضور؟"
);


if(ok){

calculateAttendancePoints();

}

}}

disabled={pointsLoading}

className="
mt-5
w-full
rounded-xl
bg-yellow-500
text-black
py-3
font-black
disabled:opacity-50
"

>

{
pointsLoading
?
"جاري الحساب..."
:
"⭐ حساب نقاط الفرق"
}


</button>


</div>






{attendanceReport.length>0 && (

<div className="
mt-6
rounded-3xl
bg-slate-900
border
border-slate-800
p-5
"
>


<h2 className="text-xl font-black mb-4">
📊 تقرير النقاط
</h2>



<div className="space-y-3">

{

attendanceReport.map((team,index)=>(


<div
key={index}
className="
rounded-2xl
bg-slate-800
p-4
"
>

<p className="font-black text-lg">
{team.teamName}
</p>


<p>
حضر {team.present} من {team.total}
</p>


<p>
النسبة {team.percentage}%
</p>


<p className="
mt-2
font-black
text-yellow-400
">
⭐ {team.points} نقطة
</p>


</div>


))

}


</div>


</div>

)}





</div>

</main>

);

}