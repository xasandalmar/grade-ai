# **GRADE AI — AI EXAM ANALYSIS PLATFORM**

## **1\. PROJECT**

Build a production-ready SaaS web application called **Grade AI**.

Grade AI allows schools/users to upload examination results through Excel and automatically analyze student performance, generate reports, and ask an AI assistant questions about their examination data.

### **Technology**

* Next.js  
* TypeScript  
* Tailwind CSS  
* Supabase  
* PostgreSQL  
* Supabase Auth  
* OpenAI API  
* GPT-5.6 Luna  
* Resend  
* GitHub  
* Vercel

The OpenAI API key is already available/configured by the project owner. Use the configured OpenAI API and **GPT-5.6 Luna** for AI features.

---

# **2\. CORE FEATURES**

## **Authentication**

Users can:

* Register  
* Login  
* Logout  
* Reset password

After registration:

* Create user profile  
* Send a professional welcome email through Resend

Each normal user can only access their own school/data.

---

# **3\. SCHOOL DATA**

Users can manage:

* School  
* Academic year  
* Classes  
* Subjects  
* Students  
* Exams

---

# **4\. EXCEL EXAM UPLOAD**

The main input method is Excel.

Support:

* `.xlsx`  
* `.xls`  
* `.csv`

Example:

| Student ID | Student Name | Class | Math | English | Somali | Science |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| ST001 | Ahmed Ali | Grade 8 | 85 | 72 | 90 | 66 |

System flow:

**Upload → Read → Validate → Preview → Confirm → Save → Analyze**

Validate:

* Missing names  
* Duplicate students  
* Invalid marks  
* Marks above maximum  
* Missing class  
* Missing subjects

Never silently change marks.

---

# **5\. AUTOMATIC ANALYSIS**

After successful Excel import, calculate automatically:

### **Student**

* Total marks  
* Average  
* Percentage  
* Grade  
* Rank  
* Passed subjects  
* Failed subjects  
* Strongest subject  
* Weakest subject

### **Class**

* Number of students  
* Class average  
* Pass rate  
* Fail rate  
* Highest student  
* Lowest student  
* Strongest subject  
* Weakest subject

### **Subject**

* Average  
* Highest mark  
* Lowest mark  
* Pass rate  
* Fail rate  
* Number passed  
* Number failed

The mathematical calculations must be done by the application/database, **not by OpenAI**.

---

# **6\. AI REPORT**

After the calculations are complete, use **OpenAI GPT-5.6 Luna** to create the written analysis.

AI report should include:

* Executive summary  
* Class performance  
* Top students  
* Students requiring attention  
* Strong subjects  
* Weak subjects  
* Subject insights  
* Student performance insights  
* Recommendations

AI must only use verified data supplied by the application.

AI must never invent marks, students, rankings or statistics.

---

# **7\. INDIVIDUAL STUDENT REPORT**

User can select a student and request:

**“Generate report for Ahmed Ali.”**

System generates:

* Student average  
* Rank  
* Subject results  
* Passed subjects  
* Failed subjects  
* Strongest subject  
* Weakest subject  
* Performance summary  
* Recommendations

If multiple students have the same name, ask the user to select the correct student instead of guessing.

---

# **8\. AI CHAT ASSISTANT**

Create an **AI Assistant** page.

User can ask questions such as:

* “Who are the top 10 students?”  
* “Which subject performed worst?”  
* “Who failed Mathematics?”  
* “Generate a report for Ahmed Ali.”  
* “Give me the full report for Grade 8.”

The AI must only access data belonging to the authenticated user’s school.

Do not give the AI unrestricted database access.

Use controlled server-side functions/tools such as:

* Get class performance  
* Get student performance  
* Get subject performance  
* Get top students  
* Get failed students  
* Generate student report  
* Generate class report

---

# **9\. REPORT LANGUAGE**

Every generated report must have a language selector:

### **English**

### **Somali**

### **Arabic**

Example buttons:

**English | Soomaali | العربية**

The user can click a language and generate/view the report in that language.

Arabic must support **RTL**.

The language selector must work for:

* Class reports  
* Subject reports  
* Student reports  
* AI-generated summaries

---

# **10\. REPORT DOWNLOAD**

Every report page must have:

### **Download Report**

User can click the button and download the report.

Preferred format:

**PDF**

Also provide:

**Print Report**

Downloaded report should contain:

* Grade AI branding  
* School name  
* Class  
* Examination  
* Date  
* Statistics  
* Tables  
* Charts where appropriate  
* AI summary  
* Recommendations  
* Selected report language

If the user selects Somali, the PDF should be Somali.

If English, English.

If Arabic, Arabic with proper RTL formatting.

---

# **11\. AUTOMATIC EMAIL**

When an examination has been successfully analyzed:

1. Generate report.  
2. Save report.  
3. Send email automatically through **Resend** to the authenticated user’s registered email.

Email should say:

**Your Grade AI examination report is ready.**

Include:

* School  
* Class  
* Examination  
* Average  
* Pass rate  
* Failed students count  
* Link to open the full report

Do not expose unnecessary student-sensitive information inside the email.

Also allow:

**Email Report Again**

from the report page.

---

# **12\. DASHBOARD**

Main dashboard should show:

* Total students  
* Total classes  
* Total subjects  
* Exams  
* Reports  
* Overall average  
* Pass rate  
* Failed students

Charts:

* Class performance  
* Subject performance  
* Pass/fail  
* Top students

