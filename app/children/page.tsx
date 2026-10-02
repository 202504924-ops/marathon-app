"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


type Child = {
  id:number;
  name:string;
  gender:"male"|"female";
  team_id:number;
};


type Team = {
  id:number;
  name:string;
};


export default function ChildrenPage(){

const router = useRouter();


const [children,setChildren]=useState<Child[]>([]);
const [teams,setTeams]=useState<Team[]>([]);
const [search,setSearch]=useState("");

const [loading,setLoading]=useState(true);



useEffect(()=>{

loadChildren();

},[]);



async function loadChildren(){


const {data:childData,error}=await supabase
.from("children")
.select("id,name,gender,team_id")
.order("id");


if(error){
console.log(error);
return;
}



const {data:teamData}=await supabase
.from("teams")
.select("id,name");



setChildren(childData || []);

setTeams(teamData || []);

setLoading(false);


}




function teamName(id:number){

const team=teams.find(
t=>t.id===id
);

return team?.name || "بدون فريق";

}





const filtered=children.filter(child=>

child.name
.toLowerCase()
.includes(search.toLowerCase())

);





if(loading){

return(

<main 
dir="rtl"
className="min-h-screen bg-slate-950 text-white flex items-center justify-center"
>

جاري تحميل الأطفال...

</main>

)

}





return(


<main
dir="rtl"
className="min-h-screen bg-slate-950 text-white p-5"
>


<div className="mx-auto max-w-4xl">



<button
onClick={()=>router.back()}
className="
mb-5
text-slate-400
hover:text-white
"
>

← رجوع

</button>





<div
className="
rounded-3xl
bg-gradient-to-br
from-blue-950
to-slate-900
p-8
mb-6
border
border-blue-500/20
"
>


<h1 className="text-3xl font-black">

👦 قائمة الأطفال

</h1>


<p className="mt-3 text-slate-400">

ملفات الأطفال والمتابعة

</p>


</div>





<input

value={search}

onChange={(e)=>setSearch(e.target.value)}

placeholder="ابحث باسم الطفل..."

className="
w-full
rounded-2xl
border
border-slate-700
bg-slate-900
px-4
py-4
outline-none
focus:border-blue-500
"

/>






<div className="mt-6 space-y-4">


{filtered.map(child=>(



<button

key={child.id}

onClick={()=>router.push(`/children/${child.id}`)}

className="
w-full
rounded-3xl
border
border-slate-800
bg-slate-900
p-5
text-right
hover:border-blue-500
transition
"


>



<h2 className="text-xl font-black">

{child.name}

</h2>




<p className="mt-3 text-slate-400">

👥 الفريق:
{teamName(child.team_id)}

</p>




<p className="text-slate-400">

{child.gender==="male"
?
"👦 ولد"
:
"👧 بنت"
}

</p>




</button>



))}



{filtered.length===0 && (

<div
className="
rounded-2xl
bg-slate-900
p-5
text-center
text-slate-400
"
>

لا يوجد أطفال

</div>

)}



</div>




</div>


</main>


)


}