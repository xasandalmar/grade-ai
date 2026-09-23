"use client";

import { useTranslations } from "next-intl";
import { deleteExamAction } from "./actions";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ExamRow = {
  id: string;
  title: string;
  class_name: string;
  exam_date: string | null;
  status: "uploaded" | "analyzed" | "failed";
  row_count: number;
};

const statusStyles: Record<ExamRow["status"], string> = {
  uploaded: "bg-muted text-muted-foreground",
  analyzed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function ExamsList({ exams }: { exams: ExamRow[] }) {
  const t = useTranslations("exams");

  if (exams.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {exams.map((exam) => (
        <li key={exam.id} className="flex items-center justify-between gap-4 py-3">
          <Link href={`/exams/${exam.id}`} className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-foreground">{exam.title}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  statusStyles[exam.status],
                )}
              >
                {t(`status.${exam.status}`)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {exam.class_name}
              {exam.exam_date ? ` · ${exam.exam_date}` : ""} · {exam.row_count}
            </p>
          </Link>
          <DeleteButton
            action={deleteExamAction.bind(null, exam.id)}
            confirmMessage={t("confirmDelete")}
            label={t("delete")}
          />
        </li>
      ))}
    </ul>
  );
}
