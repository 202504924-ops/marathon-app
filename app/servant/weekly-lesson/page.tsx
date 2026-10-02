"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


type Lesson = {
  id:number;
  title:string;
  story:string;
  verse:string;
  reference:string | null;
};



export default function WeeklyLessonPage(){

const router = useRouter();


const [lesson,setLesson] = useState<Lesson|null>(null);

const [title,setTitle] = useState("");
const [story,setStory] = useState("");
const [verse,setVerse] = useState("");
const [reference,setReference] = useState("");

const [mode,setMode] = useState<"view"|"edit">("view");

const [newLesson,setNewLesson] = useState(false);

const [loading,setLoading] = useState(true);
const [saving,setSaving] = useState(false);



useEffect(()=>{
loadLesson();
},[]);



async function loadLesson(){

const {data,error}=await supabase
.from("weekly_lessons")
.select("id,title,story,verse,reference")
.eq("is_active",true)
.order("created_at",{ascending:false})
.limit(1)
.maybeSingle();


if(error){
console.log(error);
}


if(data){

setLesson(data);

setTitle(data.title);
setStory(data.story);
setVerse(data.verse);
setReference(data.reference || "");

}


setLoading(false);

}




async function saveLesson(){

if(!title || !story || !verse || !reference){

alert("من فضلك أكمل البيانات");
return;

}


setSaving(true);



if(newLesson){



await supabase
.from("weekly_lessons")
.update({
is_active:false
})
.eq("is_active",true);



const {data:last}=await supabase
.from("weekly_lessons")
.select("week_number")
.order("week_number",{ascending:false})
.limit(1)
.maybeSingle();



const nextWeek =
last?.week_number
?
last.week_number + 1
:
1;



const {error}=await supabase
.from("weekly_lessons")
.insert({

week_number:nextWeek,

title,
story,
verse,
reference,

challenge:"",

is_active:true

});



if(error){

console.log(error);
alert("حدث خطأ");

}else{

alert("تم نشر الدرس الجديد 📖✨");

}

}else{



const {error}=await supabase
.from("weekly_lessons")
.update({

title,
story,
verse,
reference

})
.eq("id",lesson?.id);



if(error){

console.log(error);

}else{

alert("تم تعديل الدرس ✅");

}



}



setMode("view");
setNewLesson(false);

loadLesson();

setSaving(false);


}




function createNew(){

setTitle("");
setStory("");
setVerse("");
setReference("");

setNewLesson(true);
setMode("edit");

}




if(loading){

return(

<main
dir="rtl"
className="min-h-screen bg-slate-950 flex items-center justify-center text-white"
>

📖 جاري تحميل الدرس...

</main>

)

}





return(

<main
dir="rtl"
className="min-h-screen bg-slate-950 text-white p-5"
>


<div className="max-w-4xl mx-auto">



<button

onClick={()=>router.push("/servant/dashboard")}

className="
mb-6
rounded-xl
bg-slate-900
border
border-slate-700
px-5
py-3
"

>

⬅️ لوحة الخادم

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
mb-8
"
>


<div className="text-7xl">
📖
</div>


<h1 className="text-4xl font-black mt-4">

درس الأسبوع

</h1>


<p className="text-slate-400 mt-3">

جهز درس الأطفال وانشر كلمة ربنا ❤️

</p>


</div>







{mode==="edit" ? (



<div
className="
rounded-3xl
bg-slate-900
border
border-slate-800
p-6
space-y-5
"
>


<Input
icon="📚"
title="عنوان الدرس"
value={title}
setValue={setTitle}
/>


<TextArea
icon="📜"
title="القصة"
value={story}
setValue={setStory}
/>


<TextArea
icon="✝️"
title="آية الحفظ"
value={verse}
setValue={setVerse}
/>


<Input
icon="📌"
title="الشاهد"
value={reference}
setValue={setReference}
/>



<button

onClick={saveLesson}

disabled={saving}

className="
w-full
rounded-2xl
bg-green-600
py-4
font-black
text-lg
"

>

{saving?
"جاري الحفظ..."
:
newLesson?
"🚀 نشر الدرس"
:
"💾 حفظ التعديل"
}


</button>


</div>



):(



<div className="space-y-5">


<Card
icon="📚"
title="عنوان الدرس"
text={lesson?.title}
/>


<Card
icon="📜"
title="القصة"
text={lesson?.story}
/>


<Card
icon="✝️"
title="آية الحفظ"
text={lesson?.verse}
/>


<Card
icon="📌"
title="الشاهد"
text={lesson?.reference || "لا يوجد"}
/>



<div className="grid sm:grid-cols-2 gap-4">


<button

onClick={()=>setMode("edit")}

className="
rounded-2xl
bg-blue-600
py-4
font-black
"

>

✏️ تعديل الدرس

</button>



<button

onClick={createNew}

className="
rounded-2xl
bg-green-600
py-4
font-black
"

>

🆕 درس جديد

</button>



</div>


</div>


)}




</div>


</main>

)

}






function Card({icon,title,text}:any){

return(

<div
className="
rounded-3xl
bg-slate-900
border
border-slate-800
p-6
shadow-xl
"
>

<h2 className="text-2xl font-black mb-4">

{icon} {title}

</h2>


<p className="text-slate-300 leading-9 whitespace-pre-line">

{text}

</p>


</div>

)

}







function Input({icon,title,value,setValue}:any){

return(

<div>

<label className="block mb-2 font-bold text-slate-300">

{icon} {title}

</label>


<input

value={value}

onChange={(e)=>setValue(e.target.value)}

className="
w-full
rounded-2xl
bg-slate-950
border
border-slate-700
p-4
"

 />

</div>

)

}







function TextArea({icon,title,value,setValue}:any){

return(

<div>

<label className="block mb-2 font-bold text-slate-300">

{icon} {title}

</label>


<textarea

value={value}

onChange={(e)=>setValue(e.target.value)}

className="
w-full
min-h-44
rounded-2xl
bg-slate-950
border
border-slate-700
p-4
resize-none
"

 />


</div>

)

}