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

const [lesson,setLesson] = useState<Lesson | null>(null);
const [loading,setLoading] = useState(true);
const [showVerse,setShowVerse] = useState(true);



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

<div className="text-6xl mb-5">
📖
</div>

<p className="text-xl font-bold">
جاري تحميل درس الأسبوع...
</p>

</div>

</main>

);

}




if(!lesson){

return(

<main
dir="rtl"
className="
min-h-screen
bg-slate-950
text-white
p-6
"
>

<div
className="
max-w-md
mx-auto
rounded-3xl
border
border-slate-800
bg-slate-900
p-8
text-center
"
>


<div className="text-5xl mb-4">
📚
</div>


<h1 className="text-2xl font-black">
لا يوجد درس حاليا
</h1>


<p className="mt-3 text-slate-400">
انتظر درس الأسبوع الجديد 🙏
</p>


<button
onClick={()=>router.back()}
className="
mt-6
rounded-xl
bg-blue-600
px-6
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
px-4
py-6
"
>


<div className="max-w-3xl mx-auto">



<button

onClick={()=>router.back()}

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

← رجوع

</button>







{/* Header */}

<div
className="
rounded-[35px]
border
border-blue-500/20
bg-gradient-to-br
from-blue-950
via-slate-900
to-slate-950
p-8
shadow-2xl
"
>


<div className="
flex
items-center
justify-between
">


<div>

<p className="
text-blue-400
font-bold
mb-2
">



</p>


<h1 className="
text-4xl
font-black
"
>

{lesson.title}

</h1>


<p className="
mt-3
text-slate-400
"
>

درس الاسبوع الجديد في الماراثون  🌟

</p>


</div>


<div className="
text-6xl
">

📖

</div>


</div>


</div>









<div className="
mt-6
space-y-5
">





<LessonCard

icon="📜"

title="قصة الدرس"

text={lesson.story}

/>






<div
className="
rounded-3xl
border
border-blue-500/20
bg-blue-950/30
p-6
shadow-xl
"
>


<h2 className="
flex
items-center
gap-3
text-xl
font-black
mb-5
">

<span className="text-3xl">
✝️
</span>

آية الحفظ

</h2>



{showVerse ? (

<p className="
text-lg
leading-9
whitespace-pre-line
"
>

{lesson.verse}

</p>


)

:

(

<p className="
text-center
text-slate-400
"
>

حاول تفتكر الآية 🙏

</p>

)

}




{lesson.reference && (

<p className="
mt-4
text-blue-300
font-bold
"
>

📌 {lesson.reference}

</p>

)}




<button

onClick={()=>setShowVerse(!showVerse)}

className="
mt-5
w-full
rounded-xl
bg-blue-600
py-3
font-bold
hover:bg-blue-500
transition
"

>

{
showVerse
?
"🙈اخفي الايه وجرب تسمع لنفسك"
:
"👀 إظهار الآية"
}

</button>



</div>





</div>






<div
className="
mt-8
rounded-3xl
border
border-green-500/20
bg-green-950/30
p-5
text-center
"
>


<p className="
text-green-400
font-bold
text-lg
"
>
كدا خلصنا درس الأسبوع، حاول تحفظ الآية وتطبق القصة في حياتك ❤️
</p>


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
p-6
shadow-xl
hover:border-blue-500/30
transition
"

>


<h2 className="
flex
items-center
gap-3
text-xl
font-black
mb-5
">

<span className="text-3xl">
{icon}
</span>

{title}

</h2>



<p className="
leading-9
text-lg
text-slate-300
whitespace-pre-line
">

{text}

</p>


</div>

);

}