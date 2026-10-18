import React, { useMemo } from 'react';
import {
  X,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  UserX,
  Calendar,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { ClassConfig, ReportItem } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
}) => {
  if (!isOpen) return null;

  // Compute stats
  const stats = useMemo(() => {
    const totalReports = history.length;
    const absents = history.filter((h) => h.type === 'ABSENT');
    const violations = history.filter((h) => h.type === 'VIOLATION');
    const commendations = history.filter((h) => h.type === 'COMMENDATION');

    // Absent breakdown
    const excused = absents.filter((h) => h.absentType === 'EXCUSED').length;
    const unexcused = absents.filter((h) => h.absentType === 'UNEXCUSED').length;
    const late = absents.filter((h) => h.absentType === 'LATE').length;
    const truant = absents.filter((h) => h.absentType === 'TRUANT').length;

    // Top violations
    const violationMap: { [key: string]: number } = {};
    violations.forEach((v) => {
      v.violationTags?.forEach((t) => {
        violationMap[t] = (violationMap[t] || 0) + 1;
      });
    });
    const topViolations = Object.entries(violationMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const maxViolationCount = Math.max(...topViolations.map((v) => v.count), 1);

    // Day of week distribution
    const dayMap: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    history.forEach((h) => {
      if (h.date) {
        const d = new Date(h.date);
        const day = d.getDay(); // 0 is Sunday, 1 is Monday...
        if (day >= 1 && day <= 6) {
          dayMap[day] = (dayMap[day] || 0) + 1;
        }
      }
    });

    const dayLabels = [
      { key: 1, label: 'Thứ Hai' },
      { key: 2, label: 'Thứ Ba' },
      { key: 3, label: 'Thứ Tư' },
      { key: 4, label: 'Thứ Năm' },
      { key: 5, label: 'Thứ Sáu' },
      { key: 6, label: 'Thứ Bảy' },
    ];
    const maxDayCount = Math.max(...Object.values(dayMap), 1);

    // Student performance rankings
    const studentScoreMap: {
      [id: string]: {
        name: string;
        stt: number;
        absentCount: number;
        violationCount: number;
        commendationCount: number;
        score: number;
      };
    } = {};

    config.students.forEach((s) => {
      studentScoreMap[s.id] = {
        name: s.name,
        stt: s.stt,
        absentCount: 0,
        violationCount: 0,
        commendationCount: 0,
        score: 100, // starting baseline 100 points
      };
    });

    history.forEach((h) => {
      h.students.forEach((st) => {
        if (studentScoreMap[st.id]) {
          if (h.type === 'ABSENT') {
            studentScoreMap[st.id].absentCount += 1;
            studentScoreMap[st.id].score -= h.absentType === 'UNEXCUSED' ? 10 : 3;
          } else if (h.type === 'VIOLATION') {
            studentScoreMap[st.id].violationCount += 1;
            studentScoreMap[st.id].score -= 5;
          } else if (h.type === 'COMMENDATION') {
            studentScoreMap[st.id].commendationCount += 1;
            studentScoreMap[st.id].score += 5;
          }
        }
      });
    });

    const studentList = Object.values(studentScoreMap);
    const starStudents = [...studentList]
      .filter((s) => s.score >= 100 && (s.commendationCount > 0 || history.length > 0))
      .sort((a, b) => b.score - a.score || b.commendationCount - a.commendationCount)
      .slice(0, 5);

    const attentionStudents = [...studentList]
      .filter((s) => s.violationCount > 0 || s.absentCount > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    return {
      totalReports,
      absentTotal: absents.length,
      violationTotal: violations.length,
      commendationTotal: commendations.length,
      excused,
      unexcused,
      late,
      truant,
      topViolations,
      maxViolationCount,
      dayMap,
      dayLabels,
      maxDayCount,
      starStudents,
      attentionStudents,
    };
  }, [history, config.students]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
              <BarChart3 className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Thống Kê Nề Nếp & Chuyên Cần Lớp {config.className}
              </h3>
              <p className="text-xs text-blue-100">
                Phân tích dữ liệu trực quan phục vụ tổng kết tuần, tháng & sinh hoạt lớp
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[11px] font-bold text-blue-700 block mb-1">
                Tổng Lượt Ghi Nhận
              </span>
              <div className="text-2xl font-black text-blue-900">
                {stats.totalReports}
              </div>
              <span className="text-[10px] text-blue-600">toàn bộ báo cáo</span>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[11px] font-bold text-rose-700 block mb-1">
                Lượt Vắng Học
              </span>
              <div className="text-2xl font-black text-rose-900">
                {stats.absentTotal}
              </div>
              <span className="text-[10px] text-rose-600">
                {stats.excused} có phép &bull; {stats.unexcused} không phép
              </span>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[11px] font-bold text-amber-700 block mb-1">
                Lượt Vi Phạm Kỷ Luật
              </span>
              <div className="text-2xl font-black text-amber-900">
                {stats.violationTotal}
              </div>
              <span className="text-[10px] text-amber-600">cần chấn chỉnh</span>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                Lượt Tuyên Dương
              </span>
              <div className="text-2xl font-black text-emerald-900">
                {stats.commendationTotal}
              </div>
              <span className="text-[10px] text-emerald-600">thành tích & phát biểu</span>
            </div>
          </div>

          {/* 2-Column Visual Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chart 1: Top Violations */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Top Các Lỗi Vi Phạm Phổ Biến Nhất
              </h4>

              {stats.topViolations.length === 0 ? (
                <div className="py-8 text-center text-slate-400 italic">
                  Chưa ghi nhận lỗi vi phạm nào trong lớp 🎉
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.topViolations.map((v) => {
                    const pct = Math.round((v.count / stats.maxViolationCount) * 100);
                    return (
                      <div key={v.tag} className="space-y-1">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span className="truncate max-w-[200px]">{v.tag}</span>
                          <span className="font-bold text-slate-900">{v.count} lần</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chart 2: Day of Week Pattern */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                Mật Độ Báo Cáo Theo Ngày Trong Tuần
              </h4>

              <div className="grid grid-cols-6 gap-2 pt-4 items-end h-32">
                {stats.dayLabels.map((d) => {
                  const count = stats.dayMap[d.key] || 0;
                  const pct = Math.max(
                    Math.round((count / stats.maxDayCount) * 100),
                    count > 0 ? 15 : 4
                  );
                  return (
                    <div key={d.key} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="font-bold text-[10px] text-slate-700">
                        {count}
                      </span>
                      <div className="w-full bg-slate-200 rounded-t-lg h-20 flex items-end">
                        <div
                          className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-lg transition-all duration-500"
                          style={{ height: `${pct}%` }}
                          title={`${d.label}: ${count} lượt`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                        {d.label.replace('Thứ ', 'T')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2-Column Tables: Top Stars & Need Attention */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Stars */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2.5">
              <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Bảng Vàng Khen Thưởng & Gương Sáng Nề Nếp
              </h4>
              <div className="divide-y divide-emerald-100">
                {stats.starStudents.map((s, idx) => (
                  <div
                    key={s.stt}
                    className="py-2 flex items-center justify-between font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>
                        {s.name} <span className="text-slate-400">(#{s.stt})</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {s.score} đ
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        +{s.commendationCount} sao
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Attention */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-2xl space-y-2.5">
              <h4 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                <UserX className="w-4 h-4 text-rose-600" />
                Học Sinh Cần GVCN Kèm Cặp & Nhắc Nhở
              </h4>
              <div className="divide-y divide-rose-100">
                {stats.attentionStudents.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 italic">
                    Không có học sinh nào bị trừ điểm nề nếp 👍
                  </div>
                ) : (
                  stats.attentionStudents.map((s, idx) => (
                    <div
                      key={s.stt}
                      className="py-2 flex items-center justify-between font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 text-[11px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>
                          {s.name} <span className="text-slate-400">(#{s.stt})</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          {s.score} đ
                        </span>
                        <span className="text-[11px] text-rose-700">
                          {s.violationCount} vi phạm / {s.absentCount} vắng
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition cursor-pointer"
          >
            Đã xem & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
