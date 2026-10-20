"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Gender = "male" | "female" | null;

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
  image_url: string | null;
};

type TeamPoint = {
  team_id: number;
  points: number;
};

type RankingTeam = {
  teamId: number;
  name: string;
  points: number;
  rank: number;
  image_url: string | null;
};

type Lesson = {
  id:number;
  title:string;
  story:string;
  verse:string;
  reference:string | null;
};

export default function Home() {

const [name,setName] = useState("");
const [password,setPassword] = useState("");

const [needPassword,setNeedPassword] = useState(false);
const [loading,setLoading] = useState(false);
const [message,setMessage] = useState("");

const [loggedUser,setLoggedUser] =
useState<LoggedUser|null>(null);


const [teamName,setTeamName] = useState("...");
const [teamPoints,setTeamPoints] = useState(0);
const [teamRank,setTeamRank] = useState(0);

const [ranking,setRanking] =
useState<RankingTeam[]>([]);

const [dashboardLoading,setDashboardLoading] =
useState(false);


const [lesson,setLesson] =
useState<Lesson|null>(null);

const [showVerse,setShowVerse] =
useState(false);

const [lessonLoading,setLessonLoading] =
useState(false);



useEffect(()=>{

const saved =
localStorage.getItem("marathon_user");

if(!saved)return;

try{

const user = JSON.parse(saved);

setLoggedUser(user);


if(user.type==="child"){
loadChildDashboard(user);
}


if(user.type==="servant"){

if(user.role==="admin"){
window.location.href="/admin/dashboard";
}
else{
window.location.href="/servant/dashboard";
}

}


}catch{

localStorage.removeItem("marathon_user");

}

},[]);



async function loadLesson(){

setLessonLoading(true);

try{

const {data,error}=await supabase
.from("weekly_lessons")
.select("*")
.eq("is_active",true)
.order("created_at",{ascending:false})
.limit(1)
.maybeSingle();


console.log("LESSON DATA:", data);
console.log("LESSON ERROR:", error);


if(data){
setLesson(data);
}else{
setLesson(null);
}


}catch(error){

console.log("LESSON ERROR:", error);

}

finally{

setLessonLoading(false);

}

}



async function loadChildDashboard(user:LoggedUser){

if(!user.team_id)return;


setDashboardLoading(true);


try{


const {data:team}=await supabase
.from("teams")
.select("id,name")
.eq("id",user.team_id)
.maybeSingle();


if(team){
setTeamName(team.name);
}



const {data:points}=await supabase
.from("team_points")
.select("team_id,points");



const {data:teams}=await supabase
.from("teams")
.select("id,name,image_url");
console.log(teams);



const pointMap:Record<number,number>={};


(points||[]).forEach((item:TeamPoint)=>{

pointMap[item.team_id]=
(pointMap[item.team_id]||0)+Number(item.points);

});



const rankingData:RankingTeam[]=(teams||[])
.map((team:Team)=>({

teamId:team.id,
name:team.name,
image_url:team.image_url,
points:pointMap[team.id]||0,
rank:0

}))
.sort((a,b)=>b.points-a.points);



rankingData.forEach((item,index)=>{

item.rank=index+1;

});


setRanking(rankingData);



const current =
rankingData.find(
item=>item.teamId===user.team_id
);


if(current){

setTeamPoints(current.points);
setTeamRank(current.rank);

}


}catch(error){

console.log(error);

}


await loadLesson();


setDashboardLoading(false);

}




function getGreeting(){

if(!loggedUser)
return "أهلاً يا بطل!";


if(loggedUser.type==="child"){

return loggedUser.gender==="female"
?
`👑 أهلاً يا بطلة ${loggedUser.name}`
:
`🔥 أهلاً يا بطل ${loggedUser.name}`;

}


return loggedUser.gender==="female"
?
`أهلاً يا تاسوني ${loggedUser.name}`
:
`أهلاً يا أستاذ ${loggedUser.name}`;

}




async function login(){

setMessage("");

const cleanName=name.trim();


if(!cleanName){

setMessage("اكتب اسمك الأول");
return;

}


setLoading(true);


try{


const {data:children}=await supabase
.from("children")
.select("id,name,team_id,gender")
.ilike("name",cleanName);



if(children && children.length){


const child=children[0];


const user:LoggedUser={

id:child.id,
name:child.name,
type:"child",
gender:child.gender,
team_id:child.team_id

};


localStorage.setItem(
"marathon_user",
JSON.stringify(user)
);


setLoggedUser(user);

loadChildDashboard(user);

return;

}




const {data:servants}=await supabase
.from("servants")
.select("id,name,password,gender,role")
.ilike("name",cleanName);



if(servants && servants.length){

setNeedPassword(true);
setMessage("اكتب كلمة السر");

return;

}



setMessage("الاسم غير موجود في الماراثون");


}finally{

setLoading(false);

}

}

async function loginServant(){

setMessage("");

if(!password){

setMessage("اكتب كلمة السر");
return;

}


setLoading(true);


try{


const {data:servants}=await supabase
.from("servants")
.select("id,name,password,gender,role")
.ilike("name",name.trim());



const servant =
servants?.find(
item=>item.password===password
);



if(!servant){

setMessage("كلمة السر غلط");
return;

}



const user:LoggedUser={

id:servant.id,
name:servant.name,
type:"servant",
gender:servant.gender,
role:servant.role

};


localStorage.setItem(
"marathon_user",
JSON.stringify(user)
);



if(servant.role==="admin"){

window.location.href="/admin/dashboard";

}else{

window.location.href="/servant/dashboard";

}


}finally{

setLoading(false);

}

}




function logout(){

localStorage.removeItem(
"marathon_user"
);

setLoggedUser(null);
setName("");
setPassword("");
setNeedPassword(false);
setMessage("");

}





if(!loggedUser){


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
p-5
"
>


<div
className="
w-full
max-w-md
rounded-[40px]
bg-slate-900
border
border-blue-500/30
p-8
shadow-2xl
"
>


<div className="text-center mb-8">

<div className="text-7xl">
🏆
</div>


<h1 className="
text-4xl
font-black
mt-4
">

ماراثون الخدمة

</h1>


<p className="
text-blue-400
mt-3
">

جاهز تدخل المنافسة؟ 🔥

</p>


</div>




<input

value={name}

onChange={e=>{

setName(e.target.value);
setMessage("");

}}

placeholder="اكتب اسمك"

className="
w-full
rounded-2xl
bg-black
border
border-slate-700
px-5
py-4
"
/>




{needPassword &&

<input

type="password"

value={password}

onChange={e=>{

setPassword(e.target.value);
setMessage("");

}}

placeholder="كلمة السر"

className="
mt-4
w-full
rounded-2xl
bg-black
border
border-slate-700
px-5
py-4
"

/>

}




<button

onClick={
needPassword
?
loginServant
:
login
}

disabled={loading}

className="
mt-5
w-full
rounded-2xl
bg-blue-700
py-4
font-black
text-lg
"

>

{
loading
?
"دخول..."
:
"🚀 دخول الماراثون"
}

</button>



{
message &&

<div
className="
mt-5
bg-black
border
border-slate-700
rounded-xl
p-4
text-center
"
>

{message}

</div>

}


</div>


</main>

);

}





