export interface Student {
  id: string;
  stt: number;
  name: string;
}

export interface ClassConfig {
  schoolName: string;
  className: string;
  teacherName: string;
  zaloPhone: string;
  reporterName: string;
  reporterRole: string;
  students: Student[];
}

export type ReportType = 'ABSENT' | 'VIOLATION' | 'COMMENDATION';

export type AbsentType = 'EXCUSED' | 'UNEXCUSED' | 'LATE' | 'TRUANT';

export interface ReportItem {
  id: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  dateDisplay: string;
  period: string; // "Tiết 1", "Tiết 2", "Cả ngày", ...
  subject: string; // "Toán", "Văn", ...
  type: ReportType;
  absentType?: AbsentType;
  violationTags: string[];
  commendationTags: string[];
  customNote: string;
  students: Student[];
  reporter: string;
  teacherName: string;
  className: string;
  schoolName: string;
  formattedMessage: string;
}
