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

points:number;

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

.select("child_id,points")

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





setChildren(
childrenResult.data || []
);



setTeams(
teamsResult.data || []
);




setTodayAttendance(


(attendanceResult.data || [])

.map(

(item:AttendanceRow)=>

item.child_id

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
// =============================
// REGISTER ATTENDANCE
// =============================


async function registerAttendance(){


setMessage("");



if(!selectedChild){

setMessage("اختار الطفل أولاً");

return;

}



if(!isFriday(new Date())){

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



const today=getToday();



const {error}=await supabase

.from("attendance")

.insert({

child_id:selectedChild.id,

attendance_date:today,

attendance_time:
new Date().toLocaleTimeString(
"en-US",
{
timeZone:"Africa/Cairo"
}
),

points:0

});




if(error){


console.log(error);


setMessage(
"حصل خطأ أثناء تسجيل الحضور"
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







// =============================
// CALCULATE TEAM POINTS
// =============================


async function calculateAttendancePoints(){


setMessage("");



if(!isFriday(new Date())){


setMessage(
"حساب النقاط متاح يوم الجمعة فقط"
);


return;


}




setPointsLoading(true);



const report:AttendanceReport[]=[];



try{



for(const team of teams){



const teamChildren =
children.filter(

child=>

child.team_id===team.id

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

else{

  points = 0;

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

.eq(
"team_id",
team.id
)

.eq(
"type",
"attendance"
)

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

points,

type:"attendance",

reason:
`attendance-${getToday()}`

});




}




setAttendanceReport(report);



setMessage(
"تم اعتماد نقاط الحضور للفرق ✅"
);



}

catch(error){


console.log(error);



setMessage(
"حصل خطأ أثناء حساب النقاط"
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



const presentCount =
todayAttendance.length;




const absentCount =
children.length - presentCount;
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




<div className="
rounded-3xl
bg-gradient-to-br
from-blue-900
to-slate-900
p-6
border
border-slate-800
"
>

<p className="text-blue-300 font-bold">

🏃 ماراثون الخدمة

</p>


<h1 className="
text-3xl
font-black
mt-2
">

تسجيل الحضور

</h1>


<p className="
mt-2
text-slate-300
">

سجل حضور الأطفال يوم الجمعة واحسب نقاط الفرق

</p>




<div className="
grid
grid-cols-2
gap-3
mt-5
">


<div className="
rounded-2xl
bg-slate-950
p-4
text-center
">

<p className="text-slate-400 text-sm">
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

<p className="text-slate-400 text-sm">
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
border-slate-800
"
>


{

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
p-4
border-b
border-slate-800
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
bg-blue-500/10
border
border-blue-500/30
p-5
"
>


<h2 className="text-xl font-black">

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






{/* زر الحساب تحت خالص */}

<div className="
mt-10
rounded-3xl
border
border-yellow-500/30
bg-yellow-500/10
p-5
"
>


<h2 className="
font-black
text-lg
">

⭐ اعتماد نقاط الحضور

</h2>


<p className="
text-sm
text-slate-300
mt-2
">

سيتم حساب نسبة حضور كل فريق وإضافة النقاط تلقائياً:
<br/>
75% فأكثر = 100 نقطة
<br/>
50% إلى أقل من 75% = 70 نقطة
<br/>
أقل من 50% = 40 نقطة

</p>




<button

onClick={()=>{

const confirmAction =
window.confirm(
"هل أنت متأكد من حساب نقاط الحضور؟ لا يمكن تكرارها لنفس اليوم"
);


if(confirmAction){

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


<h2 className="
text-xl
font-black
mb-4
">

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


<p className="text-slate-300">

حضر {team.present} من {team.total}

</p>


<p className="text-slate-300">

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