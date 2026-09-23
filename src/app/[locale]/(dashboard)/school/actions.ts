"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { schoolSchema } from "@/lib/validation/school-data";
import type { ActionState } from "@/app/[locale]/(auth)/actions";

export async function updateSchoolAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schoolSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  // RLS ("update own school") scopes this to exactly the caller's own school row.
  const { error } = await supabase
    .from("schools")
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
    })
    .not("id", "is", null);

  if (error) {
    return { status: "error", message: "unexpected" };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
