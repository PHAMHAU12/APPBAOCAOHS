import React, { useState } from 'react';
import {
  X,
  FileText,
  Presentation,
  Download,
  Printer,
  FileCheck,
  Mail,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { ClassConfig, ReportItem, Student } from '../types';

interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onShowToast: (msg: string, icon?: string) => void;
}

export const DocumentExportModal: React.FC<DocumentExportModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onShowToast,
}) => {
  const [docType, setDocType] = useState<'discipline' | 'weekly_report' | 'parent_invite' | 'slides'>('discipline');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(config.students[0]?.id || '');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>(history[0]?.id || '');

  // Slide Presenter State
  const [slideIndex, setSlideIndex] = useState(0);

  if (!isOpen) return null;

  const selectedStudent = config.students.find((s) => s.id === selectedStudentId) || config.students[0];
  const selectedReport = history.find((h) => h.id === selectedHistoryId) || history[0];

  const todayStr = new Date().toLocaleDateString('vi-VN');
  const dateParts = new Date();
  const day = dateParts.getDate();
  const month = dateParts.getMonth() + 1;
  const year = dateParts.getFullYear();

  // Helper to trigger print window
  const printHtmlContent = (html: string, title: string) => {
    const win = window.open('', '_blank');
    if (!win) {
      onShowToast('Trình duyệt chặn mở cửa sổ mới. Vui lòng cho phép popup!', '⚠️');
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.4; padding: 25mm 20mm; color: #000; }
            h1, h2, h3, h4 { margin: 0; text-align: center; }
            .header-table { width: 100%; margin-bottom: 20px; border: none; }
            .header-table td { vertical-align: top; border: none; padding: 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .italic { font-style: italic; }
            .dotted-line { border-bottom: 1px dotted #555; display: inline-block; min-width: 150px; }
            table.bordered { width: 100%; border-collapse: collapse; margin: 15px 0; }
            table.bordered th, table.bordered td { border: 1px solid #000; padding: 6px 8px; font-size: 11pt; }
            @media print {
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          ${html}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Helper to download as MS Word document (.doc)
  const downloadWordDoc = (html: string, filename: string) => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${filename}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.35; }
          .header-table { width: 100%; border: none; }
          .header-table td { border: none; vertical-align: top; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .italic { font-style: italic; }
          table.bordered { width: 100%; border-collapse: collapse; }
          table.bordered th, table.bordered td { border: 1px solid #000; padding: 6px; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast(`Đã xuất file Word: ${filename}`, '📥');
  };

  // Generate HTML for Biên bản vi phạm
  const getDisciplineHtml = () => {
    const studentName = selectedStudent?.name || 'Nguyễn Văn A';
    const studentStt = selectedStudent?.stt || 1;
    const reportNote = selectedReport?.customNote || selectedReport?.violationTags?.join(', ') || 'Vi phạm nội quy lớp học';
    const reportDate = selectedReport?.dateDisplay || `ngày ${day} tháng ${month} năm ${year}`;

    return `
      <table class="header-table">
        <tr>
          <td class="text-center" style="width: 45%;">
            <div style="font-size: 11pt;">TRƯỜNG ${config.schoolName ? config.schoolName.toUpperCase() : 'THPT CHU VĂN AN'}</div>
            <div class="bold" style="font-size: 11pt;">LỚP ${config.className || '11A1'}</div>
            <div style="font-size: 10pt;">Số: ....../BB-KL</div>
          </td>
          <td class="text-center" style="width: 55%;">
            <div class="bold" style="font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="bold" style="font-size: 11pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
            <div class="italic" style="font-size: 11pt; margin-top: 5px;">..., Ngày ${day} tháng ${month} năm ${year}</div>
          </td>
        </tr>
      </table>

      <h2 class="bold" style="font-size: 16pt; margin: 20px 0 5px 0;">BIÊN BẢN VI PHẠM KỶ LUẬT HỌC SINH</h2>
      <div class="italic text-center" style="margin-bottom: 20px;">(V/v: Vi phạm nội quy, quy chế nề nếp trường lớp)</div>

      <p>Hôm nay, vào hồi ...... giờ ......, ngày ${day} tháng ${month} năm ${year}, tại phòng học lớp ${config.className || '11A1'}.</p>
      
      <p class="bold">I. THÀNH PHẦN THAM DỰ:</p>
      <p>1. Giáo viên chủ nhiệm: <strong>${config.teacherName || '...................................................'}</strong></p>
      <p>2. Đại diện Ban cán sự lớp: <strong>${config.reporterName || '...................................................'}</strong> - Chức vụ: ${config.reporterRole || 'Lớp trưởng'}</p>
      <p>3. Học sinh vi phạm: <strong>${studentName}</strong> - STT: ${studentStt} - Lớp: ${config.className || '11A1'}</p>

      <p class="bold">II. NỘI DUNG SỰ VIỆC:</p>
      <p>Vào thời điểm: ${reportDate}.</p>
      <p>Học sinh <strong>${studentName}</strong> đã có hành vi vi phạm nội quy như sau:</p>
      <div style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #000; margin: 10px 0;">
        ${reportNote}
      </div>

      <p class="bold">III. Ý KIẾN TỰ KIỂM ĐIỂM CỦA HỌC SINH:</p>
      <p>Em <strong>${studentName}</strong> đã nhận thức được hành vi vi phạm của mình và cam kết:</p>
      <p>....................................................................................................................................................................</p>
      <p>....................................................................................................................................................................</p>

      <p class="bold">IV. KẾT LUẬN & HÌNH THỨC XỬ LÝ:</p>
      <p>1. Nhắc nhở trước tập thể lớp và ghi nhận trừ điểm rèn luyện theo quy định.</p>
      <p>2. Thông báo đến Phụ huynh học sinh để phối hợp giáo dục.</p>

      <table class="header-table" style="margin-top: 35px;">
        <tr>
          <td class="text-center" style="width: 33%;">
            <div class="bold">HỌC SINH VI PHẠM</div>
            <div class="italic">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div>${studentName}</div>
          </td>
          <td class="text-center" style="width: 33%;">
            <div class="bold">ĐẠI DIỆN BAN CÁN SỰ</div>
            <div class="italic">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div>${config.reporterName || '..............................'}</div>
          </td>
          <td class="text-center" style="width: 34%;">
            <div class="bold">GIÁO VIÊN CHỦ NHIỆM</div>
            <div class="italic">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div>${config.teacherName || '..............................'}</div>
          </td>
        </tr>
      </table>
    `;
  };

  // Generate HTML for Báo cáo tuần nộp BGH
  const getWeeklyReportHtml = () => {
    const totalReports = history.length;
    const absents = history.filter((h) => h.type === 'ABSENT');
    const violations = history.filter((h) => h.type === 'VIOLATION');
    const commendations = history.filter((h) => h.type === 'COMMENDATION');

    return `
      <table class="header-table">
        <tr>
          <td class="text-center" style="width: 45%;">
            <div style="font-size: 11pt;">TRƯỜNG ${config.schoolName ? config.schoolName.toUpperCase() : 'THPT CHU VĂN AN'}</div>
            <div class="bold" style="font-size: 11pt;">LỚP ${config.className || '11A1'}</div>
          </td>
          <td class="text-center" style="width: 55%;">
            <div class="bold" style="font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="bold" style="font-size: 11pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
            <div class="italic" style="font-size: 11pt; margin-top: 5px;">Ngày ${day} tháng ${month} năm ${year}</div>
          </td>
        </tr>
      </table>

      <h2 class="bold" style="font-size: 16pt; margin: 20px 0 5px 0;">BÁO CÁO TỔNG HỢP NỀ NẾP & KỶ LUẬT TUẦN</h2>
      <div class="italic text-center" style="margin-bottom: 20px;">Kính gửi: Ban Giám hiệu & Đoàn Thanh niên Nhà trường</div>

      <p>Lớp: <strong>${config.className || '11A1'}</strong> | Sĩ số: <strong>${config.students.length}</strong> học sinh.</p>
      <p>Giáo viên chủ nhiệm: <strong>${config.teacherName || 'Chưa đặt'}</strong> | Lớp trưởng: <strong>${config.reporterName || 'Chưa đặt'}</strong></p>

      <p class="bold">1. TÌNH HÌNH CHUYÊN CẦN:</p>
      <p>- Tổng số lượt vắng: <strong>${absents.length}</strong> lượt (Có phép: ${absents.filter((a) => a.absentType === 'EXCUSED').length}, Không phép: ${absents.filter((a) => a.absentType === 'UNEXCUSED').length}).</p>

      <p class="bold">2. TÌNH HÌNH KỶ LUẬT & NỀ NẾP:</p>
      <p>- Tổng số lượt ghi nhận vi phạm: <strong>${violations.length}</strong> lượt.</p>

      <table class="bordered">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 8%;">STT</th>
            <th style="width: 25%;">Họ và tên học sinh</th>
            <th style="width: 15%;">Thời gian</th>
            <th style="width: 32%;">Lỗi vi phạm</th>
            <th style="width: 20%;">Biện pháp đã xử lý</th>
          </tr>
        </thead>
        <tbody>
          ${violations.slice(0, 10).map((v, i) => `
            <tr>
              <td class="text-center">${i + 1}</td>
              <td>${v.students.map((s) => s.name).join(', ')}</td>
              <td class="text-center">${v.dateDisplay || v.date}</td>
              <td>${v.violationTags?.join(', ') || v.customNote || 'Vi phạm nội quy'}</td>
              <td>Nhắc nhở, trừ điểm thi đua</td>
            </tr>
          `).join('') || `<tr><td colspan="5" class="text-center italic">Không có vi phạm nghiêm trọng</td></tr>`}
        </tbody>
      </table>

      <p class="bold">3. TUYÊN DƯƠNG & KHEN THƯỞNG:</p>
      <p>- Tổng số lượt được khen thưởng: <strong>${commendations.length}</strong> lượt.</p>

      <table class="header-table" style="margin-top: 30px;">
        <tr>
          <td class="text-center" style="width: 50%;">
            <div class="bold">ĐẠI DIỆN BAN CÁN SỰ LỚP</div>
            <div style="height: 60px;"></div>
            <div>${config.reporterName || '..............................'}</div>
          </td>
          <td class="text-center" style="width: 50%;">
            <div class="bold">GIÁO VIÊN CHỦ NHIỆM</div>
            <div style="height: 60px;"></div>
            <div>${config.teacherName || '..............................'}</div>
          </td>
        </tr>
      </table>
    `;
  };

  // Generate HTML for Giấy mời phụ huynh
  const getParentInviteHtml = () => {
    const studentName = selectedStudent?.name || 'Nguyễn Văn A';
    return `
      <table class="header-table">
        <tr>
          <td class="text-center" style="width: 45%;">
            <div style="font-size: 11pt;">TRƯỜNG ${config.schoolName ? config.schoolName.toUpperCase() : 'THPT CHU VĂN AN'}</div>
            <div class="bold" style="font-size: 11pt;">LỚP ${config.className || '11A1'}</div>
          </td>
          <td class="text-center" style="width: 55%;">
            <div class="bold" style="font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="bold" style="font-size: 11pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
            <div class="italic" style="font-size: 11pt; margin-top: 5px;">Ngày ${day} tháng ${month} năm ${year}</div>
          </td>
        </tr>
      </table>

      <h2 class="bold" style="font-size: 16pt; margin: 25px 0 10px 0;">GIẤY MỜI HỌP PHỤ HUYNH HỌC SINH</h2>
      <div class="italic text-center" style="margin-bottom: 25px;">(V/v: Trao đổi về tình hình học tập và rèn luyện nề nếp của học sinh)</div>

      <p>Kính gửi: <strong>Quý Phụ huynh em: ${studentName}</strong></p>
      <p>Học sinh lớp: <strong>${config.className || '11A1'}</strong> - Trường: <strong>${config.schoolName || '...'}</strong></p>

      <p>Để tạo sự phối hợp chặt chẽ giữa Gia đình và Nhà trường trong việc giáo dục, rèn luyện nề nếp học sinh, Giáo viên chủ nhiệm trân trọng kính mời Quý phụ huynh đến trường tham dự buổi trao đổi công việc:</p>

      <p><strong>- Thời gian:</strong> ...... giờ ......, ngày ...... tháng ...... năm ${year}</p>
      <p><strong>- Địa điểm:</strong> Phòng học lớp ${config.className || '11A1'}, Trường ${config.schoolName || '...'}</p>
      <p><strong>- Nội dung:</strong> Thông báo và bàn biện pháp khắc phục tình hình vắng học / vi phạm nội quy của học sinh trong thời gian qua.</p>

      <p>Rất mong Quý Phụ huynh sắp xếp thời gian đến dự đúng giờ để việc giáo dục đạt hiệu quả cao nhất.</p>
      <p class="italic">Trân trọng cảm ơn sự phối hợp của Quý Phụ huynh!</p>

      <table class="header-table" style="margin-top: 40px;">
        <tr>
          <td style="width: 50%;"></td>
          <td class="text-center" style="width: 50%;">
            <div class="bold">GIÁO VIÊN CHỦ NHIỆM</div>
            <div class="italic">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div>${config.teacherName || 'Phạm Hậu'}</div>
            <div style="font-size: 10pt; color: #555;">SĐT Zalo: ${config.zaloPhone || '...'}</div>
          </td>
        </tr>
      </table>
    `;
  };

  // Slides Presentation Data
  const slides = [
    {
      title: `SINH HOẠT LỚP ${config.className || '11A1'}`,
      subtitle: `TỔNG KẾT NỀ NẾP & CHUYÊN CẦN TUẦN`,
      bg: 'from-blue-700 via-indigo-800 to-slate-900',
      content: (
        <div className="space-y-4 text-center">
          <div className="inline-block p-4 rounded-3xl bg-white/10 backdrop-blur border border-white/20 mb-2">
            <Presentation className="w-16 h-16 text-cyan-300 mx-auto" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {config.schoolName || 'TRƯỜNG THPT'} - LỚP {config.className || '11A1'}
          </h2>
          <p className="text-cyan-200 text-sm font-medium">
            GVCN: <strong>{config.teacherName || 'Phạm Hậu'}</strong> &bull; Lớp trưởng: {config.reporterName || 'Ban cán sự'}
          </p>
          <div className="pt-4 text-xs text-blue-200/80">
            Dữ liệu ghi nhận: {history.length} lượt &bull; Cập nhật ngày {todayStr}
          </div>
        </div>
      ),
    },
    {
      title: 'TÌNH HÌNH CHUYÊN CẦN',
      subtitle: 'Đánh giá tỷ lệ đi học & số lượt vắng trong tuần',
      bg: 'from-slate-900 via-indigo-950 to-blue-900',
      content: (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15">
            <span className="text-xs text-blue-200 font-bold block mb-1">Vắng có phép</span>
            <div className="text-3xl font-black text-emerald-400">
              {history.filter((h) => h.type === 'ABSENT' && h.absentType === 'EXCUSED').length}
            </div>
            <span className="text-[11px] text-slate-300">có đơn xin phép</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15">
            <span className="text-xs text-rose-300 font-bold block mb-1">Vắng không phép</span>
            <div className="text-3xl font-black text-rose-400">
              {history.filter((h) => h.type === 'ABSENT' && h.absentType === 'UNEXCUSED').length}
            </div>
            <span className="text-[11px] text-slate-300">cần báo phụ huynh</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/15 col-span-2">
            <span className="text-xs text-amber-300 font-bold block mb-1">Đánh giá chung về Chuyên cần:</span>
            <p className="text-xs text-white leading-relaxed">
              {history.filter((h) => h.type === 'ABSENT').length === 0
                ? '🎉 Xuất sắc! Toàn bộ lớp duy trì tỷ lệ đi học đầy đủ 100% không có học sinh nghỉ.'
                : 'Cần duy trì sĩ số ổn định, nghiêm cấm các trường hợp bỏ tiết hoặc nghỉ học không báo trước.'}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'KỶ LUẬT & NỀ NẾP LỚP HỌC',
      subtitle: 'Những tồn tại cần khắc phục ngay trong tuần tới',
      bg: 'from-amber-950 via-slate-900 to-indigo-950',
      content: (
        <div className="max-w-lg mx-auto text-left space-y-3">
          <div className="p-3.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-200 text-xs">
            ⚠️ Ghi nhận <strong>{history.filter((h) => h.type === 'VIOLATION').length}</strong> lượt vi phạm nề nếp cần chấn chỉnh.
          </div>
          <ul className="space-y-2 text-xs text-slate-200">
            <li className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Đồng phục, phù hiệu và tác phong trước khi vào cổng trường.</span>
            </li>
            <li className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Chuẩn bị bài cũ & làm bài tập về nhà trước giờ học.</span>
            </li>
            <li className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Tuyệt đối không sử dụng điện thoại và làm việc riêng trong tiết học.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: 'BẢNG VÀNG TUYÊN DƯƠNG',
      subtitle: 'Vinh danh những cá nhân tích cực & gương sáng trong tuần',
      bg: 'from-emerald-950 via-slate-900 to-teal-950',
      content: (
        <div className="max-w-md mx-auto text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto text-2xl shadow-lg">
            🏆
          </div>
          <h3 className="text-lg font-bold text-emerald-300">
            Gương Sáng Nề Nếp & Học Tập
          </h3>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Tuyên dương các học sinh hăng hái phát biểu xây dựng bài, đạt điểm tốt và tích cực tham gia trực nhật vệ sinh lớp sạch sẽ.
          </p>
          <div className="p-3 bg-white/10 rounded-xl border border-white/15 text-xs text-white font-semibold">
            ⭐ Lớp trưởng & GVCN tặng điểm rèn luyện tối đa cho các bạn tiêu biểu!
          </div>
        </div>
      ),
    },
    {
      title: 'MỤC TIÊU & KẾ HOẠCH TUẦN MỚI',
      subtitle: 'Quyết tâm thi đua đạt hạng Nhất toàn trường',
      bg: 'from-blue-950 via-indigo-900 to-purple-950',
      content: (
        <div className="max-w-lg mx-auto text-left space-y-3">
          <div className="p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20 space-y-2.5">
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">1</span>
              <span>100% học sinh đi học đúng giờ, không có hiện tượng vắng không phép.</span>
            </div>
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">2</span>
              <span>100% thuộc bài và làm bài tập về nhà đầy đủ.</span>
            </div>
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Giữ gìn vệ sinh lớp học sáng - xanh - sạch - đẹp.</span>
            </div>
          </div>
          <div className="text-center pt-2 text-cyan-300 font-bold text-sm">
            🚀 CHÚC TẬP THỂ LỚP {config.className || '11A1'} MỘT TUẦN HỌC MỚI THÀNH CÔNG!
          </div>
        </div>
      ),
    },
  ];

  const handleDownloadCurrentDoc = () => {
    if (docType === 'discipline') {
      downloadWordDoc(getDisciplineHtml(), `BienBan_KyLuat_${selectedStudent?.name || 'HocSinh'}.doc`);
    } else if (docType === 'weekly_report') {
      downloadWordDoc(getWeeklyReportHtml(), `BaoCao_NeNep_Tuan_${config.className || 'Lop'}.doc`);
    } else if (docType === 'parent_invite') {
      downloadWordDoc(getParentInviteHtml(), `GiayMoi_PhuHuynh_${selectedStudent?.name || 'HocSinh'}.doc`);
    }
  };

  const handlePrintCurrentDoc = () => {
    if (docType === 'discipline') {
      printHtmlContent(getDisciplineHtml(), 'Bien_Ban_Ky_Luat_Hoc_Sinh');
    } else if (docType === 'weekly_report') {
      printHtmlContent(getWeeklyReportHtml(), 'Bao_Cao_Ne_Nep_Tuan');
    } else if (docType === 'parent_invite') {
      printHtmlContent(getParentInviteHtml(), 'Giay_Moi_Phu_Huynh');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
              <FileText className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Mẫu Biểu Hành Chính & Slide Sinh Hoạt Lớp
              </h3>
              <p className="text-xs text-emerald-100">
                Xuất file Word (.doc) in ấn theo mẫu Bộ GD&ĐT & Trình chiếu slide tiết sinh hoạt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setDocType('discipline')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              docType === 'discipline'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Biên bản vi phạm kỷ luật</span>
          </button>

          <button
            onClick={() => setDocType('weekly_report')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              docType === 'weekly_report'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>2. Báo cáo tuần nộp BGH</span>
          </button>

          <button
            onClick={() => setDocType('parent_invite')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              docType === 'parent_invite'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>3. Giấy mời phụ huynh</span>
          </button>

          <button
            onClick={() => setDocType('slides')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              docType === 'slides'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Presentation className="w-4 h-4 text-indigo-600" />
            <span>4. Slide Sinh hoạt lớp (Chiếu máy chiếu)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* Controls for Student-specific documents */}
          {(docType === 'discipline' || docType === 'parent_invite') && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Chọn học sinh:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  {config.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.stt}. {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCurrentDoc}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintCurrentDoc}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xem in / In ra giấy</span>
                </button>
              </div>
            </div>
          )}

          {/* Controls for Weekly report */}
          {docType === 'weekly_report' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Báo cáo tổng hợp tự động từ {history.length} lượt ghi nhận nề nếp
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCurrentDoc}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file Word (.doc)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintCurrentDoc}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xem in / In ra giấy</span>
                </button>
              </div>
            </div>
          )}

          {/* PREVIEW CONTAINER FOR DOCUMENTS */}
          {docType !== 'slides' && (
            <div className="p-6 sm:p-8 bg-white border border-slate-300 rounded-2xl shadow-inner font-serif text-slate-900 leading-relaxed max-h-[460px] overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    docType === 'discipline'
                      ? getDisciplineHtml()
                      : docType === 'weekly_report'
                      ? getWeeklyReportHtml()
                      : getParentInviteHtml(),
                }}
              />
            </div>
          )}

          {/* SLIDE PRESENTATION VIEW */}
          {docType === 'slides' && (
            <div className="space-y-4">
              {/* Slide Screen Frame */}
              <div
                className={`w-full rounded-2xl p-6 sm:p-10 shadow-2xl flex flex-col justify-between min-h-[340px] text-white bg-gradient-to-br ${slides[slideIndex].bg} transition-all duration-300`}
              >
                {/* Slide Top Bar */}
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div>
                    <span className="text-[10px] tracking-widest uppercase font-bold text-cyan-300 block">
                      {slides[slideIndex].subtitle}
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white">
                      {slides[slideIndex].title}
                    </h2>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20">
                    Trang {slideIndex + 1} / {slides.length}
                  </span>
                </div>

                {/* Slide Content */}
                <div className="py-6 flex-1 flex items-center justify-center">
                  {slides[slideIndex].content}
                </div>

                {/* Slide Bottom Bar */}
                <div className="border-t border-white/15 pt-3 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Trường {config.schoolName || 'THPT'} &bull; Lớp {config.className}</span>
                  <span>GVCN: {config.teacherName || 'Phạm Hậu'}</span>
                </div>
              </div>

              {/* Slide Navigation Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  disabled={slideIndex === 0}
                  onClick={() => setSlideIndex((prev) => Math.max(prev - 1, 0))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trang trước</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIndex(i)}
                      className={`w-3 h-3 rounded-full transition cursor-pointer ${
                        slideIndex === i ? 'bg-indigo-600 scale-125' : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  disabled={slideIndex === slides.length - 1}
                  onClick={() => setSlideIndex((prev) => Math.min(prev + 1, slides.length - 1))}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
                >
                  <span>Trang tiếp</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
