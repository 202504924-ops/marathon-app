import { supabase } from "@/lib/supabase";

export async function addAdminLog(
  action: string,
  targetType: string = "",
  targetId: number | null = null,
  details: string = ""
) {

  console.log("ADDING LOG:", {
    action,
    targetType,
    targetId,
    details
  });


  const result = await supabase
    .from("admin_logs")
    .insert({
      "admin-name": "Admin",
      action,
      "target-type": targetType,
      "target-id": targetId,
      details,
    });


  console.log("SUPABASE RESULT:", result);


  if (result.error) {
  console.error("LOG ERROR MESSAGE:", result.error.message);
  console.error("LOG ERROR DETAILS:", result.error.details);
  console.error("LOG ERROR HINT:", result.error.hint);
}
}