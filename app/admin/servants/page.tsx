"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Servant = {
  id: number;
  name: string;
  role: string;
  gender?: string;
};

export default function ServantsAdmin() {

  const [servants, setServants] = useState<Servant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("ذكر");



  useEffect(() => {
    loadServants();
  }, []);



  async function loadServants() {

    setLoading(true);

    const { data, error } = await supabase
      .from("servants")
      .select("id,name,role,gender")
      .order("id", {
        ascending:false
      });


    if(!error){
      setServants(data || []);
    }

    setLoading(false);
  }



  async function addServant(){

    if(!name || !password){
      alert("اكتب الاسم وكلمة السر");
      return;
    }


    const { error } = await supabase
      .from("servants")
      .insert({

        name:name,
        password:password,
        gender:gender,
        role:"servant"

      });


    if(error){
      alert("حدث خطأ");
      console.log(error);
      return;
    }


    setName("");
    setPassword("");

    loadServants();

  }




  async function editServant(
    id:number,
    oldName:string
  ){

    const newName = prompt(
      "اسم الخادم الجديد",
      oldName
    );


    if(!newName) return;


    await supabase
      .from("servants")
      .update({
        name:newName
      })
      .eq("id",id);


    loadServants();

  }




  async function deleteServant(id:number){

    const ok = confirm(
      "هل تريد حذف الخادم؟"
    );


    if(!ok) return;


    await supabase
      .from("servants")
      .delete()
      .eq("id",id);


    loadServants();

  }



  const filtered = servants.filter(
    servant =>
      servant.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );



  if(loading){

    return(
      <main
        dir="rtl"
        style={{
          minHeight:"100vh",
          background:"#080d18",
          color:"white",
          padding:"40px"
        }}
      >
        جاري تحميل الخدام...
      </main>
    );

  }



  return (

    <main
      dir="rtl"
      style={{
        minHeight:"100vh",
        background:"#080d18",
        color:"white",
        padding:"30px"
      }}
    >

      <div
        style={{
          maxWidth:"900px",
          margin:"auto"
        }}
      >


        <div
          style={{
            display:"flex",
            justifyContent:"space-between"
          }}
        >

          <h1>
            🙋 إدارة الخدام
          </h1>


          <button
            onClick={()=>
              window.location.href="/admin/dashboard"
            }
            style={{
              background:"#0d47a1",
              color:"white",
              padding:"10px 18px",
              borderRadius:"12px",
              border:"none"
            }}
          >
            ← رجوع
          </button>


        </div>



        <div
          style={{
            background:"#0f1726",
            padding:"20px",
            borderRadius:"18px",
            margin:"25px 0"
          }}
        >

          <h3>
            إضافة خادم
          </h3>


          <input
            placeholder="اسم الخادم"
            value={name}
            onChange={(e)=>
              setName(e.target.value)
            }
            style={{
              width:"100%",
              padding:"12px",
              margin:"8px 0"
            }}
          />


          <input
            placeholder="كلمة السر"
            value={password}
            onChange={(e)=>
              setPassword(e.target.value)
            }
            style={{
              width:"100%",
              padding:"12px",
              margin:"8px 0"
            }}
          />


          <select
            value={gender}
            onChange={(e)=>
              setGender(e.target.value)
            }
            style={{
              width:"100%",
              padding:"12px",
              margin:"8px 0"
            }}
          >

            <option>
              ذكر
            </option>

            <option>
              أنثى
            </option>

          </select>


          <button
            onClick={addServant}
            style={{
              background:"#16a34a",
              color:"white",
              padding:"12px",
              border:"none",
              borderRadius:"10px",
              width:"100%"
            }}
          >
            إضافة
          </button>


        </div>




        <input
          placeholder="بحث باسم الخادم..."
          value={search}
          onChange={(e)=>
            setSearch(e.target.value)
          }
          style={{
            width:"100%",
            padding:"14px",
            borderRadius:"12px",
            marginBottom:"20px"
          }}
        />



        {filtered.map(servant=>(

          <div
            key={servant.id}
            style={{
              background:"#0f1726",
              padding:"18px",
              borderRadius:"18px",
              marginBottom:"12px",
              display:"flex",
              justifyContent:"space-between"
            }}
          >

            <div>

              <h3>
                {servant.name}
              </h3>

              <p>
                النوع: {servant.gender}
              </p>

            </div>


            <div>

              <button
                onClick={()=>
                  editServant(
                    servant.id,
                    servant.name
                  )
                }
                style={{
                  marginLeft:"10px",
                  background:"#2563eb",
                  color:"white",
                  padding:"10px",
                  border:"none",
                  borderRadius:"10px"
                }}
              >
                تعديل
              </button>


              <button
                onClick={()=>
                  deleteServant(servant.id)
                }
                style={{
                  background:"#dc2626",
                  color:"white",
                  padding:"10px",
                  border:"none",
                  borderRadius:"10px"
                }}
              >
                حذف
              </button>


            </div>


          </div>

        ))}


      </div>

    </main>

  );
}