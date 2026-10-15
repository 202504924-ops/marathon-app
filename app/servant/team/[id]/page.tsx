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
  id: number;
  name: string;
};



export default function TeamPage(){

  const router = useRouter();
  const params = useParams();

  const teamId = Number(params.id);
  console.log("TEAM ID =", params.id);
console.log("NUMBER =", teamId);


  const [team,setTeam] = useState<Team | null>(null);
  const [children,setChildren] = useState<Child[]>([]);
  const [loading,setLoading] = useState(true);



  useEffect(()=>{


    async function loadTeam(){

      try{


        const {
          data:teamData,
          error:teamError
        } = await supabase
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
        } = await supabase
          .rpc(
            "get_team_children_details",
            {
              team_id_input: teamId
            }
          );

          console.log("TEAM ID:", teamId);
console.log("CHILDREN DATA:", childrenData);
console.log("RPC ERROR:", childrenError);



        if(childrenError)
          throw childrenError;



        setChildren(
          childrenData || []
        );



      }
      catch(error){

  console.log("Team Error", error);

  alert(JSON.stringify(error));

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

        جاري تحميل الفريق...

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
mb-6
text-slate-400
"

>

← رجوع

</button>





<div
className="
rounded-[40px]
p-7
bg-gradient-to-br
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
mt-6
"
>

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


</div>








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





<div
className="
space-y-5
"
>


{
children.length === 0 ?


<p
className="
text-center
text-slate-400
"
>

لا يوجد أطفال

</p>



:


children.map(child=>(


<div

key={child.id}

onClick={()=>router.push(`/servant/child/${child.id}`)}

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
child.gender === "female"
?
"👧"
:
"👦"
}

</div>



<div>

<h3
className="
font-black
text-xl
"
>

{child.name}

</h3>


<p
className="
text-sm
text-slate-400
"
>

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

<span className="text-sm">
حضور
</span>

<br/>

{child.attendance_count}

</div>





<div className="rounded-xl bg-white/5 p-3">

✝️

<br/>

<span className="text-sm">
اعتراف
</span>

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

<span className="text-sm">
مزمور
</span>

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

<span className="text-sm">
قداس
</span>

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