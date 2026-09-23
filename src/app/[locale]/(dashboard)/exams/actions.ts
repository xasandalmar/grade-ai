"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteExamAction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  revalidatePath("/", "layout");
  return error ? { error: error.message } : {};
}
