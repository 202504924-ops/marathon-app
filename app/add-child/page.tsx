"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type Gender = "male" | "female";

type Team = {
  id: number;
  name: string;
};

type Child = {
  id: number;
  name: string;
  team_id: number;
  qr_token: string;
  gender: Gender;
};


export default function AddChild() {

  const [teams, setTeams] = useState<Team[]>([]);

  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  // بيانات الأسرة
  const [fatherName, setFatherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");

  const [motherName, setMotherName] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  const [address, setAddress] = useState("");
  const [childPhone, setChildPhone] = useState("");


  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [addedChild, setAddedChild] = useState<Child | null>(null);



  useEffect(() => {

    async function getTeams(){

      const {data,error}=await supabase
      .from("teams")
      .select("id,name")
      .order("id");


      if(error){
        console.log(error);
        return;
      }


      setTeams(data || []);

    }


    getTeams();

  },[]);




  async function addChild(){

    setMessage("");
    setAddedChild(null);


    const cleanName=name.trim();


    if(!cleanName){
      setMessage("اكتب اسم الطفل أولاً");
      return;
    }


    if(!gender){
      setMessage("اختار نوع الطفل");
      return;
    }


    if(!teamId){
      setMessage("اختار الفريق");
      return;
    }



    setLoading(true);



    try{


      const {data:existingChild}=await supabase
      .from("children")
      .select("id")
      .eq("name",cleanName)
      .eq("team_id",Number(teamId))
      .maybeSingle();



      if(existingChild){

        setMessage("الطفل موجود بالفعل في الفريق");
        return;

      }



      const qrToken=crypto.randomUUID();



      const {data:newChild,error}=await supabase
      .from("children")
      .insert({

        name:cleanName,

        team_id:Number(teamId),

        gender,

        qr_token:qrToken,


        father_name:fatherName,

        father_phone:fatherPhone,


        mother_name:motherName,

        mother_phone:motherPhone,


        address,

        child_phone:childPhone

      })
      .select(
        "id,name,team_id,gender,qr_token"
      )
      .single();




      if(error){

        console.log(error);

        setMessage(error.message);

        return;

      }



      setAddedChild(newChild);



      setName("");
      setTeamId("");
      setGender("");

      setFatherName("");
      setFatherPhone("");

      setMotherName("");
      setMotherPhone("");

      setAddress("");
      setChildPhone("");


      setMessage("تم إضافة الطفل بنجاح ✅");



    }finally{

      setLoading(false);

    }


  }





  function downloadQR(){

    if(!addedChild)return;


    const canvas=document.getElementById(
      "child-qr"
    ) as HTMLCanvasElement;



    if(!canvas)return;



    const image=canvas.toDataURL("image/png");


    const link=document.createElement("a");

    link.href=image;

    link.download=`${addedChild.name}-QR.png`;

    link.click();


  }



  const addedTeam=teams.find(
    t=>t.id===addedChild?.team_id
  );



  return (
        <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-6 text-white"
    >

      <div className="mx-auto max-w-xl">


        <button
          onClick={()=>window.location.href="/servant/dashboard"}
          className="mb-6 text-sm text-slate-400"
        >
          ← رجوع للوحة التحكم
        </button>



        <h1 className="text-3xl font-bold">
          إضافة طفل
        </h1>


        <p className="mt-2 text-slate-400">
          أضف بيانات الطفل وبيانات الأسرة.
        </p>



        <div className="mt-8 space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6">



          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="اسم الطفل"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
          />



          <div>

            <p className="mb-2 text-sm text-slate-300">
              النوع
            </p>


            <div className="grid grid-cols-2 gap-3">

              <button
                onClick={()=>setGender("male")}
                className={`rounded-xl border p-3 ${
                  gender==="male"
                  ?"border-blue-500 bg-blue-500/20"
                  :"border-slate-700"
                }`}
              >
                ولد
              </button>



              <button
                onClick={()=>setGender("female")}
                className={`rounded-xl border p-3 ${
                  gender==="female"
                  ?"border-pink-500 bg-pink-500/20"
                  :"border-slate-700"
                }`}
              >
                بنت
              </button>

            </div>

          </div>





          <select
            value={teamId}
            onChange={(e)=>setTeamId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
          >

            <option value="">
              اختار الفريق
            </option>


            {teams.map(team=>(

              <option
                key={team.id}
                value={team.id}
              >
                {team.name}
              </option>

            ))}


          </select>





          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">


            <h2 className="font-bold text-lg">
              👨‍👩‍👦 بيانات الأسرة
            </h2>



            <input
              value={fatherName}
              onChange={(e)=>setFatherName(e.target.value)}
              placeholder="اسم الأب"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
            />



            <input
              value={fatherPhone}
              onChange={(e)=>setFatherPhone(e.target.value)}
              placeholder="رقم الأب"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
            />



            <input
              value={motherName}
              onChange={(e)=>setMotherName(e.target.value)}
              placeholder="اسم الأم"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
            />



            <input
              value={motherPhone}
              onChange={(e)=>setMotherPhone(e.target.value)}
              placeholder="رقم الأم"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
            />



            <input
              value={address}
              onChange={(e)=>setAddress(e.target.value)}
              placeholder="العنوان"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
            />



            <input
              value={childPhone}
              onChange={(e)=>setChildPhone(e.target.value)}
              placeholder="رقم الطفل (اختياري)"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
            />


          </div>





          <button
            onClick={addChild}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold"
          >

            {loading 
            ? "جاري الإضافة..."
            : "إضافة الطفل"
            }

          </button>



          {message && (

            <div className="rounded-xl bg-slate-950 p-3 text-center">
              {message}
            </div>

          )}





          {addedChild && (

            <div className="rounded-2xl bg-white p-5 text-center text-black">


              <h2 className="text-xl font-bold">
                تم إضافة الطفل ✅
              </h2>


              <p className="mt-2 text-lg font-bold">
                {addedChild.name}
              </p>


              {addedTeam && (

                <p className="text-sm text-slate-500">
                  الفريق: {addedTeam.name}
                </p>

              )}




              <div className="mt-5 flex justify-center">

                <QRCodeCanvas

                  id="child-qr"

                  value={addedChild.qr_token}

                  size={250}

                  level="H"

                  includeMargin

                />

              </div>




              <button

                onClick={downloadQR}

                className="mt-5 w-full rounded-xl bg-slate-900 py-3 font-bold text-white"

              >

                تحميل QR

              </button>



            </div>

          )}


        </div>


      </div>


    </main>

  );


}