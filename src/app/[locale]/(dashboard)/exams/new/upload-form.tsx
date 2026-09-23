"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { parseExamUploadAction, confirmExamUploadAction, type ParseState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { cn } from "@/lib/utils";

const initialState: ParseState = { status: "idle" };

export function UploadForm({ locale }: { locale: string }) {
  const t = useTranslations("upload");
  const [state, formAction] = useActionState(parseExamUploadAction, initialState);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, startConfirm] = useTransition();

  if (state.status === "preview") {
    const errorCount = state.rows.filter(
      (r) => r.rowErrors.length > 0 || r.cellErrors.length > 0,
    ).length;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">{t("previewTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("previewSubtitle")}</p>

          <div className="mt-4">
            {state.hasErrors ? (
              <FormMessage variant="error">
                {t("rowsWithErrors", { count: errorCount })}
              </FormMessage>
            ) : (
              <FormMessage variant="success">{t("rowsOk", { count: state.rows.length })}</FormMessage>
            )}
          </div>

          {confirmError ? (
            <div className="mt-4">
              <FormMessage variant="error">{t(`errors.${confirmError}`)}</FormMessage>
            </div>
          ) : null}

          <div className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="sticky top-0 bg-muted text-start">
                <tr>
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                    {t("colRow")}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                    {t("colStudentId")}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-muted-foreground">
                    {t("colStudentName")}
                  </th>
                  {state.subjects.map((subject) => (
                    <th
                      key={subject}
                      className="px-3 py-2 text-start font-medium text-muted-foreground"
                    >
                      {subject}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.rows.map((row) => {
                  const rowHasError = row.rowErrors.length > 0;
                  return (
                    <tr
                      key={row.rowNumber}
                      className={cn(
                        "border-t border-border",
                        rowHasError && "bg-red-50 dark:bg-red-950/20",
                      )}
                    >
                      <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                      <td className="px-3 py-2">{row.studentCode ?? "—"}</td>
                      <td className="px-3 py-2">
                        {row.studentName || (
                          <span className="text-red-600 dark:text-red-400">
                            {t("rowErrors.missing_name")}
                          </span>
                        )}
                        {row.rowErrors.includes("duplicate_student") ? (
                          <span className="ms-2 text-xs text-red-600 dark:text-red-400">
                            ({t("rowErrors.duplicate_student")})
                          </span>
                        ) : null}
                      </td>
                      {state.subjects.map((subject) => {
                        const cellError = row.cellErrors.find((e) => e.subject === subject);
                        const value = row.marks[subject];
                        return (
                          <td
                            key={subject}
                            className={cn(
                              "px-3 py-2",
                              cellError && "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
                            )}
                          >
                            {cellError ? t(`cellErrors.${cellError.code}`) : (value ?? "—")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="w-auto px-6"
              onClick={() => window.location.reload()}
            >
              {t("chooseDifferentFile")}
            </Button>
            <Button
              type="button"
              className="w-auto px-6"
              disabled={state.hasErrors || isConfirming}
              onClick={() => {
                setConfirmError(null);
                startConfirm(async () => {
                  const result = await confirmExamUploadAction(
                    locale,
                    state.meta,
                    state.subjects,
                    state.rows,
                  );
                  if (result?.error) {
                    setConfirmError(result.error);
                  }
                });
              }}
            >
              {isConfirming ? t("confirming") : t("confirm")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {state.status === "error" && state.message ? (
        <FormMessage variant="error">{t(`errors.${state.message}`)}</FormMessage>
      ) : null}
      {state.status === "file_error" ? (
        <FormMessage variant="error">{t(`fileErrors.${state.fileError}`)}</FormMessage>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">{t("examTitleLabel")}</Label>
          <Input id="title" name="title" type="text" placeholder={t("examTitlePlaceholder")} required />
          {state.status === "error" && state.fieldErrors?.title ? (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {state.fieldErrors.title[0]}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="className">{t("classNameLabel")}</Label>
          <Input
            id="className"
            name="className"
            type="text"
            placeholder={t("classNamePlaceholder")}
            required
          />
          {state.status === "error" && state.fieldErrors?.className ? (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {state.fieldErrors.className[0]}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="examDate">{t("examDateLabel")}</Label>
          <Input id="examDate" name="examDate" type="date" />
        </div>
        <div>
          <Label htmlFor="maxMark">{t("maxMarkLabel")}</Label>
          <Input id="maxMark" name="maxMark" type="number" min={1} step={1} defaultValue={100} required />
        </div>
      </div>

      <div>
        <Label htmlFor="file">{t("fileLabel")}</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".xlsx,.xls,.csv"
          required
          className="block w-full text-sm text-foreground file:me-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">{t("fileHint")}</p>
      </div>

      <SubmitButton pendingText={t("parsing")}>{t("parse")}</SubmitButton>
    </form>
  );
}