if(loggedUser.type==="servant"){

const menuItems=[

{
title:"إضافة طفل",
desc:"إضافة طفل جديد للمسابقة",
icon:"👦",
link:"/servant/add-child"
},

{
title:"إضافة فريق",
desc:"إنشاء وإدارة الفرق",
icon:"🏆",
link:"/servant/add-team"
},

{
title:"الحضور",
desc:"تسجيل حضور الأطفال",
icon:"✅",
link:"/servant/attendance"
},

{
title:"القداس",
desc:"متابعة حضور القداسات",
icon:"⛪",
link:"/servant/mass"
},

{
title:"الاعتراف",
desc:"تسجيل الاعترافات",
icon:"✝️",
link:"/servant/confession"
},

{
title:"المزمور",
desc:"تسجيل التسميع والنقاط",
icon:"📖",
link:"/servant/psalm"
},

{
title:"النقاط",
desc:"إضافة نقاط الفرق",
icon:"⭐",
link:"/servant/points"
}

];


return(

<main
dir="rtl"
className="
min-h-screen
bg-[#050816]
text-white
px-4
py-6
"
>

<div className="max-w-5xl mx-auto">


{/* TOP */}

<div
className="
rounded-[40px]
bg-gradient-to-br
from-blue-900
via-slate-900
to-black
border
border-blue-500/30
p-8
mb-8
shadow-2xl
"
>

<div className="
flex
justify-between
items-center
"
>


<div>

<p className="
text-blue-300
font-bold
"
>
🏃 ماراثون الخدمة
</p>


<h1 className="
text-4xl
font-black
mt-3
"
>
{getGreeting()}
</h1>


<p className="
text-slate-300
mt-3
"
>
لوحة تحكم الخادم 👨‍🏫
</p>


</div>


<div className="
text-7xl
">
👨‍🏫
</div>


</div>


<button

onClick={logout}

className="
mt-6
bg-red-900/50
border
border-red-700
rounded-2xl
px-6
py-3
font-bold
"

>
🚪 تسجيل خروج
</button>


</div>






<h2 className="
text-3xl
font-black
mb-5
">
الخدمات السريعة ⚡
</h2>



<div
className="
grid
grid-cols-1
md:grid-cols-2
gap-5
"
>


{
menuItems.map(item=>(


<button

key={item.title}

onClick={()=>window.location.href=item.link}

className="
rounded-[35px]
bg-slate-900
border
border-slate-800
p-7
flex
items-center
gap-5
text-right
hover:border-blue-500
hover:-translate-y-1
transition
shadow-xl
"

>


<div className="
w-20
h-20
rounded-3xl
bg-blue-950
flex
items-center
justify-center
text-5xl
"
>
{item.icon}
</div>



<div>

<h3 className="
text-2xl
font-black
"
>
{item.title}
</h3>


<p className="
text-slate-400
mt-2
"
>
{item.desc}
</p>


</div>



</button>


))

}



</div>


</div>


</main>

);


}

// =============================
// CHILD DASHBOARD
// =============================

return(

<main
dir="rtl"
className="
min-h-screen
bg-[#050816]
text-white
px-4
py-6
"
>

<div className="max-w-5xl mx-auto">


{/* HEADER */}

<div className="
flex
justify-between
items-start
mb-8
">

<div>

<p className="text-blue-400 font-bold">
🏃 ماراثون الخدمة
</p>


<h1 className="
text-3xl
font-black
mt-2
">
{getGreeting()}
</h1>


<p className="
text-slate-400
mt-2
">
معركتك بدأت... أثبت إن فريقك الأقوى 🔥
</p>


</div>



<button
onClick={logout}
className="
bg-slate-900
border
border-slate-700
px-5
py-3
rounded-2xl
font-bold
"
>
خروج
</button>


</div>





{/* CURRENT TEAM */}

<div
className="
rounded-[35px]
bg-gradient-to-br
from-blue-900
to-slate-950
border
border-blue-500/30
p-7
mb-6
shadow-xl
"
>


<div className="
flex
justify-between
items-center
"
>


<div>

<p className="text-blue-200">
فريقك الحالي 🏆
</p>


<h2 className="
text-4xl
font-black
mt-3
">
{teamName}
</h2>


<p className="
text-blue-200
mt-5
">
ترتيب الفريق
</p>


<p className="
text-6xl
font-black
">
#
{dashboardLoading ? "?" : teamRank}
</p>


</div>




<div>

{
ranking.find(
team=>team.teamId===loggedUser?.team_id
)?.image_url
?

<img

src={
ranking.find(
team=>team.teamId===loggedUser?.team_id
)?.image_url || ""
}

className="
w-28
h-28
rounded-full
object-cover
border-4
border-white/20
shadow-xl
"

/>

:

<div
className="
w-28
h-28
rounded-full
bg-slate-800
flex
items-center
justify-center
text-5xl
"
>
🏆
</div>

}

</div>



</div>


</div>







{/* POINTS */}

<div className="
grid
grid-cols-2
gap-4
mb-7
">


<div className="
rounded-3xl
bg-slate-900
border
border-slate-800
p-5
">

<p className="text-slate-400">
⭐ نقاط الفريق
</p>


<h3 className="
text-4xl
font-black
text-blue-400
mt-2
">

{
dashboardLoading
?
"..."
:
teamPoints
}

</h3>


</div>




<div className="
rounded-3xl
bg-slate-900
border
border-slate-800
p-5
">


<p className="text-slate-400">
🏅 المركز الحالي
</p>


<h3 className="
text-3xl
font-black
mt-2
">

{
teamRank===1
?
"🥇 الأول"
:
teamRank===2
?
"🥈 الثاني"
:
teamRank===3
?
"🥉 الثالث"
:
`#${teamRank}`
}

</h3>


</div>


</div>








{/* RANKING */}

<div
className="
rounded-[35px]
bg-slate-900
border
border-slate-800
p-6
mb-6
"
>


<h2 className="
text-2xl
font-black
mb-5
">
🔥 ترتيب الفرق
</h2>



<div className="space-y-4">


{
ranking.slice(0,5).map(team=>(


<div
key={team.teamId}
className="
rounded-2xl
bg-slate-800
p-4
flex
justify-between
items-center
"
>


<div className="
flex
items-center
gap-4
">


{
team.image_url
?

<img

src={team.image_url}

className="
w-14
h-14
rounded-full
object-cover
border
border-blue-500/30
"

/>

:

<div

className="
w-14
h-14
rounded-full
bg-slate-700
flex
items-center
justify-center
"

>
🏆
</div>

}



<div>

<p className="font-black text-lg">

{
team.rank===1
?
"🥇"
:
team.rank===2
?
"🥈"
:
team.rank===3
?
"🥉"
:
""
}

{" "}

{team.name}

</p>


<p className="text-slate-400">
{team.points} نقطة
</p>


</div>


</div>



<div className="
font-black
text-blue-400
"
>

#{team.rank}

</div>


</div>


))

}


</div>


</div>








{/* LESSON */}

<div

className="
rounded-[35px]
bg-gradient-to-br
from-slate-900
to-blue-950
border
border-blue-500/20
p-6
mt-6
"

>


<h2 className="
text-2xl
font-black
mb-4
">
📖 درس الأسبوع
</h2>


<p className="
text-slate-400
mb-5
">
شاهد درس الأسبوع واحفظ آية اليوم ❤️
</p>



<button

onClick={()=>window.location.href="/child-weekly-lesson"}

className="
w-full
rounded-2xl
bg-blue-600
py-4
font-black
text-lg
"

>
🚀 دخول الدرس
</button>


</div>



</div>


</main>


);

}