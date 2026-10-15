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

  const [children,setChildren] = useState<Child[]>([]);
  const [search,setSearch] = useState("");
  const [loading,setLoading] = useState(true);

  const [editId,setEditId] = useState<number|null>(null);
  const [editName,setEditName] = useState("");



  useEffect(()=>{
    loadData();
  },[]);



  async function loadData(){

    setLoading(true);


    const teamsResult =
    await supabase
    .from("teams")
    .select("id,name");



    const childrenResult =
    await supabase
    .from("children")
    .select("*")
    .order("id",{ascending:false});



    const teams:Team[] =
    teamsResult.data || [];



    const data:Child[] =
    (childrenResult.data || []).map(
      child=>({

        id:child.id,
        name:child.name,
        photo_url:child.photo_url,
        team_id:child.team_id,

        teamName:
        teams.find(
          team=>team.id===child.team_id
        )?.name || "بدون فريق"

      })
    );



    setChildren(data);

    setLoading(false);

  }





  async function updateChildName(id:number){


    const cleanName =
    editName.trim();



    if(!cleanName){

      alert("اكتب اسم الطفل");

      return;

    }



    const {error} =
    await supabase
    .from("children")
    .update({
      name:cleanName
    })
    .eq(
      "id",
      id
    );



    if(error){

      console.log(error);

      alert(
        "حدث خطأ أثناء تعديل الاسم"
      );

      return;

    }



    await addAdminLog(
      "تم تعديل اسم طفل",
      "child",
      id,
      `تم تغيير اسم الطفل إلى ${cleanName}`
    );



    setEditId(null);

    setEditName("");

    loadData();

  }







  async function deleteChild(id:number){


    const confirmDelete =
    confirm(
      "هل تريد حذف الطفل؟"
    );



    if(!confirmDelete)
    return;



    const {error} =
    await supabase
    .from("children")
    .delete()
    .eq(
      "id",
      id
    );



    if(error){

      alert(
        "حدث خطأ أثناء حذف الطفل"
      );

      return;

    }



    await addAdminLog(
      "تم حذف طفل",
      "child",
      id,
      "تم حذف طفل من صفحة إدارة الأطفال"
    );



    loadData();

  }







  const filteredChildren =
  children.filter(
    child=>
    child.name
    .toLowerCase()
    .includes(
      search.toLowerCase()
    )
  );





  if(loading){

    return(
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






  return(

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
      onClick={()=>
        window.location.href="/admin/dashboard"
      }
      style={{
        background:"#0d47a1",
        color:"white",
        padding:"10px 18px",
        borderRadius:"12px",
        cursor:"pointer",
        border:"1px solid #2563eb"
      }}
      >
        ← رجوع
      </button>


    </div>





    <input

    placeholder="بحث باسم الطفل..."

    value={search}

    onChange={
      e=>setSearch(e.target.value)
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






    {filteredChildren.map(child=>(


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

      {
      editId===child.id
      ?

      <input

      value={editName}

      onChange={
        e=>setEditName(e.target.value)
      }

      style={{
        background:"#020617",
        color:"white",
        border:"1px solid #2563eb",
        padding:"10px",
        borderRadius:"10px"
      }}

      />

      :

      <h3>
        {child.name}
      </h3>

      }



      <p
      style={{
        color:"#94a3b8"
      }}
      >
        الفريق: {child.teamName}
      </p>


      </div>






      <div
      style={{
        display:"flex",
        gap:"8px"
      }}
      >



      {
      editId===child.id
      ?

      <>


      <button

      onClick={()=>
        updateChildName(child.id)
      }

      style={{
        background:"#16a34a",
        color:"white",
        padding:"10px",
        borderRadius:"12px",
        cursor:"pointer"
      }}

      >

      💾 حفظ

      </button>



      <button

      onClick={()=>{
        setEditId(null);
        setEditName("");
      }}

      style={{
        background:"#475569",
        color:"white",
        padding:"10px",
        borderRadius:"12px",
        cursor:"pointer"
      }}

      >

      إلغاء

      </button>


      </>


      :

      <button

      onClick={()=>{

        setEditId(child.id);

        setEditName(child.name);

      }}

      style={{
        background:"#2563eb",
        color:"white",
        padding:"10px",
        borderRadius:"12px",
        cursor:"pointer"
      }}

      >

      ✏️ تعديل

      </button>


      }




      <button

      onClick={()=>
        deleteChild(child.id)
      }

      style={{
        background:"#dc2626",
        color:"white",
        padding:"10px",
        borderRadius:"12px",
        cursor:"pointer"
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