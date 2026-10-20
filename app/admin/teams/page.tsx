"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


type Team = {
  id: number;
  name: string;
  points: number;
  childrenCount: number;
  image_url?: string | null;
};



export default function TeamsAdmin() {


const [teams,setTeams] =
useState<Team[]>([]);


const [loading,setLoading] =
useState(true);





useEffect(()=>{

loadTeams();

},[]);







async function loadTeams(){


setLoading(true);



const {data:teamsData,error:teamsError}
=
await supabase
.from("teams")
.select(
"id,name,points,image_url"
)
.order("id");




if(teamsError){


console.log(
"LOAD TEAMS ERROR:",
teamsError
);


alert(
teamsError.message
);


setLoading(false);

return;

}







const {data:childrenData,error:childrenError}
=
await supabase
.from("children")
.select("team_id");




if(childrenError){

console.log(
"LOAD CHILDREN ERROR:",
childrenError
);

}





const children =
childrenData || [];





const formattedTeams:Team[] =
(teamsData || [])
.map((team)=>({


id:team.id,

name:team.name,

points:team.points || 0,

image_url:team.image_url,


childrenCount:
children.filter(
child =>
child.team_id === team.id
).length



}));




setTeams(
formattedTeams
);


setLoading(false);


}









async function uploadTeamImage(
teamId:number,
file:File
){


try{


const ext =
file.name.split(".").pop();



const fileName =
`team_${teamId}_${Date.now()}.${ext}`;





const {error:uploadError}
=
await supabase.storage
.from("team-images")
.upload(
fileName,
file,
{
upsert:true
}
);




if(uploadError){

throw uploadError;

}






const {data}
=
supabase.storage
.from("team-images")
.getPublicUrl(
fileName
);






const {error:updateError}
=
await supabase
.from("teams")
.update({

image_url:
data.publicUrl

})
.eq(
"id",
teamId
);





if(updateError){

throw updateError;

}





alert(
"تم إضافة صورة الفريق ✅"
);



loadTeams();




}catch(error){


console.log(
"IMAGE UPLOAD ERROR:",
error
);


alert(
"حصل خطأ أثناء رفع الصورة"
);


}



}









async function editTeam(
id:number,
oldName:string
){


const name =
prompt(
"اسم الفريق الجديد",
oldName
);




if(!name)
return;






const {error}
=
await supabase
.from("teams")
.update({

name:name.trim()

})
.eq(
"id",
id
);





if(error){


alert(
error.message
);


return;


}





alert(
"تم تعديل الفريق ✅"
);



loadTeams();


}









async function deleteTeam(
id:number
){


const ok =
confirm(
"هل تريد حذف الفريق؟"
);



if(!ok)
return;





const {error}
=
await supabase
.from("teams")
.delete()
.eq(
"id",
id
);




if(error){


alert(
error.message
);


return;

}





alert(
"تم حذف الفريق ✅"
);



loadTeams();


}





if(loading){

return(

<main
dir="rtl"
style={{
minHeight:"100vh",
background:"#080d18",
color:"white",
padding:"40px"
}}
>

جاري تحميل الفرق...

</main>

);

}






return (

<main
dir="rtl"
style={{
minHeight:"100vh",
background:"#080d18",
color:"white",
padding:"30px"
}}
>


<div
style={{
maxWidth:"950px",
margin:"auto"
}}
>



<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"25px"
}}
>


<h1>
🏆 إدارة الفرق
</h1>



<button

onClick={()=> 
window.location.href="/admin/dashboard"
}

style={{
background:"#0d47a1",
color:"white",
border:"1px solid #2563eb",
padding:"10px 18px",
borderRadius:"12px",
cursor:"pointer",
fontWeight:"bold"
}}

>

← رجوع

</button>



</div>







{

teams.length===0

?

<p>
لا يوجد فرق
</p>


:

teams.map(team=>(


<div

key={team.id}

style={{

background:"#0f1726",

border:"1px solid #1c3554",

borderRadius:"20px",

padding:"20px",

marginBottom:"15px",

display:"flex",

justifyContent:"space-between",

alignItems:"center",

gap:"20px"

}}

>




<div
style={{
display:"flex",
alignItems:"center",
gap:"15px"
}}
>





{

team.image_url

?

<img

src={team.image_url}

style={{

width:"80px",

height:"80px",

borderRadius:"50%",

objectFit:"cover",

border:"3px solid #2563eb"

}}

/>


:

<div

style={{

width:"80px",

height:"80px",

borderRadius:"50%",

background:"#1e3a5f",

display:"flex",

alignItems:"center",

justifyContent:"center",

fontSize:"35px"

}}

>

🏆

</div>


}






<div>


<h2>

{team.name}

</h2>




<p
style={{
color:"#94a3b8"
}}
>

👦 الأطفال:
{" "}
{team.childrenCount}

</p>




<p
style={{
color:"#60a5fa"
}}
>

⭐ النقاط:
{" "}
{team.points}

</p>



</div>



</div>









<div

style={{

display:"flex",

gap:"10px",

flexWrap:"wrap"

}}

>




<label

style={{

background:"#16a34a",

color:"white",

padding:"10px",

borderRadius:"10px",

cursor:"pointer",

fontWeight:"bold"

}}

>


📷 صورة



<input

type="file"

accept="image/*"

hidden

onChange={(e)=>{


const file =
e.target.files?.[0];



if(file){

uploadTeamImage(
team.id,
file
);

}


}}


/>


</label>








<button

onClick={()=>editTeam(
team.id,
team.name
)}

style={{

background:"#2563eb",

color:"white",

border:"none",

padding:"10px",

borderRadius:"10px",

cursor:"pointer"

}}

>

تعديل

</button>








<button

onClick={()=>deleteTeam(team.id)}

style={{

background:"#dc2626",

color:"white",

border:"none",

padding:"10px",

borderRadius:"10px",

cursor:"pointer"

}}

>

حذف

</button>





</div>





</div>


))


}



</div>


</main>


);


}