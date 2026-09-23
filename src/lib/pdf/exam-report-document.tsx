import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type {
  DataIntegrityAlert,
  ExamSummary,
  StudentStat,
  SubjectStat,
} from "@/lib/analysis/exam-analytics";
import type { AiExamSummary } from "@/lib/ai/generate-exam-summary";
import { PDF_LABELS, pdfLanguage } from "./pdf-labels";

// Arabic script needs a font with real Arabic glyphs/shaping — the built-in
// Helvetica/Times/Courier fonts only cover Latin, so Somali/English render
// fine on those but Arabic would come out as empty boxes without this.
Font.register({
  family: "Amiri",
  fonts: [
    { src: "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf" },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf",
      fontWeight: 700,
    },
  ],
});

function makeStyles(isRtl: boolean) {
  const fontFamily = isRtl ? "Amiri" : "Helvetica";
  const align = isRtl ? "right" : "left";

  return StyleSheet.create({
    page: { padding: 32, fontSize: 10, fontFamily, direction: isRtl ? "rtl" : "ltr" },
    brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    brand: { fontSize: 12, fontWeight: 700, color: "#0ea5e9" },
    schoolName: { fontSize: 16, fontWeight: 700, textAlign: align, marginTop: 8 },
    title: { fontSize: 13, fontWeight: 700, marginTop: 4, textAlign: align },
    subtitle: { fontSize: 10, color: "#64748b", marginBottom: 12, textAlign: align },
    sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 6, textAlign: align },
    statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
    statBox: { border: "1pt solid #e2e8f0", borderRadius: 4, padding: 8, width: "18%" },
    statValue: { fontSize: 14, fontWeight: 700, textAlign: align },
    statLabel: { fontSize: 8, color: "#64748b", textAlign: align },
    table: { display: "flex", width: "auto" },
    tableRow: { flexDirection: isRtl ? "row-reverse" : "row", borderBottom: "1pt solid #e2e8f0" },
    tableHeaderRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      borderBottom: "1pt solid #0f172a",
      backgroundColor: "#f1f5f9",
    },
    th: { flex: 1, padding: 4, fontSize: 7.5, fontWeight: 700, textAlign: align },
    td: { flex: 1, padding: 4, fontSize: 7.5, textAlign: align },
    paragraph: { fontSize: 9, lineHeight: 1.6, marginBottom: 6, textAlign: align },
    paragraphBold: { fontSize: 9, lineHeight: 1.6, marginBottom: 6, fontWeight: 700, textAlign: align },
    bullet: { fontSize: 9, marginBottom: 3, textAlign: align },
    listRow: { flexDirection: isRtl ? "row-reverse" : "row", justifyContent: "space-between", marginBottom: 3 },
    listName: { fontSize: 9, textAlign: align },
    listValue: { fontSize: 9, color: "#64748b", textAlign: align },
    alertText: { fontSize: 8.5, marginBottom: 3, textAlign: align, color: "#92400e" },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 32,
      right: 32,
      fontSize: 7,
      color: "#94a3b8",
      textAlign: "center",
    },
  });
}

