"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Gender = "male" | "female";

type Team = {
  id:number;
  name:string;
};

type Child = {
  id:number;
  name:string;
  team_id:number;
  gender:Gender;
  qr_token:string;
};


export default function AddChild(){


const [teams,setTeams] = useState<Team[]>([]);

const [children,setChildren] = useState<Child[]>([]);
const [search,setSearch] = useState("");


const [name,setName] = useState("");
const [teamId,setTeamId] = useState("");
const [gender,setGender] = useState<Gender | "">("");


const [message,setMessage] = useState("");
const [loading,setLoading] = useState(false);


const [addedChild,setAddedChild] =
useState<Child|null>(null);


const [editId,setEditId] =
useState<number|null>(null);


const [editName,setEditName] =
useState("");

const [editTeam,setEditTeam] =
useState("");




useEffect(()=>{

loadTeams();
loadChildren();

},[]);





async function loadTeams(){

const {data,error}=await supabase
.from("teams")
.select("id,name")
.order("id");


if(error){
console.log(error);
return;
}


setTeams(data||[]);

}




async function loadChildren(){

const {data,error}=await supabase
.from("children")
.select("id,name,team_id,gender,qr_token")
.order("id",{ascending:false});


if(error){

console.log(error);
return;

}


setChildren(data||[]);

}






async function addChild(){


setMessage("");


if(!name.trim()){

setMessage("اكتب اسم الطفل");

return;

}


if(!gender){

setMessage("اختار النوع");

return;

}


if(!teamId){

setMessage("اختار الفريق");

return;

}



setLoading(true);


try{


const qrToken=crypto.randomUUID();



const {data,error}=await supabase
.from("children")
.insert({

name:name.trim(),

team_id:Number(teamId),

gender,

qr_token:qrToken

})
.select()
.single();



if(error){

console.log(error);

setMessage(error.message);

return;

}



setAddedChild(data);


setName("");
setGender("");
setTeamId("");


setMessage("تم إضافة الطفل بنجاح ✅");


loadChildren();



}
finally{

setLoading(false);

}



}





async function saveEdit(id:number){


if(!editName.trim()){

return;

}



const {error}=await supabase
.from("children")
.update({

name:editName.trim(),

team_id:Number(editTeam)

})
.eq("id",id);



if(error){

console.log(error);

return;

}



setEditId(null);

loadChildren();


}






function startEdit(child:Child){


setEditId(child.id);

setEditName(child.name);

setEditTeam(String(child.team_id));


}




function downloadQR(){


if(!addedChild)return;


const canvas = document.getElementById(
  "child-qr"
) as HTMLCanvasElement;



if(!canvas)return;


const image =
canvas.toDataURL("image/png");


const link =
document.createElement("a");


link.href=image;

link.download=
`${addedChild.name}-QR.png`;


link.click();


}



const addedTeam =
teams.find(
t=>t.id===addedChild?.team_id
);

const filteredChildren = children.filter(child =>
  child.name.toLowerCase().includes(search.toLowerCase())
);

return (
  


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


<div className="max-w-xl mx-auto">


<button
onClick={()=>window.location.href="/servant/dashboard"}
className="
mb-6
text-slate-400
"
>
← رجوع للوحة التحكم
</button>



<h1 className="
text-3xl
font-black
"
>
إدارة الأطفال 👦
</h1>


<p className="
text-slate-400
mt-2
"
>
إضافة الأطفال وتعديل بياناتهم
</p>





{/* ADD CHILD */}

<div
className="
mt-8
rounded-3xl
bg-slate-900
border
border-slate-800
p-6
space-y-5
"
>


<h2 className="
text-xl
font-black
"
>
➕ إضافة طفل جديد
</h2>




<input

value={name}

onChange={(e)=>setName(e.target.value)}

placeholder="اسم الطفل"

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




<div className="
grid
grid-cols-2
gap-3
">


<button

onClick={()=>setGender("male")}

className={`
rounded-xl
border
p-3
font-bold
${
gender==="male"
?
"bg-blue-600 border-blue-500"
:
"border-slate-700"
}
`}

>
👦 ولد
</button>




<button

onClick={()=>setGender("female")}

className={`
rounded-xl
border
p-3
font-bold
${
gender==="female"
?
"bg-pink-600 border-pink-500"
:
"border-slate-700"
}
`}

>
👧 بنت
</button>


</div>





<select

value={teamId}

onChange={(e)=>setTeamId(e.target.value)}

className="
w-full
rounded-xl
bg-slate-950
border
border-slate-700
px-4
py-3
"

>


<option value="">
اختار الفريق
</option>


{
teams.map(team=>(

<option
key={team.id}
value={team.id}
>

{team.name}

</option>

))
}


</select>






<button

onClick={addChild}

disabled={loading}

className="
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
"جاري الإضافة..."
:
"إضافة الطفل"
}

</button>



{
message &&

<div className="
rounded-xl
bg-slate-950
p-3
text-center
"
>

{message}

</div>

}



</div>








{/* QR */}

{
addedChild &&

<div
className="
mt-6
rounded-3xl
bg-white
text-black
p-6
text-center
"
>

<h2 className="
font-black
text-xl
"
>
تم إضافة الطفل ✅
</h2>


<p className="
font-bold
mt-2
"
>
{addedChild.name}
</p>



<QRCodeCanvas

id="child-qr"

value={addedChild.qr_token}

size={220}

level="H"

includeMargin

/>




<button

onClick={downloadQR}

className="
mt-4
w-full
rounded-xl
bg-slate-900
text-white
py-3
font-bold
"

>
تحميل QR
</button>


</div>

}









{/* CHILDREN LIST */}

<div
className="
mt-8
rounded-3xl
bg-slate-900
border
border-slate-800
p-6
"
>


<h2 className="
text-2xl
font-black
mb-5
"
>
👥 قائمة الأطفال
</h2>

<input

value={search}

onChange={(e)=>setSearch(e.target.value)}

placeholder="🔍 ابحث عن طفل لتعديل بياناته..."

className="
w-full
mb-5
rounded-xl
bg-slate-950
border
border-slate-700
px-4
py-3
outline-none
focus:border-blue-500
"

/>

<div className="space-y-4">


{

filteredChildren.map(child=>{


const team =
teams.find(
t=>t.id===child.team_id
);



return (


<div

key={child.id}

className="
rounded-2xl
bg-slate-800
p-4
"

>


{

editId===child.id

?

(

<div className="
space-y-3
">


<input

value={editName}

onChange={
e=>setEditName(e.target.value)
}

className="
w-full
rounded-xl
bg-slate-950
border
border-slate-700
px-3
py-2
"

/>



<select

value={editTeam}

onChange={
e=>setEditTeam(e.target.value)
}

className="
w-full
rounded-xl
bg-slate-950
border
border-slate-700
px-3
py-2
"

>

{

teams.map(team=>(

<option
key={team.id}
value={team.id}
>

{team.name}

</option>

))

}

</select>




<button

onClick={()=>saveEdit(child.id)}

className="
w-full
rounded-xl
bg-green-600
py-2
font-bold
"

>
حفظ
</button>



</div>

)

:

(

<div className="
flex
justify-between
items-center
"
>


<div>

<h3 className="
font-black
text-lg
"
>

{child.name}

</h3>


<p className="
text-slate-400
text-sm
"
>

🏆 {team?.name}

</p>


<p className="
text-slate-400
text-sm
"
>

{
child.gender==="male"
?
"👦 ولد"
:
"👧 بنت"
}

</p>


</div>



<button

onClick={()=>startEdit(child)}

className="
rounded-xl
bg-blue-600
px-4
py-2
font-bold
"

>
✏️ تعديل
</button>



</div>

)

}



</div>


)

})

}


</div>


</div>



</div>


</main>


);

}