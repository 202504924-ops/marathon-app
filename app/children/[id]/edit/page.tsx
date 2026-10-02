"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";

type Gender = "male" | "female";

type Team = {
  id: number;
  name: string;
};

export default function EditChildPage() {

  const router = useRouter();
  const params = useParams();

  const id = Number(params.id);


  const [teams, setTeams] = useState<Team[]>([]);


  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [gender, setGender] = useState<Gender>("male");

  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");

  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  const [address, setAddress] = useState("");
  const [childPhone, setChildPhone] = useState("");

  const [notes, setNotes] = useState("");

  const [needsVisit, setNeedsVisit] = useState(false);


  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");



  useEffect(() => {

    loadData();

  }, []);



  async function loadData(){


    const { data: child, error } = await supabase
      .from("children")
      .select("*")
      .eq("id", id)
      .single();


    if(error){

      console.log(error);
      return;

    }


    setName(child.name || "");
    setTeamId(String(child.team_id || ""));
    setGender(child.gender || "male");

    setFatherName(child.father_name || "");
    setFatherPhone(child.father_phone || "");

    setMotherName(child.mother_name || "");
    setMotherPhone(child.mother_phone || "");

    setAddress(child.address || "");
    setChildPhone(child.child_phone || "");

    setNotes(child.notes || "");

    setNeedsVisit(child.needs_visit || false);




    const {data:teamData} = await supabase
      .from("teams")
      .select("id,name")
      .order("id");


    setTeams(teamData || []);


    setLoading(false);

  }




  async function save(){


    setMessage("");


    const {error} = await supabase
      .from("children")
      .update({

        name,

        team_id:Number(teamId),

        gender,

        father_name:fatherName,
        father_phone:fatherPhone,

        mother_name:motherName,
        mother_phone:motherPhone,

        address,

        child_phone:childPhone,

        notes,

        needs_visit:needsVisit

      })
      .eq("id",id);



    if(error){

      console.log(error);

      setMessage("حدث خطأ أثناء الحفظ");

      return;

    }


    setMessage("تم تعديل بيانات الطفل ✅");


    setTimeout(()=>{

      router.push(`/children/${id}`);

    },1000);


  }





  if(loading){

    return(
      <main
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white flex items-center justify-center"
      >
        جاري التحميل...
      </main>
    )

  }




  return (

    <main
    dir="rtl"
    className="min-h-screen bg-slate-950 text-white p-5"
    >

      <div className="mx-auto max-w-xl">


        <button
        onClick={()=>router.back()}
        className="mb-6 text-slate-400"
        >
          ← رجوع
        </button>



        <h1 className="text-3xl font-bold">
          ✏️ تعديل بيانات الطفل
        </h1>



        <div className="mt-6 space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6">


          <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          placeholder="اسم الطفل"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />



          <select
          value={teamId}
          onChange={(e)=>setTeamId(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          >

            {teams.map(team=>(

              <option
              key={team.id}
              value={team.id}
              >
                {team.name}
              </option>

            ))}

          </select>



          <div className="grid grid-cols-2 gap-3">

            <button
            onClick={()=>setGender("male")}
            className={`rounded-xl p-3 border ${
              gender==="male"
              ?"border-blue-500"
              :"border-slate-700"
            }`}
            >
              ولد
            </button>


            <button
            onClick={()=>setGender("female")}
            className={`rounded-xl p-3 border ${
              gender==="female"
              ?"border-pink-500"
              :"border-slate-700"
            }`}
            >
              بنت
            </button>

          </div>



          <input
          value={fatherName}
          onChange={(e)=>setFatherName(e.target.value)}
          placeholder="اسم الأب"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />


          <input
          value={fatherPhone}
          onChange={(e)=>setFatherPhone(e.target.value)}
          placeholder="رقم الأب"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />


          <input
          value={motherName}
          onChange={(e)=>setMotherName(e.target.value)}
          placeholder="اسم الأم"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />


          <input
          value={motherPhone}
          onChange={(e)=>setMotherPhone(e.target.value)}
          placeholder="رقم الأم"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />


          <input
          value={address}
          onChange={(e)=>setAddress(e.target.value)}
          placeholder="العنوان"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />


          <input
          value={childPhone}
          onChange={(e)=>setChildPhone(e.target.value)}
          placeholder="رقم الطفل"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />


          <textarea
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
          placeholder="ملاحظات"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3"
          />



          <label className="flex items-center gap-3">

            <input
            type="checkbox"
            checked={needsVisit}
            onChange={(e)=>setNeedsVisit(e.target.checked)}
            />

            يحتاج افتقاد

          </label>



          <button
          onClick={save}
          className="w-full rounded-xl bg-blue-600 py-3 font-bold"
          >
            حفظ التعديلات
          </button>



          {
            message &&
            <p className="text-center text-green-400">
              {message}
            </p>
          }


        </div>

      </div>

    </main>

  );

}