export function ExamReportDocument({
  language,
  schoolName,
  examTitle,
  className,
  examDate,
  summary,
  subjects,
  students,
  studentSubjectMarks,
  examMaxMark,
  topPerformers,
  strugglingStudents,
  dataIntegrityAlerts,
  aiSummary,
}: {
  language: string;
  schoolName: string;
  examTitle: string;
  className: string;
  examDate: string | null;
  summary: ExamSummary | null;
  subjects: SubjectStat[];
  students: StudentStat[];
  studentSubjectMarks: Record<string, Record<string, number>>;
  examMaxMark: number;
  topPerformers: StudentStat[];
  strugglingStudents: StudentStat[];
  dataIntegrityAlerts: DataIntegrityAlert[];
  aiSummary: AiExamSummary | null;
}) {
  const lang = pdfLanguage(language);
  const isRtl = lang === "ar";
  const L = PDF_LABELS[lang];
  const s = makeStyles(isRtl);

  // A student's score is always shown out of the exam's own max mark (e.g.
  // 100) — never a sum across every subject, which would read as "/300".
  const score = (average: number | null) => `${average ?? 0} / ${examMaxMark}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.brandRow}>
          <Text style={s.brand}>Grade AI</Text>
        </View>
        <Text style={s.schoolName}>{schoolName || "—"}</Text>
        <Text style={s.title}>{examTitle}</Text>
        <Text style={s.subtitle}>
          {className}
          {examDate ? ` · ${examDate}` : ""}
        </Text>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{summary?.student_count ?? 0}</Text>
            <Text style={s.statLabel}>{L.students}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{summary?.subject_count ?? 0}</Text>
            <Text style={s.statLabel}>{L.subjects}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{summary?.class_average ?? "—"}</Text>
            <Text style={s.statLabel}>{L.classAverage}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{summary ? `${summary.pass_rate ?? 0}%` : "—"}</Text>
            <Text style={s.statLabel}>{L.passRate}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{summary ? `${summary.fail_rate ?? 0}%` : "—"}</Text>
            <Text style={s.statLabel}>{L.failRate}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>{L.subjectBreakdown}</Text>
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={s.th}>{L.subject}</Text>
            <Text style={s.th}>{L.average}</Text>
            <Text style={s.th}>{L.highest}</Text>
            <Text style={s.th}>{L.lowest}</Text>
            <Text style={s.th}>{L.passRate}</Text>
          </View>
          {subjects.map((subj) => (
            <View style={s.tableRow} key={subj.subject_id}>
              <Text style={s.td}>{subj.name}</Text>
              <Text style={s.td}>{subj.average}</Text>
              <Text style={s.td}>{subj.highest}</Text>
              <Text style={s.td}>{subj.lowest}</Text>
              <Text style={s.td}>{subj.pass_rate}%</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>{L.combinedRankings}</Text>
        <View style={s.table}>
          <View style={s.tableHeaderRow}>
            <Text style={s.th}>{L.rank}</Text>
            <Text style={[s.th, { flex: 2 }]}>{L.name}</Text>
            {subjects.map((subj) => (
              <Text style={s.th} key={subj.subject_id}>
                {subj.name}
              </Text>
            ))}
            <Text style={s.th}>{L.total}</Text>
            <Text style={s.th}>{L.percentage}</Text>
            <Text style={s.th}>{L.grade}</Text>
          </View>
          {students.map((student) => (
            <View style={s.tableRow} key={student.student_id}>
              <Text style={s.td}>{student.rank}</Text>
              <Text style={[s.td, { flex: 2 }]}>{student.full_name}</Text>
              {subjects.map((subj) => (
                <Text style={s.td} key={subj.subject_id}>
                  {student.student_id
                    ? (studentSubjectMarks[student.student_id]?.[subj.name ?? ""] ?? "—")
                    : "—"}
                </Text>
              ))}
              <Text style={s.td}>{score(student.average)}</Text>
              <Text style={s.td}>{student.percentage}%</Text>
              <Text style={s.td}>{student.grade}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>{L.topPerformers}</Text>
        {topPerformers.map((st) => (
          <View style={s.listRow} key={st.student_id}>
            <Text style={s.listName}>
              {st.rank}. {st.full_name}
            </Text>
            <Text style={s.listValue}>
              {score(st.average)} ({st.percentage}%) · {st.grade}
            </Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>{L.strugglingStudents}</Text>
        {strugglingStudents.map((st) => (
          <View style={s.listRow} key={st.student_id}>
            <Text style={s.listName}>
              {st.rank}. {st.full_name}
            </Text>
            <Text style={s.listValue}>
              {score(st.average)} ({st.percentage}%) · {st.grade}
            </Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>{L.dataIntegrity}</Text>
        {dataIntegrityAlerts.length === 0 ? (
          <Text style={s.paragraph}>{L.noDataIntegrityIssues}</Text>
        ) : (
          dataIntegrityAlerts.map((alert) => (
            <Text style={s.alertText} key={alert.studentId}>
              {alert.studentName}
              {alert.studentCode ? ` (${alert.studentCode})` : ""} — {L.missing}:{" "}
              {alert.missingSubjects.join(", ")}
            </Text>
          ))
        )}

        {aiSummary ? (
          <View break>
            <Text style={s.sectionTitle}>{L.aiAnalysis}</Text>
            <Text style={s.paragraph}>{aiSummary.executiveSummary}</Text>
            <Text style={s.paragraph}>{aiSummary.classPerformance}</Text>
            <Text style={s.paragraph}>{aiSummary.topStudents}</Text>
            <Text style={s.paragraph}>{aiSummary.studentsNeedingAttention}</Text>
            <Text style={s.paragraph}>{aiSummary.strongSubjects}</Text>
            <Text style={s.paragraph}>{aiSummary.weakSubjects}</Text>
            <Text style={s.paragraph}>{aiSummary.subjectInsights}</Text>
            <Text style={s.paragraph}>{aiSummary.studentPerformanceInsights}</Text>
            <Text style={s.paragraph}>{aiSummary.termTrends}</Text>
            <Text style={s.paragraph}>{aiSummary.dataIntegrityNotes}</Text>
            <Text style={s.paragraphBold}>{L.recommendations}:</Text>
            {aiSummary.recommendations.map((r, i) => (
              <Text key={i} style={s.bullet}>
                • {r}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={s.footer} fixed>
          {L.generatedOn} {new Date().toLocaleDateString("en-GB")} · {L.poweredBy}
        </Text>
      </Page>
    </Document>
  );
}
