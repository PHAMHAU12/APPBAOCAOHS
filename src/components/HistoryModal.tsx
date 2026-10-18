import React, { useState } from 'react';
import {
  X,
  History,
  Copy,
  Trash2,
  Send,
  Calendar,
  AlertTriangle,
  UserX,
  Award,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { ReportItem, ClassConfig } from '../types';
import { getZaloLink } from '../utils/zaloHelper';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ReportItem[];
  config: ClassConfig;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  config,
  onClearHistory,
  onDeleteHistoryItem,
  onShowToast,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filtered = history.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const handleCopyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg).then(() => {
      onShowToast('Đã sao chép nội dung báo cáo!', '📋');
    });
  };

  const handleSendToZalo = (msg: string) => {
    navigator.clipboard.writeText(msg).catch(() => {});
    const link = getZaloLink(config.zaloPhone);
    window.open(link, '_blank');
    onShowToast('Đang mở Zalo với GVCN...', '🚀');
  };

  // Generate a master daily summary of all items in history
  const handleGenerateDailySummary = () => {
    if (history.length === 0) {
      onShowToast('Chưa có báo cáo nào để tổng hợp!', '⚠️');
      return;
    }

    const todayDate = new Date().toLocaleDateString('vi-VN');
    const absentItems = history.filter((h) => h.type === 'ABSENT');
    const violationItems = history.filter((h) => h.type === 'VIOLATION');
    const commendationItems = history.filter((h) => h.type === 'COMMENDATION');

    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📊 TỔNG HỢP NỀ NẾP & CHUYÊN CẦN NGÀY ${todayDate}`,
      `🏫 Trường: ${config.schoolName || '...'} | Lớp: ${config.className || '...'}`,
      `👤 Người tổng hợp: ${config.reporterName || 'Ban cán sự'} (${config.reporterRole || 'Lớp'})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Kính gửi Thầy/Cô GVCN: ${config.teacherName || 'GVCN'}`,
      ``,
    ];

    // Absent section
    lines.push(`🔴 1. TÌNH HÌNH CHUYÊN CẦN (VẮNG HỌC):`);
    if (absentItems.length === 0) {
      lines.push(`  • Lớp đi học đầy đủ 100%, không có học sinh vắng.`);
    } else {
      absentItems.forEach((item, idx) => {
        const studentNames = item.students.map((s) => `${s.name} (#${s.stt})`).join(', ');
        lines.push(`  • [${item.period}] ${item.absentType === 'EXCUSED' ? 'Có phép' : 'Không phép'}: ${studentNames}`);
        if (item.customNote) lines.push(`    Ghi chú: ${item.customNote}`);
      });
    }

    lines.push(``);

    // Violation section
    lines.push(`⚠️ 2. TÌNH HÌNH NỀ NẾP & KỶ LUẬT:`);
    if (violationItems.length === 0) {
      lines.push(`  • Nề nếp tốt, không có học sinh vi phạm kỷ luật.`);
    } else {
      violationItems.forEach((item, idx) => {
        const studentNames = item.students.map((s) => `${s.name} (#${s.stt})`).join(', ');
        const tags = item.violationTags.join('; ');
        lines.push(`  • [${item.period}${item.subject ? ' - Môn ' + item.subject : ''}] Học sinh: ${studentNames}`);
        if (tags) lines.push(`    Lỗi: ${tags}`);
        if (item.customNote) lines.push(`    Chi tiết: ${item.customNote}`);
      });
    }

    if (commendationItems.length > 0) {
      lines.push(``);
      lines.push(`🌟 3. TUYÊN DƯƠNG & ĐIỂM CỘNG:`);
      commendationItems.forEach((item) => {
        const studentNames = item.students.map((s) => `${s.name} (#${s.stt})`).join(', ');
        lines.push(`  • [${item.period}] ${studentNames}: ${item.commendationTags.join('; ')}`);
      });
    }

    const summaryText = lines.join('\n');
    navigator.clipboard.writeText(summaryText).then(() => {
      onShowToast('Đã tạo & sao chép Báo cáo tổng hợp ngày vào Clipboard!', '📊');
    });
  };

  const handleExportCsv = () => {
    if (history.length === 0) {
      onShowToast('Chưa có lịch sử nào để xuất!', '⚠️');
      return;
    }
    const header = '\ufeffThời gian,Tiết,Môn học,Loại báo cáo,Chi tiết/Lỗi,Học sinh,Người báo cáo\n';
    const rows = history
      .map((item) => {
        const typeStr =
          item.type === 'ABSENT'
            ? `Vắng (${item.absentType === 'EXCUSED' ? 'Có phép' : 'Không phép'})`
            : item.type === 'VIOLATION'
            ? 'Vi phạm'
            : 'Tuyên dương';
        const details = (
          item.violationTags?.join('; ') ||
          item.commendationTags?.join('; ') ||
          item.customNote ||
          ''
        ).replace(/"/g, '""');
        const students = item.students
          .map((s) => `${s.name} (#${s.stt})`)
          .join('; ')
          .replace(/"/g, '""');
        return `"${item.dateDisplay || item.date}","${item.period}","${
          item.subject || ''
        }","${typeStr}","${details}","${students}","${item.reporter || ''}"`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LichSu_NeNep_${config.className || 'Lop'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast('Đã tải file CSV lịch sử nề nếp!', '📥');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base">Nhật ký các lượt báo cáo đã lưu</h3>
              <p className="text-xs text-slate-300">
                Lưu giữ tạm thời trong phiên làm việc để theo dõi và tổng hợp
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

        {/* Filters and Tools Bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Lọc theo:</span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Tất cả ({history.length})
            </button>
            <button
              onClick={() => setFilterType('ABSENT')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                filterType === 'ABSENT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Vắng học
            </button>
            <button
              onClick={() => setFilterType('VIOLATION')}
              className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer ${
                filterType === 'VIOLATION'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Vi phạm
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold shadow-xs cursor-pointer transition active:scale-95"
              title="Xuất danh sách lịch sử ra file CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel/CSV</span>
            </button>

            <button
              type="button"
              onClick={handleGenerateDailySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition active:scale-95"
              title="Tổng hợp toàn bộ các lượt báo cáo trong ngày thành 1 văn bản gửi GVCN"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tổng hợp báo cáo cả ngày</span>
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Chưa có lượt báo cáo nào được lưu.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2.5 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {item.type === 'ABSENT' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <UserX className="w-3 h-3" />
                        Vắng: {item.absentType === 'EXCUSED' ? 'Có phép' : 'Không phép'}
                      </span>
                    ) : item.type === 'VIOLATION' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        Vi phạm nội quy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Award className="w-3 h-3" />
                        Khen thưởng
                      </span>
                    )}

                    <span className="font-bold text-slate-700">
                      {item.period} {item.subject ? `(Môn ${item.subject})` : ''} - {item.dateDisplay}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Students list */}
                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-500">
                    Học sinh ({item.students.length}):{' '}
                  </span>
                  <span className="font-medium">
                    {item.students.map((s) => `${s.name} (#${s.stt})`).join(', ')}
                  </span>
                </div>

                {/* Details */}
                {(item.violationTags.length > 0 || item.customNote) && (
                  <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                    {item.violationTags.length > 0 && (
                      <div className="font-medium text-amber-900">
                        • {item.violationTags.join('; ')}
                      </div>
                    )}
                    {item.customNote && (
                      <div className="text-slate-500 italic">• Ghi chú: {item.customNote}</div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(item.formattedMessage)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Sao chép lại
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleSendToZalo(item.formattedMessage)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      Gửi lại qua Zalo
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                    title="Xóa lượt báo cáo này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClearHistory}
            className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
          >
            Xóa toàn bộ lịch sử
          </button>
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
