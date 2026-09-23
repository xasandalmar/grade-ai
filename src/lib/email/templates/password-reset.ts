// Same plain server-rendered HTML approach as templates/report-ready.ts — see
// that file's header comment for why (no React Email dependency, inline
// styles only, table-based layout for email client compatibility).
export type PasswordResetLanguage = "en" | "so" | "ar";

export type PasswordResetEmailData = {
  resetUrl: string;
  language: PasswordResetLanguage;
};

type LanguageLabels = {
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  cta: string;
  expiry: string;
  ignoreNote: string;
  poweredBy: string;
};

const LABELS: Record<PasswordResetLanguage, LanguageLabels> = {
  en: {
    subject: "Reset your Grade AI password",
    preheader: "Use this link to choose a new password.",
    heading: "Reset your password",
    intro: "We received a request to reset the password for your Grade AI account. Click the button below to choose a new one.",
    cta: "Reset password",
    expiry: "This link expires in 1 hour.",
    ignoreNote: "If you didn't request this, you can safely ignore this email — your password won't be changed.",
    poweredBy: "Powered by Space Cloud",
  },
  so: {
    subject: "Dib u deji furahaaga sirta ah ee Grade AI",
    preheader: "Isticmaal linkigan si aad furaha sirta ah u dib-u-dejiso.",
    heading: "Dib u deji furahaaga sirta ah",
    intro: "Waxaan helnay codsi lagu dib-u-dejinayo furaha sirta ah ee akoonkaaga Grade AI. Riix badhanka hoose si aad u dooratid mid cusub.",
    cta: "Dib u deji furaha sirta ah",
    expiry: "Linkigan wuxuu dhici doonaa 1 saac gudahood.",
    ignoreNote: "Haddaadan codsan tan, waad iska indho tirin kartaa iimaylkan — furahaaga sirta ah lama bedeli doono.",
    poweredBy: "Waxaa awoodda siiya Space Cloud",
  },
  ar: {
    subject: "إعادة تعيين كلمة مرور Grade AI الخاصة بك",
    preheader: "استخدم هذا الرابط لاختيار كلمة مرور جديدة.",
    heading: "إعادة تعيين كلمة المرور",
    intro: "تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في Grade AI. اضغط على الزر أدناه لاختيار كلمة مرور جديدة.",
    cta: "إعادة تعيين كلمة المرور",
    expiry: "تنتهي صلاحية هذا الرابط خلال ساعة واحدة.",
    ignoreNote: "إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة بأمان — لن يتم تغيير كلمة مرورك.",
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

export function passwordResetEmailSubject(language: PasswordResetLanguage): string {
  return LABELS[language].subject;
}

export function passwordResetEmailText(data: PasswordResetEmailData): string {
  const L = LABELS[data.language];
  return [L.intro, "", `${L.cta}: ${data.resetUrl}`, "", L.expiry, "", L.ignoreNote].join("\n");
}

export function passwordResetEmailHtml(data: PasswordResetEmailData): string {
  const L = LABELS[data.language];
  const isRtl = data.language === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${data.language}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(L.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${escapeHtml(L.subject)} ${escapeHtml(L.preheader)}
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
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(L.intro)}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                  <tr>
                    <td style="border-radius:9999px;background-color:#0ea5e9;">
                      <a href="${data.resetUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:9999px;">
                        ${escapeHtml(L.cta)}
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">${escapeHtml(L.expiry)}</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">${escapeHtml(L.ignoreNote)}</p>
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