Recent reports should also appear.

---

# **13\. REPORT HISTORY**

Create a Reports page containing:

* Report name  
* Class  
* Examination  
* Report type  
* Date  
* Status

Actions:

* Open  
* Download PDF  
* Print  
* Email again

---

# **14\. SUPER ADMIN**

Create a separate **Super Admin Dashboard**.

Super Admin has full platform management.

Can:

* View all users  
* Search users  
* View user details  
* Activate users  
* Deactivate users  
* Suspend users  
* Reactivate users  
* View registration date  
* View last activity  
* View number of exams  
* View number of reports  
* View AI usage  
* View platform statistics  
* View audit logs

Dashboard statistics:

* Total users  
* Active users  
* Suspended users  
* Total schools  
* Total students  
* Total exams  
* Total reports  
* AI requests  
* Emails sent

Normal users must never access Super Admin data.

---

# **15\. SECURITY**

Use:

* Supabase Auth  
* PostgreSQL  
* Row Level Security (RLS)  
* Server-side authorization  
* Input validation  
* Excel validation  
* Secure API routes  
* Rate limiting where appropriate

Critical rule:

**User A must never be able to see User B’s school, students, exams or reports.**

Never expose:

* OpenAI API key  
* Resend API key  
* Supabase secret/service-role key

to the browser.

---

# **16\. DESIGN**

Design must be modern, clean and professional.

Main colors:

* White  
* Sky Blue  
* Light Gray

Style:

* Clean SaaS dashboard  
* Rounded cards  
* Subtle shadows  
* Clear typography  
* Professional charts  
* Responsive design

Support:

### **☀️ Light Mode**

### **🌙 Dark Mode**

Fully responsive:

* Desktop  
* Tablet  
* Mobile

---

# **17\. LANGUAGES**

The entire application UI must support:

**English**

**Somali**

**Arabic**

Arabic must support RTL.

Do not hard-code UI text directly inside components.

Use a proper i18n system.

---

# **18\. DATABASE**

Create a secure multi-tenant database.

Core tables should include:

* profiles  
* schools  
* academic\_years  
* classes  
* subjects  
* students  
* exams  
* exam\_subjects  
* exam\_results  
* imports  
* reports  
* ai\_conversations  
* ai\_messages  
* email\_logs  
* audit\_logs

Use proper relationships, indexes and RLS policies.

---

# **19\. DEVELOPMENT PROCESS**

IMPORTANT:

Do NOT build the whole system at once.

Build it in phases.

### **PHASE 0 — Architecture**

First inspect the project and create:

* Architecture  
* Database design  
* Folder structure  
* Security plan  
* AI architecture  
* Excel flow

Then STOP.

---

### **PHASE 1 — Foundation**

Build:

* Next.js  
* UI  
* Theme  
* Light/Dark mode  
* English/Somali/Arabic  
* RTL  
* Main layout

STOP for review.

---

### **PHASE 2 — Authentication**

Build:

* Register  
* Login  
* Logout  
* Password reset  
* Profiles  
* Roles  
* Supabase Auth  
* RLS

STOP for review.

---

### **PHASE 3 — School Data**

Build:

* Schools  
* Academic years  
* Classes  
* Subjects  
* Students  
* Exams

STOP for review.

---

### **PHASE 4 — Excel \+ Analysis**

Build:

* Excel upload  
* Validation  
* Preview  
* Import  
* Calculations  
* Rankings  
* Class/subject/student statistics

STOP for review.

---

### **PHASE 5 — OpenAI**

Connect the existing OpenAI API.

Use:

**GPT-5.6 Luna**

Build:

* AI class reports  
* Student reports  
* Subject analysis  
* Recommendations  
* Structured AI output

STOP for review.

---

### **PHASE 6 — AI Assistant**

Build:

* Chat interface  
* Secure data tools  
* Student queries  
* Class queries  
* Subject queries  
* Report generation

STOP for review.

---

### **PHASE 7 — Reports \+ PDF \+ Email**

Build:

* Report pages  
* English/Somali/Arabic report generation  
* Arabic RTL reports  
* PDF download  
* Print  
* Resend  
* Welcome email  
* Automatic report email  
* Email logs

STOP for review.

---

### **PHASE 8 — Super Admin**

Build:

* Admin dashboard  
* User management  
* Usage statistics  
* Suspend/activate users  
* Audit logs

STOP for review.

---

### **PHASE 9 — Production**

Connect:

**GitHub → Supabase → Vercel → Resend → OpenAI**

Run:

* Tests  
* Security checks  
* RLS tests  
* Production build  
* Mobile testing  
* Language testing  
* PDF testing  
* Email testing

Deploy production.

---

# **20\. CLAUDE CODE RULE**

After every phase:

1. Test the implementation.  
2. Run lint.  
3. Run TypeScript checks.  
4. Check security.  
5. Review changed files.  
6. Explain what was completed.  
7. Explain any issues.  
8. Show what should be tested manually.  
9. STOP.

Do NOT automatically continue.

End every completed phase with:

**PHASE X COMPLETE — READY FOR REVIEW**

Wait for my approval before continuing.

---

# **21\. FIRST ACTION**

When this specification is provided:

DO NOT start building the whole application.

First inspect the project.

Then perform **PHASE 0 only**.

Create the architecture and database/security plan.

Then stop and wait for my approval.

The final goal is a secure, production-ready:

**GRADE AI — AI Examination Analysis & Reporting Platform**

END.

