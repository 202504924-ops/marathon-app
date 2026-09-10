"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Log = {
  id: number;
  action: string;
  user_name: string;
  created_at: string;
};

export default function AdminLogs() {

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadLogs();
  }, []);



  async function loadLogs(){

    setLoading(true);


    const { data, error } = await supabase
      .from("admin_logs")
      .select("*")
      .order("id", {
        ascending:false
      });


    if(!error){
      setLogs(data || []);
    }


    setLoading(false);

  }



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
        جاري تحميل سجل الإدارة...
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
        padding:"30px",
        fontFamily:"Arial"
      }}
    >

      <div
        style={{
          maxWidth:"1000px",
          margin:"auto"
        }}
      >


        <button
          onClick={()=>{
            window.location.href="/admin/dashboard"
          }}
          style={{
            background:"#2563eb",
            color:"white",
            border:"none",
            padding:"12px 20px",
            borderRadius:"12px",
            cursor:"pointer",
            marginBottom:"20px"
          }}
        >
          ← رجوع للوحة الإدارة
        </button>



        <h1>
          📝 سجل الإدارة
        </h1>



        {
          logs.length === 0 ?

          <div
            style={{
              background:"#0f1726",
              padding:"25px",
              borderRadius:"18px"
            }}
          >
            لا يوجد عمليات مسجلة
          </div>

          :

          logs.map(log=>(

            <div
              key={log.id}
              style={{
                background:"#0f1726",
                border:"1px solid #1c3554",
                borderRadius:"18px",
                padding:"18px",
                marginBottom:"12px"
              }}
            >

              <h3>
                {log.action}
              </h3>


              <p
                style={{
                  color:"#94a3b8"
                }}
              >
                بواسطة: {log.user_name}
              </p>


              <small
                style={{
                  color:"#60a5fa"
                }}
              >
                {new Date(log.created_at)
                .toLocaleString("ar-EG")}
              </small>


            </div>

          ))

        }


      </div>

    </main>

  );

}