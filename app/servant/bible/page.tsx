"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


export default function ServantBiblePage() {

  const router = useRouter();


  const [month, setMonth] = useState("");
  const [bookName, setBookName] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [explanation, setExplanation] = useState("");

  const [question, setQuestion] = useState("");

  const [answers, setAnswers] = useState([
    "",
    "",
    "",
    ""
  ]);

  const [correctAnswer, setCorrectAnswer] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

type BibleLesson = {
  id: number;
  month: number;
  book_name: string;
  chapter_number: number;
  explanation: string | null;
};


const [lessons, setLessons] = useState<BibleLesson[]>([]);



  function changeAnswer(index:number,value:string){
    

    const newAnswers = [...answers];

    newAnswers[index] = value;

    setAnswers(newAnswers);

  }
  useEffect(()=>{

  loadLessons();

},[]);



async function loadLessons(){

  const {data,error} =
    await supabase
    .from("bible_lessons")
    .select("*")
    .order("id",{ascending:false});


  if(error){

    console.log("LOAD LESSONS ERROR:",error);

    return;

  }


  setLessons(data || []);

}



  async function saveLesson(){


    setMessage("");



    if(
      !month ||
      !bookName ||
      !chapterNumber ||
      !question ||
      !correctAnswer
    ){

      setMessage("من فضلك أكمل البيانات المطلوبة");

      return;

    }



    setLoading(true);



    try{


      const { data: lesson, error: lessonError } =
      await supabase
      .from("bible_lessons")
      .insert({

        month:Number(month),

        book_name:bookName,

        chapter_number:Number(chapterNumber),

        explanation:explanation

      })
      .select()
      .single();




      if(lessonError){

        console.log("LESSON ERROR:",lessonError);

        setMessage("حدث خطأ أثناء حفظ القراءة");

        return;

      }





      const { error: questionError } =
      await supabase
      .from("bible_questions")
      .insert({

        lesson_id:lesson.id,

        question:question,

        answer_1:answers[0],

        answer_2:answers[1],

        answer_3:answers[2],

        answer_4:answers[3],

        correct_answer:correctAnswer,

        points:2

      });





      if(questionError){

        console.log("QUESTION ERROR:",questionError);

        setMessage("حدث خطأ أثناء حفظ السؤال");

        return;

      }





      setMessage("تم إضافة قراءة الكتاب المقدس بنجاح ✅");



      setMonth("");

      setBookName("");

      setChapterNumber("");

      setExplanation("");

      setQuestion("");

      setAnswers([
        "",
        "",
        "",
        ""
      ]);

      setCorrectAnswer("");



    }

    finally{

      setLoading(false);

    }


  }




  return (

    <main
    dir="rtl"
    className="min-h-screen bg-slate-950 text-white p-5"
    >


      <div className="mx-auto max-w-2xl">



       <button
  onClick={() => router.push("/servant/dashboard")}
  className="mb-6 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-300 hover:text-white"
>
  ← رجوع للوحة التحكم
</button>




        <h1 className="text-3xl font-bold">
          📖 إضافة قراءة الكتاب المقدس
        </h1>


        <p className="mt-2 text-slate-400">
          إضافة قراءة اليوم وسؤال التحدي للأطفال
        </p>





        <div className="mt-8 space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">





          <input
          value={month}
          onChange={(e)=>setMonth(e.target.value)}
          placeholder="رقم الشهر"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />




          <input
          value={bookName}
          onChange={(e)=>setBookName(e.target.value)}
          placeholder="اسم السفر"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />





          <input
          value={chapterNumber}
          onChange={(e)=>setChapterNumber(e.target.value)}
          placeholder="رقم الإصحاح"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />





          <textarea
          value={explanation}
          onChange={(e)=>setExplanation(e.target.value)}
          placeholder="شرح الخادم"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />






          <h2 className="pt-4 text-xl font-bold">
            ❓ سؤال اليوم
          </h2>





          <textarea
          value={question}
          onChange={(e)=>setQuestion(e.target.value)}
          placeholder="السؤال"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />





          {
            answers.map((answer,index)=>(

              <input
              key={index}
              value={answer}
              onChange={(e)=>changeAnswer(index,e.target.value)}
              placeholder={`الإجابة ${index+1}`}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
              />

            ))
          }





          <input
          value={correctAnswer}
          onChange={(e)=>setCorrectAnswer(e.target.value)}
          placeholder="الإجابة الصحيحة"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />





          <button
          onClick={saveLesson}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 font-bold"
          >

          {
            loading
            ?
            "جاري الحفظ..."
            :
            "حفظ القراءة"
          }

          </button>





          {
            message &&

            <p className="text-center text-green-400">
              {message}
            </p>

          }
          <div className="mt-8 space-y-4">

  <h2 className="text-2xl font-bold">
    📚 القراءات المضافة
  </h2>


  {
    lessons.map((item)=>(

      <div
      key={item.id}
      className="rounded-2xl border border-slate-700 bg-slate-950 p-4"
      >

        <h3 className="text-xl font-bold text-green-400">
          {item.book_name}
        </h3>


        <p className="mt-2 text-slate-300">
          الشهر: {item.month}
        </p>


        <p className="text-slate-300">
          الإصحاح: {item.chapter_number}
        </p>


        <p className="mt-2 text-slate-400">
          {item.explanation}
        </p>


      </div>

    ))
  }


</div>




        </div>


      </div>


    </main>

  );


}