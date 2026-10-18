import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  School,
  UserCheck,
  Phone,
  User,
  Users,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  FileText,
  List,
  Upload,
  Download,
  Database,
  FileSpreadsheet,
} from 'lucide-react';
import { ClassConfig, Student, ReportItem } from '../types';
import { INITIAL_STUDENTS, DEFAULT_CONFIG } from '../data/defaultData';
import { cleanPhoneNumber } from '../utils/zaloHelper';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  onSaveConfig: (newConfig: ClassConfig) => void;
  history?: ReportItem[];
  onRestoreBackup?: (backupConfig: ClassConfig, backupHistory?: ReportItem[]) => void;
  onShowToast?: (msg: string, icon?: string) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  history = [],
  onRestoreBackup,
  onShowToast,
}) => {
  const [schoolName, setSchoolName] = useState(config.schoolName);
  const [className, setClassName] = useState(config.className);
  const [teacherName, setTeacherName] = useState(config.teacherName);
  const [zaloPhone, setZaloPhone] = useState(config.zaloPhone);
  const [reporterName, setReporterName] = useState(config.reporterName);
  const [reporterRole, setReporterRole] = useState(config.reporterRole);

  const [activeRosterTab, setActiveRosterTab] = useState<'bulk' | 'list'>('bulk');
  const [bulkText, setBulkText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [editableStudents, setEditableStudents] = useState<Student[]>(config.students);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonBackupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSchoolName(config.schoolName);
      setClassName(config.className);
      setTeacherName(config.teacherName);
      setZaloPhone(config.zaloPhone);
      setReporterName(config.reporterName);
      setReporterRole(config.reporterRole);
      setEditableStudents(config.students);
      setBulkText(config.students.map((s) => `${s.stt}. ${s.name}`).join('\n'));
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleParseBulkText = () => {
    const lines = bulkText.split('\n');
    const parsed: Student[] = [];
    lines.forEach((line) => {
      let clean = line.trim();
      if (!clean) return;
      // strip preceding numbers like "1. ", "1/ ", "1- ", "01. "
      clean = clean.replace(/^\d+[\.\-\/\:\)\s,;]+\s*/, '').trim();
      if (clean) {
        parsed.push({
          id: `std-${parsed.length + 1}-${Date.now()}`,
          stt: parsed.length + 1,
          name: clean,
        });
      }
    });
    return parsed;
  };

  const handleLoadSampleRoster = () => {
    setBulkText(INITIAL_STUDENTS.map((s) => `${s.stt}. ${s.name}`).join('\n'));
    setEditableStudents(INITIAL_STUDENTS);
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) return;
    const nextStt = editableStudents.length + 1;
    const updated = [
      ...editableStudents,
      {
        id: `std-${nextStt}-${Date.now()}`,
        stt: nextStt,
        name,
      },
    ];
    setEditableStudents(updated);
    setBulkText(updated.map((s) => `${s.stt}. ${s.name}`).join('\n'));
    setNewStudentName('');
  };

  const handleDeleteStudent = (index: number) => {
    const updated = editableStudents
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, stt: idx + 1 }));
    setEditableStudents(updated);
    setBulkText(updated.map((s) => `${s.stt}. ${s.name}`).join('\n'));
  };

  // Import from CSV or Text file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const parsed: Student[] = [];

      lines.forEach((line) => {
        let clean = line.trim();
        if (!clean) return;
        // Check if comma or tab separated (e.g. "1,Nguyen Van A" or "1\tNguyen Van A")
        const parts = clean.split(/[,\t;]/).map((p) => p.trim()).filter(Boolean);
        let name = clean;
        if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
          name = parts.slice(1).join(' ');
        } else {
          name = clean.replace(/^\d+[\.\-\/\:\)\s,;]+\s*/, '').trim();
        }

        // skip header like "Họ và tên", "STT"
        if (/^(stt|ho va ten|họ và tên|name|tên|học sinh)$/i.test(name)) return;

        if (name) {
          parsed.push({
            id: `std-${parsed.length + 1}-${Date.now()}`,
            stt: parsed.length + 1,
            name,
          });
        }
      });

      if (parsed.length > 0) {
        setEditableStudents(parsed);
        setBulkText(parsed.map((s) => `${s.stt}. ${s.name}`).join('\n'));
        if (onShowToast) onShowToast(`Đã nhập ${parsed.length} học sinh từ file!`, '📥');
      } else {
        if (onShowToast) onShowToast('Không tìm thấy danh sách hợp lệ trong file.', '⚠️');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Export Roster to CSV
  const handleExportRosterCsv = () => {
    const studentsToExport = editableStudents.length > 0 ? editableStudents : handleParseBulkText();
    if (studentsToExport.length === 0) {
      if (onShowToast) onShowToast('Chưa có học sinh nào để xuất!', '⚠️');
      return;
    }

    const csvContent =
      '\ufeffSTT,Họ và tên,Lớp,Trường\n' +
      studentsToExport
        .map((s) => `${s.stt},"${s.name}","${className}","${schoolName}"`)
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DanhSach_Lop_${className || 'HocSinh'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Đã tải file CSV danh sách học sinh!', '📥');
  };

  // Backup Full Data (Config + History) to JSON
  const handleBackupFullData = () => {
    const backupObj = {
      version: '1.0',
      timestamp: Date.now(),
      dateStr: new Date().toISOString(),
      config: {
        schoolName: schoolName.trim(),
        className: className.trim(),
        teacherName: teacherName.trim(),
        zaloPhone: cleanPhoneNumber(zaloPhone.trim()),
        reporterName: reporterName.trim(),
        reporterRole: reporterRole.trim(),
        students: editableStudents.length > 0 ? editableStudents : handleParseBulkText(),
      },
      history,
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_NeNep_${className || 'Lop'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Đã tải file sao lưu toàn bộ dữ liệu (.json)!', '💾');
  };

  // Restore Full Data from JSON
  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (data && data.config) {
          setSchoolName(data.config.schoolName || '');
          setClassName(data.config.className || '');
          setTeacherName(data.config.teacherName || '');
          setZaloPhone(data.config.zaloPhone || '');
          setReporterName(data.config.reporterName || '');
          setReporterRole(data.config.reporterRole || '');

          if (Array.isArray(data.config.students)) {
            setEditableStudents(data.config.students);
            setBulkText(data.config.students.map((s: any) => `${s.stt}. ${s.name}`).join('\n'));
          }

          if (onRestoreBackup) {
            onRestoreBackup(data.config, Array.isArray(data.history) ? data.history : undefined);
          }
          if (onShowToast) onShowToast('Khôi phục dữ liệu từ file sao lưu thành công!', '🎉');
        } else {
          if (onShowToast) onShowToast('File sao lưu không đúng định dạng.', '❌');
        }
      } catch (err) {
        if (onShowToast) onShowToast('Lỗi khi đọc file sao lưu JSON.', '❌');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleSave = () => {
    let finalStudents = editableStudents;
    if (activeRosterTab === 'bulk') {
      const parsed = handleParseBulkText();
      if (parsed.length > 0) {
        finalStudents = parsed;
      }
    }

    const newConfig: ClassConfig = {
      schoolName: schoolName.trim(),
      className: className.trim(),
      teacherName: teacherName.trim(),
      zaloPhone: cleanPhoneNumber(zaloPhone.trim()),
      reporterName: reporterName.trim(),
      reporterRole: reporterRole.trim(),
      students: finalStudents,
    };

    onSaveConfig(newConfig);
    onClose();
  };

  const handleResetToDefault = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại thông tin mẫu ban đầu?')) {
      setSchoolName(DEFAULT_CONFIG.schoolName);
      setClassName(DEFAULT_CONFIG.className);
      setTeacherName(DEFAULT_CONFIG.teacherName);
      setZaloPhone(DEFAULT_CONFIG.zaloPhone);
      setReporterName(DEFAULT_CONFIG.reporterName);
      setReporterRole(DEFAULT_CONFIG.reporterRole);
      setEditableStudents(INITIAL_STUDENTS);
      setBulkText(INITIAL_STUDENTS.map((s) => `${s.stt}. ${s.name}`).join('\n'));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-blue-200" />
            <div>
              <h3 className="font-bold text-base">Cấu Hình Lớp & Danh Sách Học Sinh</h3>
              <p className="text-xs text-blue-100">
                Lưu trữ thông tin lớp, số điện thoại Zalo của GVCN và sao lưu dữ liệu
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-blue-600" />
                1. Thông tin trường & Giáo viên chủ nhiệm
              </h4>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-slate-400 hover:text-blue-600 text-xs flex items-center gap-1 transition cursor-pointer"
                title="Khôi phục thông tin mẫu mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                Khôi phục mẫu
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Tên trường học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ví dụ: THPT Chu Văn An"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 11A1"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Họ tên GVCN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ví dụ: Thầy Phạm Hậu / Cô Lê Hoàng Yến"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Số điện thoại Zalo của GVCN <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={zaloPhone}
                    onChange={(e) => setZaloPhone(e.target.value)}
                    placeholder="0988123456"
                    className="w-full text-xs px-3 py-2 pl-8 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tin nhắn báo cáo sẽ mở trực tiếp cuộc trò chuyện Zalo với số này.
                </p>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Người lập báo cáo (Ban cán sự)
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Tuấn"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Chức vụ người báo cáo
                </label>
                <input
                  type="text"
                  value={reporterRole}
                  onChange={(e) => setReporterRole(e.target.value)}
                  placeholder="Ví dụ: Lớp trưởng / Lớp phó học tập"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Section 2: Student Roster Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                2. Danh sách học sinh ({editableStudents.length} bạn)
              </h4>

              {/* Import/Export buttons */}
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title="Nhập danh sách học sinh từ file CSV hoặc Excel"
                >
                  <Upload className="w-3 h-3" />
                  <span>Nhập CSV/Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportRosterCsv}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  title="Tải danh sách học sinh ra file CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>Xuất CSV</span>
                </button>
              </div>
            </div>

            {/* Toggle tabs */}
            <div className="flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveRosterTab('bulk')}
                className={`pb-2 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer transition ${
                  activeRosterTab === 'bulk'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Nhập nhanh nhiều dòng
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = handleParseBulkText();
                  if (parsed.length > 0) setEditableStudents(parsed);
                  setActiveRosterTab('list');
                }}
                className={`pb-2 px-1 text-xs font-semibold flex items-center gap-1.5 border-b-2 cursor-pointer transition ${
                  activeRosterTab === 'list'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Quản lý chi tiết từng bạn
              </button>
            </div>

            {activeRosterTab === 'bulk' ? (
              <div className="space-y-1.5">
                <textarea
                  rows={7}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Dán danh sách học sinh vào đây, mỗi dòng một bạn (có thể kèm STT ở đầu như 1. Nguyễn Văn A)..."
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Hệ thống tự động lọc số thứ tự và gán STT chuẩn xác.</span>
                  <button
                    type="button"
                    onClick={handleLoadSampleRoster}
                    className="text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Dán lại 35 học sinh mẫu
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <form onSubmit={handleAddSingleStudent} className="flex gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Nhập họ và tên học sinh mới..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </form>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {editableStudents.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Chưa có học sinh nào trong danh sách.
                    </div>
                  ) : (
                    editableStudents.map((s, index) => (
                      <div
                        key={s.id || index}
                        className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-center font-mono text-slate-400 font-semibold">
                            #{index + 1}
                          </span>
                          <span className="font-medium text-slate-800">{s.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(index)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                          title="Xóa học sinh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Section 3: Backup & Restore JSON */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              3. Sao lưu & Phục hồi toàn bộ dữ liệu (Chống mất dữ liệu)
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Tải toàn bộ cấu hình lớp cùng toàn bộ lịch sử báo cáo ra file sao lưu (.json) để cất giữ an toàn hoặc chuyển sang dùng trên máy tính/điện thoại khác.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleBackupFullData}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sao lưu toàn bộ (.json)</span>
              </button>

              <input
                type="file"
                ref={jsonBackupInputRef}
                onChange={handleRestoreBackupFile}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jsonBackupInputRef.current?.click()}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Khôi phục từ file (.json)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {editableStudents.length > 0
              ? `Tổng cộng: ${editableStudents.length} học sinh`
              : 'Chưa có học sinh'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
