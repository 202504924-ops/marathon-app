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
};


export default function Home() {


  // =============================
  // LOGIN STATES
  // =============================

  const [name,setName] = useState("");
  const [password,setPassword] = useState("");

  const [needPassword,setNeedPassword] =
  useState(false);

  const [loading,setLoading] =
  useState(false);

  const [message,setMessage] =
  useState("");

  const [loggedUser,setLoggedUser] =
  useState<LoggedUser | null>(null);



  // =============================
  // CHILD DASHBOARD
  // =============================


  const [teamName,setTeamName] =
  useState("...");

  const [teamPoints,setTeamPoints] =
  useState(0);

  const [teamRank,setTeamRank] =
  useState(0);

  const [ranking,setRanking] =
  useState<RankingTeam[]>([]);

  const [dashboardLoading,setDashboardLoading] =
  useState(false);



  // =============================
  // LOAD USER
  // =============================


  useEffect(()=>{

    const saved =
    localStorage.getItem(
      "marathon_user"
    );


    if(!saved) return;


    try{


      const user =
      JSON.parse(saved);


      setLoggedUser(user);



      if(user.type==="child"){

        loadChildDashboard(user);

      }



      if(user.type==="servant"){


        if(user.role==="admin"){

          window.location.href =
          "/admin/dashboard";

        }else{

          window.location.href =
          "/servant/dashboard";

        }

      }



    }catch{

      localStorage.removeItem(
        "marathon_user"
      );

    }


  },[]);





  // =============================
  // CHILD DASHBOARD DATA
  // =============================


  async function loadChildDashboard(
    user:LoggedUser
  ){


    if(!user.team_id)
    return;


    setDashboardLoading(true);



    try{


      const {
        data:team
      } = await supabase

      .from("teams")

      .select("id,name")

      .eq(
        "id",
        user.team_id
      )

      .maybeSingle();



      if(team){

        setTeamName(
          team.name
        );

      }





      const {
        data:points
      } = await supabase

      .from("team_points")

      .select(
        "team_id,points"
      );




      const {
        data:teams
      } = await supabase

      .from("teams")

      .select(
        "id,name"
      );





      const pointMap:
      Record<number,number>
      = {};




      (points || []).forEach(
        (item:TeamPoint)=>{


          if(!pointMap[item.team_id]){

            pointMap[item.team_id]=0;

          }


          pointMap[item.team_id]
          += Number(item.points)||0;



        }
      );





      const rankingData:
      RankingTeam[]
      =
      (teams || [])

      .map(
        (team:Team)=>({

          teamId:team.id,

          name:team.name,

          points:
          pointMap[team.id] || 0,

          rank:0

        })

      )

      .sort(
        (a,b)=>
        b.points-a.points
      );




      rankingData.forEach(
        (team,index)=>{

          team.rank=index+1;

        }
      );



      setRanking(
        rankingData
      );




      const current =
      rankingData.find(
        item =>
        item.teamId===user.team_id
      );



      if(current){


        setTeamPoints(
          current.points
        );


        setTeamRank(
          current.rank
        );


      }



    }catch(error){


      console.log(
        "Dashboard Error",
        error
      );


    }



    setDashboardLoading(false);


  }
  // =============================
// LOGIN CHILD / SERVANT
// =============================


async function login(){


  setMessage("");


  const cleanName =
  name.trim();



  if(!cleanName){

    setMessage(
      "اكتب اسمك الأول"
    );

    return;

  }



  setLoading(true);



  try{


    // البحث عن الطفل

    const {
      data:children
    } = await supabase

    .from("children")

    .select(
      "id,name,team_id,gender"
    )

    .ilike(
      "name",
      cleanName
    );




    if(children && children.length>0){


      if(children.length>1){

        setMessage(
          "الاسم موجود لأكثر من بطل، اكتب الاسم بالكامل"
        );

        return;

      }



      const child =
      children[0];



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





    // البحث عن الخادم

    const {
      data:servants
    } = await supabase

    .from("servants")

    .select(
      "id,name,password,gender,role"
    )

    .ilike(
      "name",
      cleanName
    );




    if(servants && servants.length>0){


      setNeedPassword(true);


      setMessage(
        "اكتب كلمة السر"
      );


      return;


    }





    setMessage(
      "الاسم غير موجود في الماراثون"
    );




  }finally{


    setLoading(false);


  }


}






// =============================
// SERVANT LOGIN
// =============================


async function loginServant(){


  setMessage("");



  if(!password){


    setMessage(
      "اكتب كلمة السر"
    );


    return;


  }



  setLoading(true);



  try{


    const {
      data:servants
    } = await supabase


    .from("servants")


    .select(
      "id,name,password,gender,role"
    )


    .ilike(
      "name",
      name.trim()
    );





    const servant =
    servants?.find(
      item =>
      item.password===password
    );





    if(!servant){


      setMessage(
        "كلمة السر غلط"
      );


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


      window.location.href =
      "/admin/dashboard";


    }else{


      window.location.href =
      "/servant/dashboard";


    }




  }finally{


    setLoading(false);


  }


}






// =============================
// LOGOUT
// =============================


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







// =============================
// GREETING
// =============================


function getGreeting(){


  if(!loggedUser)

  return "أهلاً يا بطل!";





  if(loggedUser.type==="child"){



    if(loggedUser.gender==="female"){


      return `👑 أهلاً يا بطلة ${loggedUser.name}`;


    }



    return `🔥 أهلاً يا بطل ${loggedUser.name}`;


  }





  if(loggedUser.gender==="female"){


    return `أهلاً يا تاسوني ${loggedUser.name}`;


  }




  return `أهلاً يا أستاذ ${loggedUser.name}`;



}







// =============================
// LOGIN PAGE
// =============================


if(!loggedUser){


return(

<main

dir="rtl"

className="
min-h-screen
bg-black
text-white
flex
items-center
justify-center
p-5
relative
overflow-hidden
"


>


<div

className="
absolute
inset-0
bg-gradient-to-br
from-blue-950
via-black
to-purple-950
"

/>



<div

className="
relative
w-full
max-w-md
rounded-[40px]
border
border-blue-500/30
bg-slate-900/90
p-8
shadow-2xl
"


>



<div
className="
text-center
mb-8
"
>


<div
className="
text-7xl
"
>
🏆
</div>



<h1
className="
text-4xl
font-black
mt-4
"
>
ماراثون الخدمة
</h1>



<p
className="
text-blue-400
mt-3
"
>
جاهز تدخل المنافسة؟ 🔥
</p>


</div>





<input

value={name}

onChange={
e=>{
setName(e.target.value);
setMessage("");
}
}

onKeyDown={
e=>{

if(e.key==="Enter" && !needPassword)

login();


if(e.key==="Enter" && needPassword)

loginServant();


}

}

placeholder="اكتب اسمك"

className="
w-full
rounded-2xl
bg-black
border
border-slate-700
px-5
py-4
outline-none
focus:border-blue-500
"

/>





{needPassword &&

<input

type="password"

value={password}

onChange={
e=>{
setPassword(e.target.value);
setMessage("");
}
}

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
outline-none
focus:border-blue-500
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
bg-gradient-to-r
from-blue-600
to-purple-600
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
rounded-xl
bg-black
border
border-slate-700
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
// =============================
// SERVANT MOBILE MENU
// =============================


if(loggedUser.type==="servant"){


const menuItems=[


{
title:"إضافة طفل",
desc:"إضافة طفل جديد وتحديد الفريق",
icon:"👦",
link:"/servant/add-child"
},


{
title:"إضافة فريق",
desc:"إنشاء فريق جديد في الماراثون",
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
desc:"تسجيل اعترافات الأطفال",
icon:"✝️",
link:"/servant/confession"
},


{
title:"تسميع المزمور",
desc:"متابعة التسميع وإضافة النقاط",
icon:"📖",
link:"/servant/psalm"
},


{
title:"النقاط",
desc:"إضافة وخصم نقاط الفرق",
icon:"⭐",
link:"/servant/points"
},


{
title:"الترتيب",
desc:"مشاهدة ترتيب الفرق",
icon:"🔥",
link:"/servant/ranking"
}


];




return(

<main

dir="rtl"

className="
min-h-screen
bg-black
text-white
px-4
py-6
"


>


<div

className="
mx-auto
max-w-xl
"

>


<div

className="
flex
justify-between
items-start
mb-8
"

>


<div>

<p
className="
text-blue-400
font-bold
"
>
🏃 ماراثون الخدمة
</p>



<h1

className="
text-3xl
font-black
mt-2
"

>

{getGreeting()}

</h1>



<p

className="
text-slate-400
mt-2
"

>

لوحة تحكم الخادم

</p>


</div>




<button

onClick={logout}

className="
rounded-2xl
bg-red-900/40
border
border-red-700
px-4
py-3
font-bold
"

>

خروج

</button>


</div>






<div

className="
space-y-4
"

>


{

menuItems.map(item=>(


<button


key={item.title}


onClick={()=>{

window.location.href=item.link;

}}


className="
w-full
rounded-3xl
bg-slate-900
border
border-slate-800
p-5
flex
items-center
gap-4
text-right
active:scale-95
transition
"

>


<div
className="
text-5xl
"
>

{item.icon}

</div>



<div
className="
flex-1
"
>

<h2
className="
text-xl
font-black
"
>

{item.title}

</h2>


<p
className="
text-sm
text-slate-400
mt-1
"
>

{item.desc}

</p>


</div>



<div
className="
text-blue-400
text-2xl
"
>

←

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
bg-black
text-white
px-4
py-6
"

>


<div

className="
mx-auto
max-w-5xl
"

>



<div

className="
flex
justify-between
items-start
mb-8
"

>


<div>


<p

className="
text-blue-400
font-bold
"

>

🏃 ماراثون الخدمة

</p>



<h1

className="
text-3xl
font-black
mt-2
"

>

{getGreeting()}

</h1>



<p

className="
text-slate-400
mt-2
"

>

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







<div

className="
rounded-[35px]
bg-gradient-to-br
from-blue-700
via-purple-700
to-black
p-7
shadow-2xl
mb-6
"

>


<p
className="
text-blue-100
"
>

فريقك الحالي

</p>



<h2

className="
text-4xl
font-black
mt-3
"

>

{teamName}

</h2>



<div

className="
mt-5
flex
justify-between
items-center
"

>


<div>

<p
className="
text-sm
text-blue-200
"
>

ترتيب الفريق

</p>



<p

className="
text-5xl
font-black
"

>

#

{dashboardLoading
?
"?"
:
teamRank}

</p>


</div>



<div

className="
text-7xl
"

>

🏆

</div>


</div>


</div>







<div

className="
grid
grid-cols-2
gap-4
mb-7
"

>


<div

className="
rounded-3xl
bg-slate-900
border
border-slate-800
p-5
"

>


<p
className="
text-slate-400
"
>

نقاط الفريق

</p>


<h3

className="
text-4xl
font-black
text-blue-400
mt-2
"

>

{
dashboardLoading
?
"..."
:
teamPoints
}

</h3>


</div>




<div

className="
rounded-3xl
bg-gradient-to-br
from-yellow-600
to-orange-800
p-5
"

>


<p>

المركز الحالي

</p>


<h3

className="
text-3xl
font-black
mt-2
"

>

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








<div

className="
rounded-[35px]
bg-slate-900
border
border-slate-800
p-6
mb-7
"

>


<h2

className="
text-2xl
font-black
mb-5
"

>

🔥 ترتيب المعركة

</h2>



<div

className="
space-y-4
"

>


{

ranking.slice(0,3).map(team=>(


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


<div
className="
font-black
"

>

{team.rank===1
?
"🥇"
:
team.rank===2
?
"🥈"
:
"🥉"}

{" "}

{team.name}

</div>



<div
className="
font-bold
"

>

{team.points} نقطة

</div>


</div>


))


}


</div>


</div>








<div

className="
rounded-[35px]
bg-gradient-to-br
from-slate-900
to-blue-950
border
border-blue-800
p-6
"

>


<div
className="
text-5xl
"
>

📖🔥

</div>



<h2

className="
text-2xl
font-black
mt-4
"

>

درس الأسبوع

</h2>



<p

className="
text-slate-400
mt-3
"

>

راجع الدرس واحفظ الآية وخلي فريقك يكسب نقاط

</p>




<button

onClick={()=>{

window.location.href="/child-weekly-lesson";

}}

className="
mt-5
w-full
rounded-2xl
bg-blue-600
py-4
font-black
"

>

🚀 دخول الدرس

</button>


</div>





</div>


</main>


);


}