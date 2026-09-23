"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseExamFile } from "@/lib/excel/parse-exam-file";
import type { ParsedRow } from "@/lib/excel/types";
import { getExamReportNumbers, getOrGenerateAiSummary } from "@/lib/reports/exam-report-data";
import { notifyReportReady } from "@/lib/email/send-report-ready-notification";
import { getOrigin } from "@/lib/get-origin";

const metaSchema = z.object({
  title: z.string().trim().min(2).max(150),
  className: z.string().trim().min(1).max(100),
  examDate: z.string().trim().optional().or(z.literal("")),
  maxMark: z.coerce.number().positive().max(1000),
});

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export type UploadMeta = {
  title: string;
  className: string;
  examDate: string | null;
  maxMark: number;
  fileName: string;
};

export type ParseState =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors?: Record<string, string[]> }
  | { status: "file_error"; fileError: string }
  | { status: "preview"; meta: UploadMeta; subjects: string[]; rows: ParsedRow[]; hasErrors: boolean };

export async function parseExamUploadAction(
  _prevState: ParseState,
  formData: FormData,
): Promise<ParseState> {
  const parsedMeta = metaSchema.safeParse({
    title: formData.get("title"),
    className: formData.get("className"),
    examDate: formData.get("examDate"),
    maxMark: formData.get("maxMark"),
  });

  if (!parsedMeta.success) {
    return { status: "error", fieldErrors: parsedMeta.error.flatten().fieldErrors };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "no_file" };
  }

  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return { status: "error", message: "invalid_file_type" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { status: "error", message: "file_too_large" };
  }

  const buffer = await file.arrayBuffer();
  const parsed = await parseExamFile(buffer, parsedMeta.data.maxMark);

  if (!parsed.ok) {
    return { status: "file_error", fileError: parsed.fileError };
  }

  return {
    status: "preview",
    meta: {
      title: parsedMeta.data.title,
      className: parsedMeta.data.className,
      examDate: parsedMeta.data.examDate || null,
      maxMark: parsedMeta.data.maxMark,
      fileName: file.name,
    },
    subjects: parsed.subjects,
    rows: parsed.rows,
    hasErrors: parsed.hasErrors,
  };
}

function studentKey(code: string | null, name: string) {
  return `${code ?? ""}|${name.toLowerCase()}`;
}

export async function confirmExamUploadAction(
  locale: string,
  meta: UploadMeta,
  subjects: string[],
  rows: ParsedRow[],
): Promise<{ error?: string }> {
  if (rows.length === 0 || subjects.length === 0) {
    return { error: "unexpected" };
  }
  if (rows.some((r) => r.rowErrors.length > 0 || r.cellErrors.length > 0)) {
    // Defense in depth: the client only calls this once hasErrors is false,
    // but never trust that from the server side.
    return { error: "unexpected" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unexpected" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, full_name")
    .eq("id", user.id)
    .single();
  if (!profile?.school_id) return { error: "unexpected" };

  const schoolId = profile.school_id;

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({
      school_id: schoolId,
      title: meta.title,
      class_name: meta.className,
      exam_date: meta.examDate,
      file_name: meta.fileName,
      row_count: rows.length,
      status: "uploaded",
    })
    .select()
    .single();

  if (examError || !exam) {
    return { error: "unexpected" };
  }

  const passMark = meta.maxMark / 2;
  const { data: insertedSubjects, error: subjectsError } = await supabase
    .from("exam_subjects")
    .insert(
      subjects.map((name) => ({
        exam_id: exam.id,
        school_id: schoolId,
        name,
        max_mark: meta.maxMark,
        pass_mark: passMark,
      })),
    )
    .select();

  if (subjectsError || !insertedSubjects) {
    await supabase.from("exams").delete().eq("id", exam.id);
    return { error: "unexpected" };
  }

  const { data: insertedStudents, error: studentsError } = await supabase
    .from("exam_students")
    .insert(
      rows.map((r) => ({
        exam_id: exam.id,
        school_id: schoolId,
        student_code: r.studentCode,
        full_name: r.studentName,
      })),
    )
    .select();

  if (studentsError || !insertedStudents) {
    await supabase.from("exams").delete().eq("id", exam.id);
    return { error: "unexpected" };
  }

  const subjectIdByName = new Map(insertedSubjects.map((s) => [s.name, s.id]));
  const studentIdByKey = new Map(
    insertedStudents.map((s) => [studentKey(s.student_code, s.full_name), s.id]),
  );

  const resultRows: {
    exam_id: string;
    school_id: string;
    student_id: string;
    subject_id: string;
    mark: number;
    components: Record<string, number> | null;
  }[] = [];

  for (const row of rows) {
    const studentId = studentIdByKey.get(studentKey(row.studentCode, row.studentName));
    if (!studentId) continue;
    for (const subjectName of subjects) {
      const mark = row.marks[subjectName];
      if (mark == null) continue;
      const subjectId = subjectIdByName.get(subjectName);
      if (!subjectId) continue;
      resultRows.push({
        exam_id: exam.id,
        school_id: schoolId,
        student_id: studentId,
        subject_id: subjectId,
        mark,
        components: row.components[subjectName] ?? null,
      });
    }
  }

  if (resultRows.length > 0) {
    const { error: resultsError } = await supabase.from("exam_results").insert(resultRows);
    if (resultsError) {
      await supabase.from("exams").update({ status: "failed" }).eq("id", exam.id);
      return { error: "unexpected" };
    }
  }

  await supabase.from("exams").update({ status: "analyzed" }).eq("id", exam.id);

  // Compute the numbers once, then generate (and cache) the AI narrative in
  // whichever locale the user is currently uploading from — switching
  // language later on the report page generates/caches the others on demand.
  const numbers = await getExamReportNumbers(supabase, exam.id);
  await getOrGenerateAiSummary(
    supabase,
    exam.id,
    schoolId,
    locale,
    { title: meta.title, className: meta.className, examDate: meta.examDate },
    numbers,
  );

  // Report is now fully analyzed and saved — notify the uploader at their
  // own registered email. Never blocks the redirect: a misconfigured or
  // failing email must not stop the user from seeing their report.
  if (user.email) {
    try {
      await notifyReportReady(supabase, {
        examId: exam.id,
        examTitle: meta.title,
        className: meta.className,
        examDate: meta.examDate,
        schoolId,
        numbers,
        recipientEmail: user.email,
        recipientName: profile.full_name ?? "",
        locale,
        origin: await getOrigin(),
      });
    } catch {
      // Best-effort — the email module already logs failures itself.
    }
  }

  redirect(`/${locale}/exams/${exam.id}`);
}
