import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  UserX,
  AlertTriangle,
  Award,
  Search,
  Check,
  X,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import {
  ClassConfig,
  ReportType,
  AbsentType,
  Student,
} from '../types';
import {
  COMMON_VIOLATIONS,
  COMMON_COMMENDATIONS,
  PERIOD_OPTIONS,
  POPULAR_SUBJECTS,
} from '../data/defaultData';
import { removeVietnameseTones } from '../utils/zaloHelper';

interface ReportFormProps {
  config: ClassConfig;
  dateStr: string;
  setDateStr: (val: string) => void;
  period: string;
  setPeriod: (val: string) => void;
  subject: string;
  setSubject: (val: string) => void;
  reportType: ReportType;
  setReportType: (val: ReportType) => void;
  absentType: AbsentType;
  setAbsentType: (val: AbsentType) => void;
  violationTags: string[];
  setViolationTags: (val: string[]) => void;
  commendationTags: string[];
  setCommendationTags: (val: string[]) => void;
  customNote: string;
  setCustomNote: (val: string) => void;
  selectedStudents: Student[];
  setSelectedStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onOpenConfig: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  config,
  dateStr,
  setDateStr,
  period,
  setPeriod,
  subject,
  setSubject,
  reportType,
  setReportType,
  absentType,
  setAbsentType,
  violationTags,
  setViolationTags,
  commendationTags,
  setCommendationTags,
  customNote,
  setCustomNote,
  selectedStudents,
  setSelectedStudents,
  onOpenConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    const q = removeVietnameseTones(searchQuery.trim());
    if (!q) return config.students;
    return config.students.filter((s) => {
      const nameClean = removeVietnameseTones(s.name);
      const sttStr = String(s.stt);
      return nameClean.includes(q) || sttStr.includes(q);
    });
  }, [config.students, searchQuery]);

  const isStudentSelected = (studentId: string) => {
    return selectedStudents.some((s) => s.id === studentId);
  };

  const toggleStudent = (student: Student) => {
    if (isStudentSelected(student.id)) {
      setSelectedStudents((prev) => prev.filter((s) => s.id !== student.id));
    } else {
      setSelectedStudents((prev) => [...prev, student]);
    }
  };

  const removeSelectedStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const selectAllFiltered = () => {
    const newStudents = [...selectedStudents];
    filteredStudents.forEach((student) => {
      if (!newStudents.some((s) => s.id === student.id)) {
        newStudents.push(student);
      }
    });
    setSelectedStudents(newStudents);
  };

  const clearSelectedStudents = () => {
    setSelectedStudents([]);
  };

  const toggleViolationTag = (tag: string) => {
    if (violationTags.includes(tag)) {
      setViolationTags(violationTags.filter((t) => t !== tag));
    } else {
      setViolationTags([...violationTags, tag]);
    }
  };

  const toggleCommendationTag = (tag: string) => {
    if (commendationTags.includes(tag)) {
      setCommendationTags(commendationTags.filter((t) => t !== tag));
    } else {
      setCommendationTags([...commendationTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = customTagInput.trim();
    if (!tag) return;
    if (reportType === 'VIOLATION' && !violationTags.includes(tag)) {
      setViolationTags([...violationTags, tag]);
    } else if (reportType === 'COMMENDATION' && !commendationTags.includes(tag)) {
      setCommendationTags([...commendationTags, tag]);
    }
    setCustomTagInput('');
  };

  return (
    <div className="space-y-5">
      {/* 1. THỜI GIAN VÀ TIẾT HỌC */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-blue-600"></span>
            1. Thời gian & Tiết học
          </h2>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              setDateStr(`${yyyy}-${mm}-${dd}`);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            Hôm nay
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Ngày ghi nhận
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Tiết học / Buổi
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white cursor-pointer"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Môn học (Tùy chọn)
              </label>
              {subject && (
                <button
                  type="button"
                  onClick={() => setSubject('')}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Chọn môn hoặc gõ..."
                list="popular-subjects"
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              />
              <datalist id="popular-subjects">
                {POPULAR_SUBJECTS.map((subj) => (
                  <option key={subj} value={subj} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Quick subject chips */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-slate-500 font-semibold mr-1">Môn học nhanh:</span>
          {POPULAR_SUBJECTS.map((subj) => {
            const isSelected = subject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => setSubject(isSelected ? '' : subj)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {subj}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. LOẠI BÁO CÁO & LÝ DO */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-blue-600"></span>
            2. Phân loại báo cáo
          </h2>
          <span className="text-xs text-slate-500">Chọn 1 phân loại phù hợp</span>
        </div>

        {/* Segmented Control */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setReportType('ABSENT')}
            className={`py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border transition-all cursor-pointer ${
              reportType === 'ABSENT'
                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm ring-1 ring-rose-400'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-600" />
            <span>Vắng học</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('VIOLATION')}
            className={`py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border transition-all cursor-pointer ${
              reportType === 'VIOLATION'
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm ring-1 ring-amber-400'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Vi phạm nội quy</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('COMMENDATION')}
            className={`py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border transition-all cursor-pointer ${
              reportType === 'COMMENDATION'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm ring-1 ring-emerald-400'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Khen thưởng</span>
          </button>
        </div>

        {/* 2A: VẮNG HỌC OPTIONS */}
        {reportType === 'ABSENT' && (
          <div className="space-y-2 bg-rose-50/40 p-3.5 rounded-xl border border-rose-100">
            <label className="block text-xs font-semibold text-rose-900 mb-1.5">
              Chọn lý do vắng cụ thể:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAbsentType('EXCUSED')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  absentType === 'EXCUSED'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🟢 Vắng CÓ PHÉP
              </button>

              <button
                type="button"
                onClick={() => setAbsentType('UNEXCUSED')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  absentType === 'UNEXCUSED'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🔴 Vắng KHÔNG PHÉP
              </button>

              <button
                type="button"
                onClick={() => setAbsentType('LATE')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  absentType === 'LATE'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ⏱️ Đi học muộn (&gt; 15p)
              </button>

              <button
                type="button"
                onClick={() => setAbsentType('TRUANT')}
                className={`p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  absentType === 'TRUANT'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🏃 Bỏ tiết / Trốn học
              </button>
            </div>
          </div>
        )}

        {/* 2B: VI PHẠM NỘI QUY CHIPS */}
        {reportType === 'VIOLATION' && (
          <div className="space-y-3 bg-amber-50/40 p-3.5 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-amber-900">
                Nút chọn nhanh lỗi thường gặp (chạm để chọn nhiều):
              </label>
              {violationTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViolationTags([])}
                  className="text-xs text-amber-700 hover:underline font-semibold cursor-pointer"
                >
                  Bỏ chọn hết ({violationTags.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_VIOLATIONS.map((tag) => {
                const isSelected = violationTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleViolationTag(tag)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2C: KHEN THƯỞNG CHIPS */}
        {reportType === 'COMMENDATION' && (
          <div className="space-y-3 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-emerald-900">
                Chọn điểm tốt / thành tích:
              </label>
              {commendationTags.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCommendationTags([])}
                  className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
                >
                  Bỏ chọn hết ({commendationTags.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_COMMENDATIONS.map((tag) => {
                const isSelected = commendationTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleCommendationTag(tag)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    {isSelected ? '★ ' : ''}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GHI CHÚ BỔ SUNG */}
        <div className="mt-3.5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Ghi chú cụ thể / Lỗi chi tiết khác (tùy chọn):
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Ví dụ: Kiểm tra 15 phút bài trống, ngồi bàn cuối không tập trung..."
            className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </section>

      {/* 3. CHỌN HỌC SINH */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-4 rounded-full bg-blue-600"></span>
            3. Chọn học sinh
            <span className="text-xs font-normal text-slate-500">
              (Đã chọn:{' '}
              <strong className="text-blue-600 font-bold">{selectedStudents.length}</strong> /{' '}
              {config.students.length})
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Chọn tất cả
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={clearSelectedStudents}
              className="text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        {/* Selected Pills Tray */}
        <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2 bg-slate-50/80 rounded-xl border border-slate-200/80 mb-3 items-center">
          {selectedStudents.length === 0 ? (
            <span className="text-xs text-slate-400 italic px-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Chưa chọn học sinh nào bên dưới (Bấm vào tên học sinh để chọn)...
            </span>
          ) : (
            selectedStudents.map((student) => (
              <span
                key={student.id}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-200 shadow-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <span>
                  {student.name}{' '}
                  <span className="text-[10px] text-blue-700 font-mono font-normal">
                    (#{student.stt})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeSelectedStudent(student.id)}
                  className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center text-blue-700 hover:text-rose-700 transition cursor-pointer"
                  title="Bỏ chọn"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-2.5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhanh theo Tên hoặc Số thứ tự (ví dụ: '15' hoặc 'Minh')..."
            className="w-full text-sm pl-9 pr-8 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Student Grid / List */}
        <div className="max-h-56 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 border border-slate-200/80 rounded-xl bg-slate-50/50">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-400">
              Không tìm thấy học sinh nào khớp với từ khóa "{searchQuery}".
            </div>
          ) : (
            filteredStudents.map((student) => {
              const selected = isStudentSelected(student.id);
              return (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student)}
                  className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none transition-all ${
                    selected
                      ? 'bg-blue-50/90 border-blue-400 text-blue-900 font-bold shadow-xs'
                      : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono w-5 shrink-0">
                    #{student.stt}
                  </span>
                  <span className="text-xs truncate" title={student.name}>
                    {student.name}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {config.students.length === 0 && (
          <div className="mt-2 text-center p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            Chưa có danh sách học sinh.{' '}
            <button
              onClick={onOpenConfig}
              className="font-bold underline text-amber-900 hover:text-blue-700"
            >
              Bấm vào đây để nhập danh sách lớp
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
