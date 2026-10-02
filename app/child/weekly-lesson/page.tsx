"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


type Lesson = {
  week_number:number;
  title:string;
  story:string;
  verse:string;
  reference:string | null;
};


export default function ChildWeeklyLessonPage(){

const router = useRouter();

const [lesson,setLesson] = useState<Lesson|null>(null);
const [loading,setLoading] = useState(true);



useEffect(()=>{
 loadLesson();
},[]);



async function loadLesson(){

const {data,error}=await supabase
.from("weekly_lessons")
.select(
"week_number,title,story,verse,reference"
)
.eq("is_active",true)
.order("week_number",{ascending:false})
.limit(1)
.single();


if(error){

console.log(error);
setLoading(false);
return;

}


setLesson(data);
setLoading(false);

}





if(loading){

return(

<main
dir="rtl"
className="
min-h-screen
bg-slate-950
flex
items-center
justify-center
text-white
"
>

<div className="text-center">

<div className="text-7xl animate-bounce">
📖
</div>

<h2 className="mt-5 text-xl font-bold">
جاري تجهيز درس الأسبوع...
</h2>

</div>

</main>

);

}





if(!lesson){

return(

<main
dir="rtl"
className="min-h-screen bg-slate-950 text-white p-6"
>

<div className="
max-w-md
mx-auto
mt-20
rounded-3xl
bg-slate-900
border
border-slate-800
p-8
text-center
">


<div className="text-6xl">
📚
</div>


<h1 className="mt-5 text-2xl font-black">
لا يوجد درس حاليا
</h1>


<p className="mt-3 text-slate-400">
انتظر درس الأسبوع الجديد 🙏
</p>


<button

onClick={()=>router.push("/child/dashboard")}

className="
mt-6
rounded-xl
bg-blue-600
px-7
py-3
font-bold
"

>

رجوع

</button>


</div>


</main>

);

}





return(

<main
dir="rtl"
className="
min-h-screen
bg-slate-950
text-white
p-5
"
>


<div className="
max-w-4xl
mx-auto
">



<button

onClick={()=>router.push("/child/dashboard")}

className="
mb-6
rounded-xl
border
border-slate-700
bg-slate-900
px-5
py-3
hover:bg-slate-800
transition
"

>

← لوحة الطفل

</button>







<div

className="
rounded-[40px]
bg-gradient-to-br
from-blue-950
via-slate-900
to-black
border
border-blue-500/20
p-8
shadow-2xl
"

>


<div className="
flex
justify-between
items-center
">


<div>

<p className="
text-blue-400
font-bold
">

الأسبوع {lesson.week_number}

</p>


<h1 className="
text-4xl
font-black
mt-3
">

{lesson.title}

</h1>


</div>



<div className="
text-7xl
"

>

📖

</div>


</div>



<p className="
mt-5
text-slate-400
text-lg
">

درس الأسبوع في ماراثون الخدمة 🌟

</p>


</div>







<div className="
mt-7
grid
gap-6
">



<LessonCard

icon="📜"

title="قصة الدرس"

text={lesson.story}

/>




<LessonCard

icon="✝️"

title="آية الحفظ"

text={lesson.verse}

/>




<LessonCard

icon="📌"

title="الشاهد"

text={lesson.reference || "لم يتم إضافة شاهد"}

 />



</div>








<div

className="
mt-8
rounded-3xl
border
border-green-500/30
bg-green-950/30
p-6
text-center
"

>


<div className="text-4xl">
🙏
</div>


<h3 className="
mt-3
text-xl
font-black
text-green-400
">

ذاكر الآية واحفظ كلمة ربنا ❤️

</h3>


</div>




</div>


</main>

);

}





function LessonCard({

icon,
title,
text

}:{

icon:string;
title:string;
text:string;

}){


return(

<div

className="
rounded-3xl
border
border-slate-800
bg-slate-900
p-7
shadow-xl
hover:border-blue-500/40
transition
"

>


<h2 className="
flex
items-center
gap-3
text-2xl
font-black
mb-5
">


<span className="text-4xl">

{icon}

</span>


{title}


</h2>



<p className="
whitespace-pre-line
leading-10
text-slate-300
text-lg
">

{text}

</p>


</div>


);


}