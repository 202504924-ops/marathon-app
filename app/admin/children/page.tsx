
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addAdminLog } from "@/lib/addLog";

type Child = {
  id: number;
  name: string;
  photo_url?: string;
  team_id?: number;
  teamName?: string;
};

type Team = {
  id: number;
  name: string;
};

export default function ChildrenAdmin() {
  const [children, setChildren] = useState<Child[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadData();
  }, []);


  async function loadData() {
    setLoading(true);

    const teamsResult = await supabase
      .from("teams")
      .select("id,name");


    const childrenResult = await supabase
      .from("children")
      .select("*")
      .order("id", { ascending: false });


    const teams: Team[] = teamsResult.data || [];


    const data: Child[] = (childrenResult.data || []).map(
      (child) => ({
        id: child.id,
        name: child.name,
        photo_url: child.photo_url,
        team_id: child.team_id,

        teamName:
          teams.find(
            (team) => team.id === child.team_id
          )?.name || "بدون فريق",
      })
    );


    setChildren(data);

    setLoading(false);
  }



  async function deleteChild(id: number) {

  const confirmDelete = confirm(
    "هل تريد حذف الطفل؟"
  );

  if (!confirmDelete) return;


  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", id);


  if (error) {
    console.error("DELETE CHILD ERROR:", error);
    alert("حدث خطأ أثناء حذف الطفل");
    return;
  }


  await addAdminLog(
    "تم حذف طفل",
    "child",
    id,
    "تم حذف طفل من صفحة إدارة الأطفال"
  );

  console.log("LOG SENT");


  loadData();
}



const filteredChildren = children.filter(
  (child) =>
    child.name
      .toLowerCase()
      .includes(search.toLowerCase())
);



  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight:"100vh",
          background:"#080d18",
          color:"white",
          display:"flex",
          justifyContent:"center",
          alignItems:"center"
        }}
      >
        جاري تحميل الأطفال...
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
          maxWidth:"900px",
          margin:"auto"
        }}
      >

       <div
  style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    marginBottom:"25px"
  }}
>
  <h1>
    👦 إدارة الأطفال
  </h1>

  <button
    onClick={() =>
      window.location.href="/admin/dashboard"
    }
    style={{
      background:"#0d47a1",
      color:"white",
      border:"1px solid #2563eb",
      padding:"10px 18px",
      borderRadius:"12px",
      cursor:"pointer",
      fontWeight:"bold"
    }}
  >
    ← رجوع
  </button>

</div>


        <input
          placeholder="بحث باسم الطفل..."
          value={search}
          onChange={(e)=>
            setSearch(e.target.value)
          }
          style={{
            width:"100%",
            padding:"14px",
            borderRadius:"12px",
            margin:"20px 0",
            border:"1px solid #334155",
            background:"#111827",
            color:"white"
          }}
        />



        {filteredChildren.length === 0 ? (

          <div>
            لا يوجد أطفال
          </div>

        ) : (

          filteredChildren.map((child)=>(

            <div
              key={child.id}
              style={{
                background:"#0f1726",
                border:"1px solid #1c3554",
                borderRadius:"18px",
                padding:"18px",
                marginBottom:"12px",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
              }}
            >

              <div>

                <h3>
                  {child.name}
                </h3>


                <p
                  style={{
                    color:"#94a3b8"
                  }}
                >
                  الفريق: {child.teamName}
                </p>

              </div>



              <button
                onClick={()=>
                  deleteChild(child.id)
                }
                style={{
                  background:"#dc2626",
                  color:"white",
                  border:"none",
                  padding:"10px 15px",
                  borderRadius:"12px",
                  cursor:"pointer",
                  fontWeight:"bold"
                }}
              >
                حذف
              </button>


            </div>

          ))

        )}

      </div>

    </main>
  );
}