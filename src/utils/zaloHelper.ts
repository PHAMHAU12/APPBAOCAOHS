import { ClassConfig, ReportType, AbsentType, Student } from '../types';

/**
 * Clean phone numbers to standard format for Zalo API
 * Converts e.g. "0988 123 456" -> "0988123456"
 * or "+84988..." -> "0988..." or kept as is
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.substring(3);
  } else if (cleaned.startsWith('84') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Generate Zalo deep link / web link
 * zalo.me links will open the Zalo mobile app or Zalo PC / web
 */
export function getZaloLink(phoneNumber: string): string {
  const cleaned = cleanPhoneNumber(phoneNumber);
  if (!cleaned) return '#';
  return `https://zalo.me/${cleaned}`;
}

/**
 * Format human-readable Vietnamese date
 */
export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = daysOfWeek[dateObj.getDay()] || '';
    return `${dayName}, ngày ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format report message string
 */
export function generateReportMessage(params: {
  config: ClassConfig;
  reportType: ReportType;
  absentType: AbsentType;
  selectedStudents: Student[];
  violationTags: string[];
  commendationTags: string[];
  customNote: string;
  dateStr: string;
  period: string;
  subject: string;
}): string {
  const {
    config,
    reportType,
    absentType,
    selectedStudents,
    violationTags,
    commendationTags,
    customNote,
    dateStr,
    period,
    subject,
  } = params;

  const dateFormatted = formatVietnameseDate(dateStr);
  const timeDetails = subject.trim() ? `${period} (Môn: ${subject.trim()})` : period;

  let title = '📋 BÁO CÁO NỀ NẾP & CHUYÊN CẦN';
  let categoryLabel = '';

  if (reportType === 'ABSENT') {
    title = '🚨 BÁO CÁO HỌC SINH VẮNG HỌC';
    switch (absentType) {
      case 'EXCUSED':
        categoryLabel = 'Vắng CÓ PHÉP';
        break;
      case 'UNEXCUSED':
        categoryLabel = 'Vắng KHÔNG PHÉP';
        break;
      case 'LATE':
        categoryLabel = 'Đi học muộn / Trễ giờ';
        break;
      case 'TRUANT':
        categoryLabel = 'Bỏ tiết giữa giờ';
        break;
      default:
        categoryLabel = 'Vắng học';
    }
  } else if (reportType === 'VIOLATION') {
    title = '⚠️ BÁO CÁO VI PHẠM NỘI QUY LỚP HỌC';
    categoryLabel = 'Vi phạm nội quy';
  } else if (reportType === 'COMMENDATION') {
    title = '🌟 BÁO CÁO TUYÊN DƯƠNG / ĐIỂM TỐT';
    categoryLabel = 'Khen thưởng & Điểm cộng';
  }

  // Format student names
  const studentListText =
    selectedStudents.length > 0
      ? selectedStudents
          .map((s, idx) => `  ${idx + 1}. [STT ${s.stt}] ${s.name}`)
          .join('\n')
      : '  (Chưa chọn học sinh)';

  // Format reason / tags
  const tagsList =
    reportType === 'VIOLATION'
      ? violationTags
      : reportType === 'COMMENDATION'
      ? commendationTags
      : [];

  const reasonsText =
    tagsList.length > 0
      ? tagsList.map((tag) => `  • ${tag}`).join('\n')
      : '';

  const customNoteText = customNote.trim() ? `  • Ghi chú: ${customNote.trim()}` : '';

  const detailsBlock: string[] = [];
  if (reasonsText) detailsBlock.push(reasonsText);
  if (customNoteText) detailsBlock.push(customNoteText);

  const reporterDisplay = config.reporterName
    ? `${config.reporterName} (${config.reporterRole || 'Ban cán sự'})`
    : config.reporterRole || 'Ban cán sự lớp';

  const teacherDisplay = config.teacherName ? config.teacherName : 'Thầy/Cô';

  const lines = [
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `${title}`,
    `🏫 Trường: ${config.schoolName || 'Chưa cập nhật'}`,
    `🏷️ Lớp: ${config.className || 'Chưa cập nhật'}`,
    `📅 Thời gian: ${dateFormatted} - ${timeDetails}`,
    `👤 Người báo cáo: ${reporterDisplay}`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `Kính gửi GVCN: ${teacherDisplay}`,
    ``,
    `📌 PHÂN LOẠI: ${categoryLabel}`,
    `👥 DANH SÁCH HỌC SINH (${selectedStudents.length} bạn):`,
    `${studentListText}`,
  ];

  if (detailsBlock.length > 0) {
    lines.push(``);
    lines.push(`📝 CHI TIẾT NỘI DUNG:`);
    lines.push(detailsBlock.join('\n'));
  }

  return lines.join('\n');
}

/**
 * Remove Vietnamese accents for fast fuzzy searching
 */
export function removeVietnameseTones(str: string): string {
  let s = str || '';
  s = s.toLowerCase();
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  return s;
}
