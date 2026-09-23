"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateSchoolAction } from "./actions";
import type { ActionState } from "@/app/[locale]/(auth)/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";

const initialState: ActionState = { status: "idle" };

export function SchoolForm({
  school,
}: {
  school: { name: string; address: string | null; phone: string | null };
}) {
  const t = useTranslations("school");
  const tErrors = useTranslations("auth.errors");
  const [state, formAction] = useActionState(updateSchoolAction, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.status === "error" && state.message ? (
        <FormMessage variant="error">{tErrors(state.message)}</FormMessage>
      ) : null}
      {state.status === "success" ? (
        <FormMessage variant="success">{t("saved")}</FormMessage>
      ) : null}
      <div>
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" name="name" type="text" defaultValue={school.name} required />
      </div>
      <div>
        <Label htmlFor="address">{t("addressLabel")}</Label>
        <Input id="address" name="address" type="text" defaultValue={school.address ?? ""} />
      </div>
      <div>
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={school.phone ?? ""} />
      </div>
      <SubmitButton pendingText={t("saving")}>{t("save")}</SubmitButton>
    </form>
  );
}
