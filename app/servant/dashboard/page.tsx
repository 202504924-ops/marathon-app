"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


// ==========================================
// Types
// ==========================================

type Gender = "male" | "female";

type UserData = {
  id:number;
  name:string;
  type:"servant" | "child";
  gender?:Gender;
  role?: "servant" | "admin";
};


type RankingTeam = {
  id:number;
  name:string;
  points:number;
  childrenCount:number;
  image_url?:string | null;
};



// ==========================================
// Dashboard
// ==========================================

export default function ServantDashboard(){


const router = useRouter();



// ==========================================
// States
// ==========================================


const [loading,setLoading] =
useState(true);


const [servantName,setServantName] =
useState("");


const [gender,setGender] =
useState<Gender>("male");



const [totalChildren,setTotalChildren] =
useState(0);


const [todayAttendance,setTodayAttendance] =
useState(0);


const [totalConfessions,setTotalConfessions] =
useState(0);


const [totalPsalmRecitations,setTotalPsalmRecitations] =
useState(0);



const [teams,setTeams] =
useState<RankingTeam[]>([]);



const [searchQuery,setSearchQuery] =
useState("");




// ==========================================
// Dynamic Profile
// ==========================================


const isFemale =
gender==="female";


const servantEmoji =
isFemale
?
"👩‍🦰"
:
"👨‍✝️";



const childEmoji =
isFemale
?
"👧"
:
"👦";



const greeting =
isFemale
?
`أهلاً يا تاسوني ${servantName}`
:
`أهلاً يا أستاذ ${servantName}`;



const serviceMessage =
isFemale
?
"وجودك بيفرق جدًا يا تاسوني ❤️"
:
"وجودك بيفرق جدًا يا أستاذ ❤️";




// ==========================================
// Load Dashboard
// ==========================================


const loadDashboard =
useCallback(async()=>{


setLoading(true);



try{


const saved =
localStorage.getItem(
"marathon_user"
);



if(!saved){

router.replace("/");

return;

}



const user:UserData =
JSON.parse(saved);




if(user.role==="admin"){

router.replace(
"/admin/dashboard"
);

return;

}




if(user.type!=="servant"){

router.replace("/");

return;

}



setServantName(
user.name
);



setGender(
user.gender==="female"
?
"female"
:
"male"
);




const today =
new Date()
.toLocaleDateString(
"en-CA",
{
timeZone:"Africa/Cairo"
}
);





const [
teamsRes,
childrenRes,
pointsRes,
attendanceRes,
confessionRes,
psalmRes

] =
await Promise.all([



supabase
.from("teams")
.select("id,name,image_url")
.order("id"),



supabase
.from("children")
.select("id,team_id"),



supabase
.from("team_points")
.select("team_id,points"),



supabase
.from("attendance")
.select(
"id",
{
count:"exact",
head:true
}
)
.eq(
"attendance_date",
today
),



supabase
.from("confessions")
.select(
"id",
{
count:"exact",
head:true
}
),



supabase
.from("psalm_recitations")
.select(
"id",
{
count:"exact",
head:true
}
)



]);





if(teamsRes.error)
throw teamsRes.error;




const teamsData =
teamsRes.data ?? [];



const childrenData =
childrenRes.data ?? [];



const pointsData =
pointsRes.data ?? [];




setTotalChildren(
childrenData.length
);



setTodayAttendance(
attendanceRes.count ?? 0
);



setTotalConfessions(
confessionRes.count ?? 0
);



setTotalPsalmRecitations(
psalmRes.count ?? 0
);





const pointsMap =
new Map<number,number>();



pointsData.forEach(
(item)=>{


pointsMap.set(

item.team_id,

(pointsMap.get(item.team_id) ?? 0)
+
Number(item.points ?? 0)

);


}
);





const childrenMap =
new Map<number,number>();



childrenData.forEach(
(child)=>{


childrenMap.set(

child.team_id,

(childrenMap.get(child.team_id) ?? 0)
+
1

);


}
);





const ranking:RankingTeam[] =
teamsData.map(
(team)=>({


id:team.id,

name:team.name,
image_url:team.image_url,

points:
pointsMap.get(team.id) ?? 0,


childrenCount:
childrenMap.get(team.id) ?? 0


})
);




ranking.sort(
(a,b)=>
b.points-a.points
);



setTeams(
ranking
);



}
catch(error){

console.log(
"Dashboard Error",
error
);


}
finally{


setLoading(false);


}



},[router]);





useEffect(()=>{

loadDashboard();

},[loadDashboard]);





const filteredTeams =
teams.filter(
(team)=>
team.name
.toLowerCase()
.includes(
searchQuery.toLowerCase()
)
);





function logout(){


localStorage.removeItem(
"marathon_user"
);


router.replace("/");


}




function goTo(path:string){

router.push(path);

}
// ==========================================
// Loading Screen
// ==========================================

if(loading){

return(

<main
dir="rtl"
className="
min-h-screen
bg-[#020617]
text-white
flex
items-center
justify-center
"
>


<div className="text-center">


<div
className="
mx-auto
h-20
w-20
rounded-full
border-4
border-blue-500
border-t-transparent
animate-spin
"
/>


<h2
className="
mt-6
text-2xl
font-black
"
>
جاري تجهيز لوحة الخدمة ✨
</h2>


<p
className="
mt-3
text-slate-400
"
>
لحظات ونفتح لك عالم الماراثون
</p>


</div>


</main>

);

}




// ==========================================
// Main UI
// ==========================================


return(

<main

dir="rtl"

className="
relative
min-h-screen
bg-[#020617]
text-white
overflow-hidden
"

>



{/* Background */}

<div

className="
absolute
top-0
left-0
right-0
h-[500px]
pointer-events-none
bg-gradient-to-b
from-blue-950/70
via-[#020617]
to-transparent
"

/>




<div

className="
relative
max-w-6xl
mx-auto
px-5
py-8
"

>





{/* ================= HEADER ================= */}


<section

className="
rounded-[35px]
bg-slate-900/70
border
border-blue-900/50
p-6
shadow-2xl
mb-7
backdrop-blur-xl
"

>


<div

className="
flex
items-center
justify-between
"

>



<div

className="
flex
items-center
gap-4
"

>


<div

className="
h-16
w-16
rounded-3xl
bg-linear-to-br
from-blue-500
to-blue-700
flex
items-center
justify-center
text-4xl
shadow-xl
"

>

{servantEmoji}

</div>




<div>


<p

className="
text-blue-400
font-bold
"

>

⛪ ماراثون الخدمة

</p>



<h1

className="
text-3xl
font-black
mt-2
"

>

{greeting}

</h1>



<p

className="
mt-3
text-blue-300
font-bold
"

>

{serviceMessage}

</p>







</div>



</div>






<button

onClick={logout}

className="
h-12
w-12
rounded-2xl
bg-red-500/20
border
border-red-500/30
hover:bg-red-500/40
transition
"

>

🚪

</button>




</div>



</section>









{/* ================= STATISTICS ================= */}



<section

className="
grid
grid-cols-2
md:grid-cols-4
gap-4
mb-8
"

>


<DashboardCard

icon={childEmoji}

title="الأطفال"

value={totalChildren}

/>



<DashboardCard

icon="📋"

title="الحضور اليوم"

value={todayAttendance}

/>



<DashboardCard

icon="✝️"

title="الاعترافات"

value={totalConfessions}

/>



<DashboardCard

icon="📖"

title="تسميع المزمور"

value={totalPsalmRecitations}

/>



</section>









{/* ================= SERVICES ================= */}



<div

className="
mb-5
"

>


<h2

className="
text-3xl
font-black
"

>

🚀 خدمات الخادم

</h2>



<p

className="
text-slate-400
mt-2
"

>

كل أدوات الخدمة في مكان واحد

</p>


</div>







<section

className="
grid
grid-cols-2
md:grid-cols-4
gap-4
mb-8
"

>




<ServiceCard

icon="👦"

title="الأطفال"

desc="إضافة ومتابعة الأطفال"

onClick={()=>goTo("/add-child")}

/>









<ServiceCard

icon="📋"

title="الحضور"

desc="تسجيل حضور الأطفال"

onClick={()=>goTo("/attendance")}

/>




<ServiceCard

icon="⛪"

title="القداس"

desc="متابعة حضور القداس"

onClick={()=>goTo("/mass")}

/>




<ServiceCard

icon="✝️"

title="الاعتراف"

desc="تسجيل الاعترافات"

onClick={()=>goTo("/confession")}

/>




<ServiceCard

icon="📖"

title="المزمور"

desc="متابعة التسميع"

onClick={()=>goTo("/psalm")}

/>




<ServiceCard

icon="⭐"

title="النقاط"

desc="إضافة وتعديل النقاط"

onClick={()=>goTo("/points")}

/>




<ServiceCard

icon="📚"

title="الدرس"

desc="درس الأسبوع"

onClick={()=>goTo("/weekly-lesson")}

/>




</section>



<section

className="
rounded-[35px]
bg-slate-900/70
border
border-blue-900/50
p-6
shadow-2xl
mb-8
backdrop-blur-xl
"

>



<div className="mb-6">


<p

className="
text-blue-400
font-bold
"

>

🏆 المنافسة

</p>



<h2

className="
text-3xl
font-black
mt-2
"

>

ترتيب الفرق

</h2>


</div>





<input


value={searchQuery}


onChange={

e=>

setSearchQuery(
e.target.value
)

}


placeholder="🔍 ابحث عن فريق"


className="

w-full

mb-5

rounded-3xl

bg-[#020617]

border

border-blue-900

px-5

py-4

outline-none

focus:border-blue-500

transition

"


/>






<div

className="
space-y-4
"

>


{

filteredTeams.map(

(team,index)=>(


<div
  key={team.id}
  onClick={(e)=>{
  const card = e.currentTarget;

  card.classList.add("scale-90");

  setTimeout(()=>{
    goTo(`/servant/team/${team.id}`);
  },150);
}}
  className={`
    cursor-pointer
    flex
    items-center
    justify-between
    rounded-3xl
    p-4
    border
   transition-all
duration-150
hover:scale-[1.03]
hover:-translate-y-1
hover:shadow-2xl
active:scale-90
active:translate-y-1

    ${
      index === 0
        ? "bg-yellow-600/20 border-yellow-500"
        : index === 1
        ? "bg-slate-700/40 border-slate-500"
        : index === 2
        ? "bg-orange-700/20 border-orange-500"
        : "bg-black border-slate-800"
    }
  `}
>




<div

className="
flex
items-center
gap-4
"

>


<div>

{
team.image_url ?

<img
src={team.image_url}
className="
w-16
h-16
rounded-full
object-cover
border-2
border-blue-500
"
/>

:

<div
className="
w-16
h-16
rounded-full
bg-blue-900
flex
items-center
justify-center
text-3xl
"
>
🏆
</div>

}

</div>





<div>


<h3

className="
font-black
text-xl
"

>

{team.name}

</h3>



<p

className="
text-sm
text-slate-400
"

>

{team.childrenCount}

طفل

</p>



</div>



</div>







<div

className="
text-center
"

>


<p

className="
text-3xl
font-black
text-blue-400
"

>

{team.points}

</p>



<span

className="
text-xs
text-slate-400
"

>

نقطة

</span>



</div>






</div>


)

)

}


</div>





</section>









{/* ================= REFRESH ================= */}



<button


onClick={loadDashboard}


className="

w-full

rounded-3xl

py-5

font-black

text-lg

bg-linear-to-r

from-blue-500

to-blue-700

shadow-xl

hover:scale-[1.02]

active:scale-95

transition

"


>


🔄 تحديث البيانات


</button>





</div>


</main>


);

}







// ==========================================
// Dashboard Card
// ==========================================


function DashboardCard({

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

p-5

bg-slate-900/70

border

border-blue-900/50

shadow-xl

backdrop-blur-xl

hover:scale-[1.03]

transition

"


>


<div

className="
text-3xl
"

>

{icon}

</div>



<p

className="
mt-4
text-sm
text-slate-400
"

>

{title}

</p>



<h3

className="
mt-2
text-4xl
font-black
"

>

{value}

</h3>



</div>


);


}









// ==========================================
// Service Card
// ==========================================


function ServiceCard({


icon,

title,

desc,

onClick,


}:{


icon:string;

title:string;

desc:string;

onClick:()=>void;


}){


return(


<button


onClick={onClick}


className="

group

rounded-[30px]

p-5

text-right

bg-slate-900/70

border

border-blue-900/50

shadow-xl

hover:border-blue-400

hover:scale-[1.03]

transition

"


>



<div


className="

h-14

w-14

rounded-2xl

bg-linear-to-br

from-blue-500

to-blue-700

flex

items-center

justify-center

text-3xl

mb-4

shadow-lg

group-hover:rotate-6

transition

"


>


{icon}


</div>






<h3


className="

font-black

text-lg

"


>


{title}


</h3>





<p


className="

text-sm

text-slate-400

mt-2

"


>


{desc}


</p>





</button>


);


}