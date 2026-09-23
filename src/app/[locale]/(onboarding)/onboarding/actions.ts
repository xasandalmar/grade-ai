"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { schoolSchema } from "@/lib/validation/school-data";
import type { ActionState } from "@/app/[locale]/(auth)/actions";

export async function createSchoolAction(
  locale: string,
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
  const { error } = await supabase.rpc("create_my_school", {
    p_name: parsed.data.name,
    p_address: parsed.data.address || undefined,
    p_phone: parsed.data.phone || undefined,
  });

  if (error) {
    return { status: "error", message: "unexpected" };
  }

  redirect(`/${locale}/dashboard`);
}
