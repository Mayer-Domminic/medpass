export interface UserProfile {
    net_id: string;
    email: string;
    full_name: string;
    is_active: boolean;
  }
  
  export interface Extracurricular {
    name: string;
    description: string;
    hours: number;
  }
  
  export interface Clerkship {
    name: string;
    company: string;
    start_date: string;
    end_date: string;
  }
  
  export interface StudentInfo {
    student_id: number;
    extracurriculars: Extracurricular[];
    clerkships: Clerkship[];
  }
  
  export interface Enrollment {
    class_name: string;
    semester: string;
    grade: number;
    attendance: number;
    status: 'Pass' | 'Fail';
  }
  
  export interface ExamResult {
    exam_name: string;
    score: number;
    status: 'Pass' | 'Fail';
    date: string | null;
  }
  
  export interface FacultyClass {
    class_name: string;
    semester: string;
    date_taught: string;
  }
  
  export interface FacultyInfo {
    faculty_id: number;
    position: string;
    classes: FacultyClass[];
  }
  
  export interface UserData {
    profile: UserProfile;
    student_info: StudentInfo | null;
    faculty_info: FacultyInfo | null;
    enrollments: Enrollment[];
    exam_results: ExamResult[];
    grades: any[];
  }