"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AddTeamPage() {

  const [teamName, setTeamName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");



  useEffect(() => {

    const savedUser =
      localStorage.getItem("marathon_user");


    if (!savedUser) {

      window.location.href="/";
      return;

    }


    try {

      const user =
        JSON.parse(savedUser);


      if(user.type !== "servant"){

        window.location.href="/";

      }


    } catch {

      window.location.href="/";

    }


  }, []);





  function selectImage(
    e: React.ChangeEvent<HTMLInputElement>
  ){

    const file =
      e.target.files?.[0];


    if(!file) return;


    setImage(file);


    setPreview(
      URL.createObjectURL(file)
    );

  }





  async function uploadImage(){

    if(!image) return null;



    const fileExt =
      image.name.split(".").pop();


    const fileName =
      `${Date.now()}.${fileExt}`;



    const {error} =
      await supabase.storage
      .from("team-images")
      .upload(
        fileName,
        image
      );



    if(error){

      console.log(
        "UPLOAD ERROR",
        error
      );

      throw error;

    }




    const {data} =
      supabase.storage
      .from("team-images")
      .getPublicUrl(
        fileName
      );



    return data.publicUrl;

  }





  async function addTeam(){


    const cleanName =
      teamName.trim();



    if(!cleanName){

      setMessage(
        "اكتب اسم الفريق الأول"
      );

      return;

    }



    setLoading(true);
    setMessage("");



    try{


      const {data:existingTeam}
      =
      await supabase
      .from("teams")
      .select("id,name")
      .ilike(
        "name",
        cleanName
      )
      .maybeSingle();



      if(existingTeam){

        setMessage(
          "الفريق ده موجود بالفعل"
        );

        setLoading(false);
        return;

      }




      let imageUrl = null;



      if(image){

        imageUrl =
          await uploadImage();

      }






      const {error} =
      await supabase
      .from("teams")
      .insert({

        name:cleanName,

        points:0,

        image_url:imageUrl

      });





      if(error){

        console.log(error);

        setMessage(
          error.message
        );

        setLoading(false);

        return;

      }




      setTeamName("");

      setImage(null);

      setPreview("");

      setMessage(
        "تم إضافة الفريق بنجاح 🏆"
      );




    }catch(error){


      console.log(error);

      setMessage(
        "حصل خطأ أثناء إضافة الفريق"
      );


    }



    setLoading(false);

  }





  return (

    <main
      dir="rtl"
      className="
      min-h-screen
      bg-slate-950
      text-white
      px-4
      py-8
      "
    >


      <div className="max-w-xl mx-auto">


        <button
          onClick={()=>
            window.location.href="/servant/dashboard"
          }
          className="
          mb-6
          text-slate-400
          "
        >

          ← رجوع

        </button>



        <h1 className="
        text-3xl
        font-black
        mb-2
        ">

          🏆 إضافة فريق

        </h1>



        <p className="
        text-slate-400
        mb-8
        ">

          أضف فريق جديد للماراثون

        </p>




        <div className="
        rounded-3xl
        bg-slate-900
        border
        border-slate-800
        p-6
        ">



          <div className="
          flex
          justify-center
          mb-6
          ">


            <label
              className="
              cursor-pointer
              "
            >


              {

              preview ?

              <img
                src={preview}
                className="
                h-32
                w-32
                rounded-full
                object-cover
                border-4
                border-blue-500
                shadow-xl
                "
              />

              :

              <div className="
              h-32
              w-32
              rounded-full
              bg-blue-900
              flex
              items-center
              justify-center
              text-5xl
              border-4
              border-blue-500
              "
              >

                🏆

              </div>

              }



              <input
                type="file"
                accept="image/*"
                hidden
                onChange={selectImage}
              />


            </label>


          </div>





          <input

            value={teamName}

            onChange={(e)=>
              setTeamName(e.target.value)
            }

            placeholder="اسم الفريق"

            className="
            w-full
            rounded-xl
            bg-slate-950
            border
            border-slate-700
            px-4
            py-4
            outline-none
            focus:border-blue-500
            "

          />





          <button

            onClick={addTeam}

            disabled={loading}

            className="
            mt-5
            w-full
            rounded-xl
            bg-blue-600
            py-4
            font-black
            hover:bg-blue-500
            "

          >

            {
              loading
              ?
              "جاري الإضافة..."
              :
              "إضافة الفريق 🏆"
            }


          </button>




          {message &&

          <div className="
          mt-5
          text-center
          bg-slate-800
          rounded-xl
          p-4
          "
          >

            {message}

          </div>

          }



        </div>


      </div>


    </main>

  );

}