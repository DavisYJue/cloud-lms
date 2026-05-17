# Cloud LMS — User Manual

Cloud LMS is a web-based Learning Management System. This manual covers all features available to each role: Student, Teacher, Assistant, and Administrator.

---

## Table of Contents

1. [Login](#login)
2. [Student Guide](#student-guide)
3. [Teacher Guide](#teacher-guide)
4. [Assistant Guide](#assistant-guide)
5. [Administrator Guide](#administrator-guide)

---

## Login

- Go to the login page and enter your username and password.
- After a successful login, you will be automatically redirected based on your role:
  - **Student** → `/lmsMainPageStudent`
  - **Teacher** → `/lmsMainPage`
  - **Assistant** → `/lmsMainPage`
  - **Administrator** → `/lmsMainPageAdmin`
- If your credentials are incorrect, an error message will appear. Check your username and password and try again.

---

## Student Guide

### Main Page (`/lmsMainPageStudent`)

- After login, students land on the main page which displays all available courses.
- Courses are shown as cards and can be either:
  - **Public courses** — visible to all students, including courses you are not enrolled in.
  - **Private courses** — only visible to enrolled students.
- Each course card has a **View Course** button to open the course details.
- At the top of the page there is a **Profile** button. Clicking it shows two options:
  - **Edit Profile** — redirects to `/editInformation`
  - **Logout** — logs you out and returns you to the login page

### Edit Profile (`/editInformation`)

Students can update the following information:

- Profile picture
- Email address
- Telephone number
- Address
- Bio
- Password

Fill in the fields you want to change and save. Fields that is not edited will remain unchanged.

### Course Details (`/courseDetails`)

Clicking **View Course** on any course card opens the course details page. Here you can see:

- All **teaching materials** uploaded by the teacher or assistant for that course.
- All **assignments** given by the course staff, including:
  - Assignment title
  - Assignment description
  - Due date
  - File attachment(s)
  - Your submission grade (once graded)

#### Submitting an Assignment

- Each assignment has a submission section.
- Upload your answer file and submit before the due date.
- After the due date, your submission will be marked as **Late**.
- Once graded, your grade will appear inside the assignment details.

---

## Teacher Guide

### Main Page (`/lmsMainPage`)

- Teachers land on the same main page as assistants after login.
- The page shows all available courses (public and private).
- There is a **Profile** button with the same options as the student (Edit Profile / Logout).
- Teachers have an additional button: **Manage Course You Teach** — clicking it redirects to `/manageMainPage`.
- If the teacher also has an administrator role, an additional **Create Account** button is visible beside the manage button.

### Edit Profile (`/editInformation`)

Same as the student edit profile — teachers can update profile picture, email, telephone, address, bio, and password.

### Manage Main Page (`/manageMainPage`)

This is the teacher's course management dashboard. Teachers can:

- **Add Course** — create a new course by filling in course details.
- **Edit Course** — update course information such as title, description, duration, and dates.
- **Delete Course** — permanently remove a course and all its associated data.
- **Manage Course** — opens a popup with four management options:
  - **Manage Students** → `/manageStudent`
  - **Manage Teaching Assistants** → `/manageAssistance`
  - **Manage Materials** → `/manageMaterial`
  - **Manage Assignments** → `/manageAssignment`

### Manage Students (`/manageStudent`)

- View all enrolled participants in three separate tables: **Students**, **Teachers**, and **Assistants** (all three roles can participate in a course).
- Each table has a **search bar** to find participants quickly.
- **Add Participant** — search for and add any available student, teacher, or assistant to the course.
- **Remove Participant** — remove any enrolled participant from the course.

### Manage Teaching Assistants (`/manageAssistance`)

- View all assigned teaching assistants in a table with a search bar.
- **Add Assistant** — search for and assign an available assistant to the course.
- **Remove Assistant** — unassign an assistant from the course.

### Manage Materials (`/manageMaterial`)

- View all uploaded teaching materials for the course.
- **Add Material** — opens a popup where you can enter a title and upload a file (one file per material).
- For each existing material:
  - **Open File** — view the attached file.
  - **Edit Title** — opens a popup to rename the material.
  - **Edit File** — opens a popup to replace the attached file.
  - **Delete Material** — permanently removes the material.
- Note: each material supports only one file attachment. To change the file, use **Edit File**.

### Manage Assignments (`/manageAssignment`)

- View all assignments for the course.
- **Add Assignment** — redirects to `/addAssignment`.
- For each assignment:
  - **Edit Assignment** — redirects to `/editAssignment`.
  - **Delete Assignment** — permanently removes the assignment and all its submissions.
  - **View Submissions** — see which students have submitted and which have not.
  - **Grade Submission** — enter a grade for a submitted assignment.
  - **Submission Status** — each submission is marked as **On Time** or **Late** based on the due date.

### Add Assignment (`/addAssignment`)

Fill in the following fields to create a new assignment:

- **Title** — assignment name
- **Description** — instructions or details for the assignment
- **Due Date** — deadline for student submissions
- **Attachments** — one or more files can be attached (e.g. reference documents, question sheets)

Click **Submit** to create the assignment.

### Edit Assignment (`/editAssignment`)

Teachers can update the following:

- Title
- Description
- Due date
- Add new attachment files (one or more)

Note: existing attachments cannot be deleted from this page. Only new attachments can be added.

---

## Assistant Guide

### Main Page (`/lmsMainPage`)

- Assistants share the same main page as teachers after login.
- The page shows all available courses.
- There is a **Profile** button (Edit Profile / Logout).
- Assistants have the **Manage Course You Teach** button which redirects to `/manageMainPageAssistant`.

### Manage Main Page (`/manageMainPageAssistant`)

Assistants have limited management access. They **cannot** add, edit, or delete courses. They can only manage course content via the **Manage Course** button, which opens a popup with two options:

- **Manage Materials** → `/manageMaterial`
- **Manage Assignments** → `/manageAssignment`

### Manage Materials (`/manageMaterial`)

Same as teacher — assistants can add, edit, and delete teaching materials for their assigned courses.

### Manage Assignments (`/manageAssignment`)

Same as teacher — assistants can add assignments, edit assignments, view submissions, grade submissions, and check submission status. They cannot delete assignments.

---

## Administrator Guide

### Main Page (`/lmsMainPageAdmin`)

- Administrators have their own dedicated main page after login.
- The page includes all features available on the teacher main page.
- There is an additional **Create Account** button that redirects to `/createAccount`.

### Create Account (`/createAccount`)

Administrators can create new user accounts for any role:

- Student
- Teacher
- Assistant
- Administrator

Fill in the required account details and assign the appropriate role. The new account will be immediately available for login.

### Edit Profile (`/editInformation`)

Same as other roles — administrators can update profile picture, email, telephone, address, bio, and password.

---

## General Notes

- **Session** — your session is saved for 7 days. You will remain logged in unless you manually log out or the session expires.
- **File uploads** — supported file types depend on the context. For course materials and assignments, PDF files are recommended as they are indexed by the course assistant for Q&A.
- **Course Assistant** — a chat assistant is available on all pages (bottom-right corner). Click the chat icon to open it. You can ask questions about your courses, assignments, grades, submissions, and course materials. The assistant is role-aware and strictly scoped to your own data:
  - **Students** can only query their own enrollments, submissions, and grades.
  - **Teachers** can query their own courses, their students, TAs, and submissions. They can also query courses they joined as a participant.
  - **Assistants** can query courses they are assigned to and their own submissions as a participant. They cannot access student or TA management data.
  - **Administrators** can query system-wide data including all courses, accounts, and statistics.
  - No role can access another user's personal data.
- **Chat history** — your chat history is kept for the current browser session. It will be cleared when you log out or close the browser.
