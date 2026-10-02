"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


type BibleLesson = {
  id:number;
  month:number;
  book_name:string;
  chapter_number:number;
  explanation:string | null;
};


type BibleQuestion = {
  id:number;
  lesson_id:number;
  question:string;
  answer_1:string;
  answer_2:string;
  answer_3:string;
  answer_4:string;
  correct_answer:string;
  points:number;
};


type LoggedUser = {
  id:number;
  name:string;
  type:"child" | "servant";
  team_id?:number;
};



export default function ChildBiblePage(){


const router = useRouter();



const [lesson,setLesson] =
useState<BibleLesson | null>(null);


const [question,setQuestion] =
useState<BibleQuestion | null>(null);



const [childId,setChildId] =
useState<number | null>(null);



const [teamId,setTeamId] =
useState<number | null>(null);



const [selectedAnswer,setSelectedAnswer] =
useState("");



const [answered,setAnswered] =
useState(false);



const [completed,setCompleted] =
useState(false);



const [loading,setLoading] =
useState(true);



const [message,setMessage] =
useState("");





useEffect(()=>{


async function start(){


console.log("دخل صفحة الكتاب المقدس");



const savedUser =
localStorage.getItem("marathon_user");



console.log("USER:",savedUser);



if(!savedUser){

router.replace("/");

return;

}



const user:LoggedUser =
JSON.parse(savedUser);



console.log("PARSED USER:",user);



if(user.type !== "child"){

router.replace("/");

return;

}



setChildId(user.id);

setTeamId(user.team_id || null);



await loadBible(user.id);



}



start();



},[]);





async function loadBible(id:number){



const {data:lessonData,error:lessonError}=

await supabase
.from("bible_lessons")
.select("*")
.single();


console.log("LESSON:", lessonData);
console.log("ERROR:", lessonError);



if(lessonError){

console.log(
"LESSON ERROR",
lessonError
);


setMessage(
"حصل خطأ في تحميل القراءة"
);


setLoading(false);

return;

}



console.log(
"LESSON DATA:",
lessonData
);



if(!lessonData){

setMessage(
"لا توجد قراءة حاليا"
);


setLoading(false);

return;

}



setLesson(lessonData);





const {data:questionData,error:questionError}=

await supabase
.from("bible_questions")
.select("*")
.eq(
"lesson_id",
lessonData.id
)
.limit(1)
.maybeSingle();





if(questionError){

console.log(
"QUESTION ERROR",
questionError
);


setMessage(
"حصل خطأ في السؤال"
);


setLoading(false);

return;

}



console.log(
"QUESTION DATA:",
questionData
);



setQuestion(questionData);





const {data:answerData}=

await supabase
.from("child_bible_answers")
.select("id")
.eq(
"child_id",
id
)
.eq(
"question_id",
questionData?.id
);




if(answerData && answerData.length > 0){

setCompleted(true);

}




setLoading(false);



}
async function submitAnswer(){


if(!selectedAnswer){

setMessage(
"اختار إجابة الأول"
);

return;

}



if(!question || !childId){

return;

}




const correct =

selectedAnswer === question.correct_answer;



const earnedPoints =

correct ? question.points : 0;





const {error}=

await supabase
.from("child_bible_answers")
.insert({

child_id:childId,

question_id:question.id,

answer:selectedAnswer,

is_correct:correct,

points:earnedPoints

});




if(error){

console.log(
"SAVE ANSWER ERROR:",
error
);


setMessage(
"أنت جاوبت السؤال ده قبل كده"
);


return;

}





// إضافة نقاط الفريق لو الإجابة صحيحة

if(correct && teamId){


const {error:pointsError}=

await supabase
.from("team_points")
.insert({

team_id:teamId,

points:2,

type:"bible",

reason:"قراءة الكتاب المقدس"

});



if(pointsError){

console.log(
"TEAM POINT ERROR:",
pointsError
);

}


}




setAnswered(true);



if(correct){


setMessage(
"إجابة صحيحة 🎉 حصل فريقك على نقطتين"
);


}else{


setMessage(
"إجابة غير صحيحة حاول المرة القادمة"
);


}



}







if(loading){


return(

<main
dir="rtl"
className="
min-h-screen 
bg-slate-950 
text-white 
flex 
items-center 
justify-center
"
>

جاري تحميل الكتاب المقدس...

</main>

)


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


<div className="mx-auto max-w-2xl">



<button

onClick={()=>router.back()}

className="mb-6 text-slate-400"

>

← رجوع

</button>





<div className="
rounded-3xl 
border 
border-slate-800 
bg-slate-900 
p-6
">



<h1 className="
text-3xl 
font-bold
">

📖 قراءة الكتاب المقدس

</h1>





{message && (

<div className="
mt-5 
rounded-xl 
bg-slate-950 
p-4 
text-center
">

{message}

</div>

)}






{lesson && (

<div className="mt-6">


<h2 className="
text-2xl 
font-bold 
text-green-400
">

{lesson.book_name}

</h2>



<p className="mt-2">

الإصحاح رقم {lesson.chapter_number}

</p>





<div className="
mt-4 
rounded-xl 
bg-slate-950 
p-4 
text-slate-300
">

{lesson.explanation || "لا يوجد شرح"}

</div>



</div>

)}








{question && !completed && (

<div className="mt-8">



<h3 className="
text-xl 
font-bold
">

❓ {question.question}

</h3>




<div className="mt-4 space-y-3">


{

[

question.answer_1,

question.answer_2,

question.answer_3,

question.answer_4


].map((answer,index)=>(



<button

key={index}

disabled={answered}

onClick={()=>setSelectedAnswer(answer)}

className={`

w-full 
rounded-xl 
border 
p-3 
text-right

${

selectedAnswer === answer

?

"border-blue-500 bg-blue-500/20"

:

"border-slate-700 bg-slate-950"

}

`}

>


{answer}


</button>



))


}



</div>





<button

onClick={submitAnswer}

disabled={answered}

className="
mt-5 
w-full 
rounded-xl 
bg-green-600 
py-3 
font-bold
"

>

إرسال الإجابة

</button>



</div>

)}







{completed && (

<div className="
mt-6 
rounded-xl 
bg-green-900/30 
p-4 
text-center
">

✅ أنت أجبت على سؤال اليوم

</div>

)}






</div>



</div>



</main>

)


}
