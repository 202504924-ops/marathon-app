"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Lesson = {
  id: number;
  week_number: number;
  title: string;
  story: string;
  verse: string;
  reference: string | null;
  challenge: string | null;
  is_active: boolean;
};

export default function WeeklyLessonPage() {
  const router = useRouter();

  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [weekNumber, setWeekNumber] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [verse, setVerse] = useState("");
  const [reference, setReference] = useState("");
  const [challenge, setChallenge] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    loadLessons();
  }, []);


  async function loadLessons() {
    const { data, error } = await supabase
      .from("weekly_lessons")
      .select("*")
      .order("week_number", {
        ascending: true,
      });

    if (error) {
      console.log(error);
      return;
    }

    setLessons(data || []);
  }



  async function saveLesson() {
    setMessage("");

    if (!weekNumber || !title || !story || !verse) {
      setMessage("املأ البيانات الأساسية");
      return;
    }


    setLoading(true);


    // إلغاء الدرس القديم
    await supabase
      .from("weekly_lessons")
      .update({
        is_active: false,
      })
      .eq("is_active", true);



    const lessonData = {
      week_number: Number(weekNumber),
      title,
      story,
      verse,
      reference,
      challenge,
      is_active: true,
    };


    let error;


    if (editingId) {

      const result = await supabase
        .from("weekly_lessons")
        .update(lessonData)
        .eq("id", editingId);

      error = result.error;

    } else {

      const result = await supabase
        .from("weekly_lessons")
        .insert(lessonData);

      error = result.error;

    }


    if (error) {

      console.log(error);
      setMessage("حدث خطأ");

    } else {

      setMessage("تم الحفظ بنجاح ✅");

      clearForm();

      loadLessons();
    }


    setLoading(false);
  }



  function editLesson(lesson: Lesson) {

    setEditingId(lesson.id);

    setWeekNumber(String(lesson.week_number));
    setTitle(lesson.title);
    setStory(lesson.story);
    setVerse(lesson.verse);
    setReference(lesson.reference || "");
    setChallenge(lesson.challenge || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }




  async function deleteLesson(id:number){

    const confirmDelete = confirm(
      "هل تريد حذف هذا الدرس؟"
    );

    if(!confirmDelete) return;


    const {error}= await supabase
      .from("weekly_lessons")
      .delete()
      .eq("id",id);


    if(error){
      setMessage("حدث خطأ أثناء الحذف");
      return;
    }


    loadLessons();

  }





  async function activateLesson(id:number){

    await supabase
      .from("weekly_lessons")
      .update({
        is_active:false,
      })
      .eq("is_active",true);



    await supabase
      .from("weekly_lessons")
      .update({
        is_active:true,
      })
      .eq("id",id);



    loadLessons();
  }





  function clearForm(){

    setEditingId(null);

    setWeekNumber("");
    setTitle("");
    setStory("");
    setVerse("");
    setReference("");
    setChallenge("");

  }



  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white"
    >

      <div className="mx-auto max-w-4xl">


        <button
          onClick={()=>router.push("/servant/dashboard")}
          className="mb-6 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2"
        >
          ⬅️ رجوع
        </button>



        <h1 className="mb-2 text-3xl font-bold">
          📖 درس الأسبوع
        </h1>


        <p className="mb-6 text-slate-400">
          إضافة وإدارة دروس السنة
        </p>



        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">


          <input
            placeholder="رقم الأسبوع"
            value={weekNumber}
            onChange={(e)=>setWeekNumber(e.target.value)}
            className="w-full rounded-xl bg-slate-950 p-3"
          />


          <input
            placeholder="عنوان الدرس"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            className="w-full rounded-xl bg-slate-950 p-3"
          />



          <textarea
            placeholder="القصة"
            value={story}
            onChange={(e)=>setStory(e.target.value)}
            className="min-h-40 w-full rounded-xl bg-slate-950 p-3"
          />



          <textarea
            placeholder="آية الحفظ"
            value={verse}
            onChange={(e)=>setVerse(e.target.value)}
            className="min-h-24 w-full rounded-xl bg-slate-950 p-3"
          />



          <input
            placeholder="المرجع"
            value={reference}
            onChange={(e)=>setReference(e.target.value)}
            className="w-full rounded-xl bg-slate-950 p-3"
          />



          <textarea
            placeholder="التحدي الأسبوعي"
            value={challenge}
            onChange={(e)=>setChallenge(e.target.value)}
            className="min-h-24 w-full rounded-xl bg-slate-950 p-3"
          />



          <button
            onClick={saveLesson}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold"
          >
            {loading ? "جاري الحفظ..." :
            editingId ? "تعديل الدرس" : "حفظ الدرس"}
          </button>



          {message && (
            <div className="rounded-xl bg-slate-950 p-3 text-center">
              {message}
            </div>
          )}


        </div>

                <div className="mt-8 space-y-4">

          <h2 className="text-2xl font-bold">
            📚 الدروس المضافة
          </h2>


          {lessons.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center text-slate-400">
              لا يوجد دروس مضافة حتى الآن
            </div>
          )}



          {lessons.map((lesson) => (

            <div
              key={lesson.id}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
            >

              <div className="mb-4 flex items-start justify-between gap-3">

                <div>

                  <h3 className="text-xl font-bold">
                    الأسبوع {lesson.week_number}
                  </h3>

                  <p className="mt-1 text-blue-400">
                    {lesson.title}
                  </p>

                </div>



                {lesson.is_active && (
                  <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-bold">
                    ظاهر للأطفال
                  </span>
                )}

              </div>



              <div className="space-y-3 text-sm text-slate-300">

                <div>
                  <span className="font-bold text-white">
                    الآية:
                  </span>
                  <br />
                  {lesson.verse}
                </div>


                {lesson.reference && (
                  <div>
                    <span className="font-bold text-white">
                      المرجع:
                    </span>
                    <br />
                    {lesson.reference}
                  </div>
                )}



                {lesson.challenge && (
                  <div>
                    <span className="font-bold text-white">
                      التحدي:
                    </span>
                    <br />
                    {lesson.challenge}
                  </div>
                )}

              </div>




              <div className="mt-5 flex flex-wrap gap-3">


                {!lesson.is_active && (
                  <button
                    onClick={() => activateLesson(lesson.id)}
                    className="rounded-xl bg-green-600 px-4 py-2 font-bold"
                  >
                    تفعيل
                  </button>
                )}



                <button
                  onClick={() => editLesson(lesson)}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-bold"
                >
                  تعديل
                </button>



                <button
                  onClick={() => deleteLesson(lesson.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 font-bold"
                >
                  حذف
                </button>


              </div>


            </div>

          ))}


        </div>


      </div>

    </main>
  );
}