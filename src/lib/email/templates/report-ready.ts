// Plain server-rendered HTML string — no React Email dependency needed for
// a single fixed template. Keep this file free of anything that isn't valid
// in an email client's very limited CSS/HTML subset (inline styles, tables
// for layout, no flex/grid).
export type ReportReadyLanguage = "en" | "so" | "ar";

export type ReportReadyEmailData = {
  recipientName: string;
  schoolName: string;
  className: string;
  examTitle: string;
  classAverage: number | null;
  passRate: number | null;
  failedStudentsCount: number;
  reportUrl: string;
  language: ReportReadyLanguage;
  /** Whether the PDF was actually attached to this send — the copy only
   * claims an attachment exists when one really does. */
  hasAttachment: boolean;
};

type LanguageLabels = {
  subject: (examTitle: string, schoolName: string) => string;
  preheader: string;
  heading: string;
  greeting: (name: string) => string;
  intro: string;
  attachmentNote: string;
  summaryLabel: string;
  school: string;
  class: string;
  exam: string;
  classAverage: string;
  passRate: string;
  failedStudents: string;
  cta: string;
  footer: string;
  poweredBy: string;
};

const LABELS: Record<ReportReadyLanguage, LanguageLabels> = {
  en: {
    subject: (examTitle, schoolName) => `Grade AI Examination Report: ${examTitle} - ${schoolName}`,
    preheader: "is ready to view.",
    heading: "Your examination report is ready",
    greeting: (name: string) => `Hi ${name || "there"},`,
    intro:
      "We're pleased to let you know that your Grade AI examination report has been successfully analyzed and saved. A summary of the results is below.",
    attachmentNote:
      "The full official PDF report — including the subject breakdown, rankings, and AI analysis — is attached to this email for your records.",
    summaryLabel: "Summary",
    school: "School",
    class: "Class",
    exam: "Examination",
    classAverage: "Class average",
    passRate: "Pass rate",
    failedStudents: "Failed students",
    cta: "Open full report",
    footer: "This is an automated notification from Grade AI. Individual student marks are never included in this email — only the class-level summary above and the attached report.",
    poweredBy: "Powered by Space Cloud",
  },
  so: {
    subject: (examTitle, schoolName) => `Warbixinta Imtixaanka Grade AI: ${examTitle} - ${schoolName}`,
    preheader: "ayaa diyaar u ah in la eego.",
    heading: "Warbixintaada imtixaanka ayaa diyaar ah",
    greeting: (name: string) => `Salaan ${name || ""},`,
    intro:
      "Waxaan ku faraxsanahay inaan kuu sheegno in warbixinta imtixaanka ee Grade AI si guul leh loo falanqeeyay oo la kaydiyay. Kooban natiijada ayaa hoos ku qoran.",
    attachmentNote:
      "Warbixinta rasmiga ah ee PDF-ka oo dhamaystiran — oo ay ku jiraan falanqaynta maadooyinka, darajooyinka, iyo falanqaynta AI-ga — ayaa lagu lifaaqay iimaylkan.",
    summaryLabel: "Kooban",
    school: "Dugsiga",
    class: "Fasalka",
    exam: "Imtixaanka",
    classAverage: "Celceliska fasalka",
    passRate: "Heerka guusha",
    failedStudents: "Ardayda dhacday",
    cta: "Fur warbixinta oo dhamaystiran",
    footer: "Tani waa ogeysiis otomaatig ah oo ka socda Grade AI. Buundooyinka gaarka ah ee ardayga lama darsan iimaylkan — waxaa keliya ku jira koobka kor ku qoran iyo warbixinta lifaaqan.",
    poweredBy: "Waxaa awoodda siiya Space Cloud",
  },
  ar: {
    subject: (examTitle, schoolName) => `تقرير Grade AI للامتحان: ${examTitle} - ${schoolName}`,
    preheader: "جاهز للعرض.",
    heading: "تقرير الامتحان الخاص بك جاهز",
    greeting: (name: string) => `مرحباً ${name || ""}،`,
    intro:
      "يسعدنا إعلامك بأن تقرير الامتحان الخاص بك في Grade AI قد تم تحليله وحفظه بنجاح. تجد أدناه ملخصاً للنتائج.",
    attachmentNote:
      "التقرير الرسمي الكامل بصيغة PDF — ويشمل تحليل كل مادة، والترتيب، وتحليل الذكاء الاصطناعي — مرفق بهذه الرسالة لسجلاتك.",
    summaryLabel: "الملخص",
    school: "المدرسة",
    class: "الصف",
    exam: "الامتحان",
    classAverage: "معدل الفصل",
    passRate: "نسبة النجاح",
    failedStudents: "الطلاب الراسبون",
    cta: "فتح التقرير الكامل",
    footer: "هذا إشعار تلقائي من Grade AI. لا تتضمن هذه الرسالة أي درجات فردية للطلاب — فقط الملخص أعلاه والتقرير المرفق.",
    poweredBy: "مدعوم من Space Cloud",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function reportReadyEmailSubject(
  language: ReportReadyLanguage,
  examTitle: string,
  schoolName: string,
): string {
  return LABELS[language].subject(examTitle, schoolName);
}

export function reportReadyEmailText(data: ReportReadyEmailData): string {
  const L = LABELS[data.language];
  const lines = [
    L.greeting(data.recipientName),
    "",
    L.intro,
    ...(data.hasAttachment ? ["", L.attachmentNote] : []),
    "",
    `${L.summaryLabel}:`,
    `${L.school}: ${data.schoolName}`,
    `${L.class}: ${data.className}`,
    `${L.exam}: ${data.examTitle}`,
    `${L.classAverage}: ${data.classAverage ?? "—"}`,
    `${L.passRate}: ${data.passRate ?? "—"}%`,
    `${L.failedStudents}: ${data.failedStudentsCount}`,
    "",
    `${L.cta}: ${data.reportUrl}`,
    "",
    L.footer,
  ];
  return lines.join("\n");
}

export function reportReadyEmailHtml(data: ReportReadyEmailData): string {
  const L = LABELS[data.language];
  const isRtl = data.language === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";

  const subject = L.subject(data.examTitle, data.schoolName);

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0;color:#64748b;font-size:13px;text-align:${align};">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;text-align:${isRtl ? "left" : "right"};">${escapeHtml(value)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${data.language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(subject)} ${escapeHtml(L.preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e2e8f0;text-align:${align};">
                <span style="font-size:16px;font-weight:700;color:#0ea5e9;">Grade AI</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;text-align:${align};" dir="${dir}">
                <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${escapeHtml(L.heading)}</h1>
                <p style="margin:0 0 8px;font-size:14px;color:#334155;">${escapeHtml(L.greeting(data.recipientName))}</p>
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(L.intro)}</p>
                ${
                  data.hasAttachment
                    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:12px 16px;font-size:13px;line-height:1.5;color:#1e40af;text-align:${align};">
                      📎 ${escapeHtml(L.attachmentNote)}
                    </td>
                  </tr>
                </table>`
                    : ""
                }
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#94a3b8;">${escapeHtml(L.summaryLabel)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                  ${row(L.school, data.schoolName)}
                  ${row(L.class, data.className)}
                  ${row(L.exam, data.examTitle)}
                  ${row(L.classAverage, String(data.classAverage ?? "—"))}
                  ${row(L.passRate, `${data.passRate ?? "—"}%`)}
                  ${row(L.failedStudents, String(data.failedStudentsCount))}
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                  <tr>
                    <td style="border-radius:9999px;background-color:#0ea5e9;">
                      <a href="${data.reportUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">
                        ${escapeHtml(L.cta)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:12px;color:#94a3b8;">${escapeHtml(L.footer)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;">
                <span style="font-size:11px;color:#94a3b8;">${escapeHtml(L.poweredBy)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
