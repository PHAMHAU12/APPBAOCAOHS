import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  FileCheck2,
  TrendingUp,
  Send,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  User,
  Users,
  Key,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';
import { ClassConfig, ReportItem, Student } from '../types';
import {
  GEMINI_MODELS,
  getStoredApiKey,
  getStoredModel,
  callGeminiWithFallback,
  aiGenerateParentMessage,
  aiGenerateConductEvaluation,
  aiAnalyzeClassTrends,
} from '../services/geminiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClassConfig;
  history: ReportItem[];
  onShowToast: (msg: string, icon?: string) => void;
  onOpenApiKeyModal: () => void;
}

type StepStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'STOPPED_ERROR';

interface StepData {
  status: StepStatus;
  result: string;
  usedModel: string;
  attemptModel: string;
  errorMessage: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  config,
  history,
  onShowToast,
  onOpenApiKeyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'parent' | 'evaluation' | 'analysis'>('pipeline');

  // Selected student for Pipeline
  const [pipelineStudentId, setPipelineStudentId] = useState<string>(
    config.students[0]?.id || ''
  );

  // 3-Step Pipeline States (AI_INSTRUCTIONS requirement)
  const [step1, setStep1] = useState<StepData>({
    status: 'IDLE',
    result: '',
    usedModel: '',
    attemptModel: '',
    errorMessage: '',
  });

  const [step2, setStep2] = useState<StepData>({
    status: 'IDLE',
    result: '',
    usedModel: '',
    attemptModel: '',
    errorMessage: '',
  });

  const [step3, setStep3] = useState<StepData>({
    status: 'IDLE',
    result: '',
    usedModel: '',
    attemptModel: '',
    errorMessage: '',
  });

  const [pipelineRunning, setPipelineRunning] = useState(false);

  // Tab 1 (Quick Parent Message) state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    config.students[0]?.id || ''
  );
  const [parentReportType, setParentReportType] = useState<
    'ABSENT' | 'VIOLATION' | 'COMMENDATION'
  >('VIOLATION');
  const [parentDetails, setParentDetails] = useState('');
  const [parentDate, setParentDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  });

  // Tab 2 (Quick Evaluation) state
  const [evalStudentId, setEvalStudentId] = useState<string>(
    config.students[0]?.id || ''
  );

  // Standalone tab states
  const [standaloneLoading, setStandaloneLoading] = useState(false);
  const [standaloneResult, setStandaloneResult] = useState('');
  const [standaloneModel, setStandaloneModel] = useState('');
  const [standaloneError, setStandaloneError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const apiKey = getStoredApiKey();

  // Helper to copy text
  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onShowToast('Đã sao chép nội dung!', '📋');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ==========================================
  // PIPELINE 3-STEP ENGINE (AI_INSTRUCTIONS)
  // ==========================================

  // Step 1: Phân tích & Trích xuất vi phạm, chuyên cần
  const runStep1 = async (targetStudent: Student): Promise<string> => {
    setStep1((prev) => ({
      ...prev,
      status: 'RUNNING',
      errorMessage: '',
      attemptModel: getStoredModel(),
    }));

    const studentReports = history.filter((h) =>
      h.students.some((s) => s.id === targetStudent.id || s.name === targetStudent.name)
    );
    const absents = studentReports.filter((h) => h.type === 'ABSENT');
    const violations = studentReports.filter((h) => h.type === 'VIOLATION');
    const commendations = studentReports.filter((h) => h.type === 'COMMENDATION');

    const prompt = `Bạn là trợ lý giáo dục của trường ${config.schoolName || 'Việt Nam'}.
[BƯỚC 1: PHÂN TÍCH & TRÍCH XUẤT DỮ LIỆU NỀ NẾP HỌC SINH]
Học sinh: ${targetStudent.name} (STT: ${targetStudent.stt}, Lớp: ${config.className})
Dữ liệu ghi nhận trong hệ thống:
- Vắng học: ${absents.length} buổi (Chi tiết: ${absents.map((a) => `[${a.date}] ${a.period} - ${a.absentType}`).join('; ') || 'Không vắng'})
- Vi phạm kỷ luật: ${violations.length} lần (Chi tiết: ${violations.map((v) => `[${v.date}] ${v.violationTags?.join(', ')} - ${v.customNote || ''}`).join('; ') || 'Không vi phạm'})
- Tuyên dương: ${commendations.length} lần (Chi tiết: ${commendations.map((c) => `[${c.date}] ${c.commendationTags?.join(', ')}`).join('; ') || 'Không có'})

Hãy tóm tắt và phân tích ngắn gọn:
1. Tổng quan tình trạng chuyên cần & chấp hành nội quy của em.
2. Các lỗi lặp lại nhiều nhất hoặc các điểm sáng tích cực đáng ghi nhận.`;

    try {
      const res = await callGeminiWithFallback(prompt, {
        onModelAttempt: (model) => {
          setStep1((prev) => ({ ...prev, attemptModel: model }));
        },
      });

      setStep1({
        status: 'COMPLETED',
        result: res.text,
        usedModel: res.usedModel,
        attemptModel: res.usedModel,
        errorMessage: '',
      });
      return res.text;
    } catch (e: any) {
      const errMsg = e?.message || 'Lỗi API khi thực hiện Bước 1';
      setStep1((prev) => ({
        ...prev,
        status: 'STOPPED_ERROR',
        errorMessage: errMsg,
      }));
      // Halt following steps
      setStep2((prev) => ({ ...prev, status: 'STOPPED_ERROR', errorMessage: 'Đã dừng do Bước 1 gặp lỗi' }));
      setStep3((prev) => ({ ...prev, status: 'STOPPED_ERROR', errorMessage: 'Đã dừng do Bước 1 gặp lỗi' }));
      throw new Error(errMsg);
    }
  };

  // Step 2: Soạn thảo văn bản nhận xét học bạ (TT 22/58)
  const runStep2 = async (targetStudent: Student, step1Text: string): Promise<string> => {
    setStep2((prev) => ({
      ...prev,
      status: 'RUNNING',
      errorMessage: '',
      attemptModel: getStoredModel(),
    }));

    const prompt = `Bạn là Giáo viên Chủ nhiệm am hiểu Thông tư 22/2021/TT-BGDĐT.
[BƯỚC 2: SOẠN THẢO NHẬN XÉT HỌC BẠ & ĐÁNH GIÁ RÈN LUYỆN]
Học sinh: ${targetStudent.name} (Lớp: ${config.className})
Dữ liệu đã trích xuất từ Bước 1:
"""
${step1Text}
"""

Hãy soạn thảo:
1. Mức rèn luyện dự kiến: (Tốt / Khá / Đạt / Chưa đạt)
2. Lời phê học bạ chính thức (3-4 câu chuẩn văn phong Bộ GD&ĐT, đánh giá khách quan về ý thức tổ chức kỷ luật và thái độ học tập)
3. Điểm cần phấn đấu trong học kỳ tới.`;

    try {
      const res = await callGeminiWithFallback(prompt, {
        onModelAttempt: (model) => {
          setStep2((prev) => ({ ...prev, attemptModel: model }));
        },
      });

      setStep2({
        status: 'COMPLETED',
        result: res.text,
        usedModel: res.usedModel,
        attemptModel: res.usedModel,
        errorMessage: '',
      });
      return res.text;
    } catch (e: any) {
      const errMsg = e?.message || 'Lỗi API khi thực hiện Bước 2';
      setStep2((prev) => ({
        ...prev,
        status: 'STOPPED_ERROR',
        errorMessage: errMsg,
      }));
      // Halt step 3
      setStep3((prev) => ({ ...prev, status: 'STOPPED_ERROR', errorMessage: 'Đã dừng do Bước 2 gặp lỗi' }));
      throw new Error(errMsg);
    }
  };

  // Step 3: Lập kế hoạch hành động & Tin nhắn Zalo gửi Phụ huynh
  const runStep3 = async (
    targetStudent: Student,
    step1Text: string,
    step2Text: string
  ): Promise<string> => {
    setStep3((prev) => ({
      ...prev,
      status: 'RUNNING',
      errorMessage: '',
      attemptModel: getStoredModel(),
    }));

    const prompt = `Bạn là Giáo viên Chủ nhiệm ${config.teacherName || 'Phạm Hậu'}.
[BƯỚC 3: KẾ HOẠCH HÀNH ĐỘNG & TIN NHẮN ZALO GỬI PHỤ HUYNH]
Học sinh: ${targetStudent.name} (Lớp: ${config.className})
Kết quả từ Bước 1 & Bước 2:
"""
${step1Text}
---
${step2Text}
"""

Hãy tạo:
1. Tin nhắn Zalo gửi riêng cho Phụ huynh em ${targetStudent.name} (lời lẽ ấm áp, lịch sự, phối hợp giáo dục, không làm phụ huynh tự ái).
2. Kế hoạch kèm cặp riêng của GVCN (giao việc gì cho em, nhờ bạn nào giúp đỡ, theo dõi nề nếp như thế nào).`;

    try {
      const res = await callGeminiWithFallback(prompt, {
        onModelAttempt: (model) => {
          setStep3((prev) => ({ ...prev, attemptModel: model }));
        },
      });

      setStep3({
        status: 'COMPLETED',
        result: res.text,
        usedModel: res.usedModel,
        attemptModel: res.usedModel,
        errorMessage: '',
      });
      return res.text;
    } catch (e: any) {
      const errMsg = e?.message || 'Lỗi API khi thực hiện Bước 3';
      setStep3((prev) => ({
        ...prev,
        status: 'STOPPED_ERROR',
        errorMessage: errMsg,
      }));
      throw new Error(errMsg);
    }
  };

  // Run full 3-step pipeline sequentially
  const handleRunFullPipeline = async () => {
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    const student = config.students.find((s) => s.id === pipelineStudentId);
    if (!student) {
      onShowToast('Vui lòng chọn học sinh!', '⚠️');
      return;
    }

    setPipelineRunning(true);

    try {
      // Step 1
      const res1 = await runStep1(student);
      // Step 2
      const res2 = await runStep2(student, res1);
      // Step 3
      await runStep3(student, res1, res2);

      onShowToast('Quy trình AI 3 Bước đã hoàn tất thành công 100%!', '🎉');
    } catch (err: any) {
      console.warn('Pipeline dừng do lỗi:', err);
    } finally {
      setPipelineRunning(false);
    }
  };

  // Retry single failed step preserving previous results (AI_INSTRUCTIONS requirement)
  const handleRetryStep = async (stepNum: 1 | 2 | 3) => {
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }
    const student = config.students.find((s) => s.id === pipelineStudentId);
    if (!student) return;

    setPipelineRunning(true);
    try {
      if (stepNum === 1) {
        const res1 = await runStep1(student);
        const res2 = await runStep2(student, res1);
        await runStep3(student, res1, res2);
      } else if (stepNum === 2) {
        const res2 = await runStep2(student, step1.result);
        await runStep3(student, step1.result, res2);
      } else if (stepNum === 3) {
        await runStep3(student, step1.result, step2.result);
      }
    } catch (err) {
      console.warn('Retry dừng do lỗi:', err);
    } finally {
      setPipelineRunning(false);
    }
  };

  // Reset Pipeline
  const handleResetPipeline = () => {
    setStep1({ status: 'IDLE', result: '', usedModel: '', attemptModel: '', errorMessage: '' });
    setStep2({ status: 'IDLE', result: '', usedModel: '', attemptModel: '', errorMessage: '' });
    setStep3({ status: 'IDLE', result: '', usedModel: '', attemptModel: '', errorMessage: '' });
  };

  // Calculate Progress Percentage
  const calculateProgress = (): { pct: number; isError: boolean } => {
    if (step1.status === 'STOPPED_ERROR') return { pct: 15, isError: true };
    if (step2.status === 'STOPPED_ERROR') return { pct: 45, isError: true };
    if (step3.status === 'STOPPED_ERROR') return { pct: 75, isError: true };

    let completedCount = 0;
    if (step1.status === 'COMPLETED') completedCount++;
    if (step2.status === 'COMPLETED') completedCount++;
    if (step3.status === 'COMPLETED') completedCount++;

    return {
      pct: Math.round((completedCount / 3) * 100),
      isError: false,
    };
  };

  const progress = calculateProgress();

  // Standalone: Quick Parent Msg
  const handleStandaloneParentMsg = async () => {
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }
    const student = config.students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    setStandaloneLoading(true);
    setStandaloneError('');
    setStandaloneResult('');

    try {
      const res = await aiGenerateParentMessage({
        studentName: student.name,
        studentStt: student.stt,
        reportType: parentReportType,
        specificDetails: parentDetails.trim() || 'Cần phối hợp nhắc nhở nề nếp với gia đình.',
        dateStr: parentDate,
        teacherName: config.teacherName || 'GVCN',
        className: config.className || 'Lớp',
        schoolName: config.schoolName || 'Nhà trường',
      });
      setStandaloneResult(res.text);
      setStandaloneModel(res.usedModel);
      onShowToast('AI đã hoàn thành soạn tin nhắn!', '✨');
    } catch (e: any) {
      setStandaloneError(e?.message || 'Lỗi khi gọi AI');
    } finally {
      setStandaloneLoading(false);
    }
  };

  // Standalone: Quick Evaluation
  const handleStandaloneEvaluation = async () => {
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }
    const student = config.students.find((s) => s.id === evalStudentId);
    if (!student) return;

    const studentReports = history.filter((h) =>
      h.students.some((s) => s.id === student.id || s.name === student.name)
    );
    const absents = studentReports.filter((h) => h.type === 'ABSENT');
    const violations = studentReports.filter((h) => h.type === 'VIOLATION');
    const commendations = studentReports.filter((h) => h.type === 'COMMENDATION');

    setStandaloneLoading(true);
    setStandaloneError('');
    setStandaloneResult('');

    try {
      const res = await aiGenerateConductEvaluation({
        studentName: student.name,
        studentStt: student.stt,
        className: config.className || 'Lớp',
        absentCount: absents.length,
        violationCount: violations.length,
        commendationCount: commendations.length,
        violationsList: violations.flatMap((v) => v.violationTags),
        commendationsList: commendations.flatMap((c) => c.commendationTags),
      });
      setStandaloneResult(res.text);
      setStandaloneModel(res.usedModel);
      onShowToast('AI đã tạo nhận xét học bạ xong!', '🎓');
    } catch (e: any) {
      setStandaloneError(e?.message || 'Lỗi khi gọi AI');
    } finally {
      setStandaloneLoading(false);
    }
  };

  // Standalone: Quick Class Analysis
  const handleStandaloneAnalysis = async () => {
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }
    if (history.length === 0) {
      onShowToast('Cần có ít nhất 1 bản ghi lịch sử nề nếp để AI phân tích!', '⚠️');
      return;
    }

    setStandaloneLoading(true);
    setStandaloneError('');
    setStandaloneResult('');

    const absentCount = history.filter((h) => h.type === 'ABSENT').length;
    const violationCount = history.filter((h) => h.type === 'VIOLATION').length;
    const commendationCount = history.filter((h) => h.type === 'COMMENDATION').length;

    const tagMap: { [key: string]: number } = {};
    history.forEach((h) => {
      h.violationTags?.forEach((t) => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });
    const topViolations = Object.entries(tagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    try {
      const res = await aiAnalyzeClassTrends({
        className: config.className || 'Lớp',
        schoolName: config.schoolName || 'Trường',
        totalReports: history.length,
        absentCount,
        violationCount,
        commendationCount,
        topViolations,
        repeatOffenders: [],
        starStudents: [],
      });
      setStandaloneResult(res.text);
      setStandaloneModel(res.usedModel);
      onShowToast('AI đã hoàn thành phân tích nề nếp lớp!', '📊');
    } catch (e: any) {
      setStandaloneError(e?.message || 'Lỗi khi gọi AI');
    } finally {
      setStandaloneLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[94vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Trợ Lý AI Giáo Viên Chủ Nhiệm (Gemini Fallback)
              </h3>
              <p className="text-xs text-purple-100">
                Tuân thủ AI_INSTRUCTIONS: Cơ chế Fallback 3 Model & Pipeline 3 Bước có Retry độc lập
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!apiKey ? (
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition cursor-pointer animate-pulse"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Lấy API key để sử dụng app</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                title="Cài đặt API Key & Model AI"
              >
                <Key className="w-3.5 h-3.5 text-amber-300" />
                <span>Settings (API Key)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Quy Trình AI 3 Bước (Chuẩn AI Instructions)</span>
          </button>

          <button
            onClick={() => setActiveTab('parent')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'parent'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Soạn Tin Phụ Huynh</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'evaluation'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Nhận Xét Học Bạ (TT 22)</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'analysis'
                ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Phân Tích Nề Nếp Lớp</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* TAB: PIPELINE 3 STEPS */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              {/* Top Controls: Choose Student & Run */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Chọn học sinh xử lý:</span>
                  <select
                    value={pipelineStudentId}
                    onChange={(e) => setPipelineStudentId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
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
                    onClick={handleResetPipeline}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-semibold rounded-lg hover:bg-slate-200/60 transition cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại</span>
                  </button>

                  <button
                    type="button"
                    disabled={pipelineRunning}
                    onClick={handleRunFullPipeline}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {pipelineRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang thực hiện tuần tự...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Chạy Quy Trình AI 3 Bước</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar (AI_INSTRUCTIONS requirement) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <span className="text-slate-700">
                    Tiến trình thực hiện:{' '}
                    {progress.isError ? (
                      <strong className="text-rose-600">Đã dừng do lỗi API</strong>
                    ) : progress.pct === 100 ? (
                      <strong className="text-emerald-600">Hoàn tất 100%</strong>
                    ) : (
                      <span>{progress.pct}%</span>
                    )}
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    Thứ tự Fallback: gemini-3-flash-preview &rarr; gemini-3-pro-preview &rarr; gemini-2.5-flash
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress.isError ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(progress.pct, progress.isError ? 25 : 0)}%` }}
                  />
                </div>
              </div>

              {/* 3 COLUMNS PIPELINE DISPLAY (AI_INSTRUCTIONS requirement) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch pt-2">
                {/* COLUMN 1: STEP 1 */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition ${
                    step1.status === 'COMPLETED'
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : step1.status === 'STOPPED_ERROR'
                      ? 'bg-rose-50/60 border-rose-300'
                      : step1.status === 'RUNNING'
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-400'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-slate-800">
                        1. Phân tích & Trích xuất
                      </span>
                      {step1.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Hoàn tất
                        </span>
                      ) : step1.status === 'STOPPED_ERROR' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Đã dừng do lỗi
                        </span>
                      ) : step1.status === 'RUNNING' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Đang xử lý ({step1.attemptModel})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                          Chờ xử lý
                        </span>
                      )}
                    </div>

                    {step1.errorMessage && (
                      <div className="p-2.5 bg-rose-100/80 rounded-xl text-rose-900 text-[11px] font-mono leading-tight">
                        <strong>Lỗi API:</strong> {step1.errorMessage}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200">
                      {step1.result || 'Chưa chạy phân tích trích xuất dữ liệu.'}
                    </div>
                  </div>

                  <div className="pt-3 border-t mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {step1.usedModel && `Model: ${step1.usedModel}`}
                    </span>
                    {step1.status === 'STOPPED_ERROR' && (
                      <button
                        type="button"
                        onClick={() => handleRetryStep(1)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Thử lại Bước 1</span>
                      </button>
                    )}
                    {step1.result && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(step1.result)}
                        className="text-slate-500 hover:text-slate-800 p-1"
                        title="Sao chép kết quả"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: STEP 2 */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition ${
                    step2.status === 'COMPLETED'
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : step2.status === 'STOPPED_ERROR'
                      ? 'bg-rose-50/60 border-rose-300'
                      : step2.status === 'RUNNING'
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-400'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-slate-800">
                        2. Nhận xét học bạ (TT 22)
                      </span>
                      {step2.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Hoàn tất
                        </span>
                      ) : step2.status === 'STOPPED_ERROR' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Đã dừng do lỗi
                        </span>
                      ) : step2.status === 'RUNNING' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Đang xử lý ({step2.attemptModel})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                          Chờ xử lý
                        </span>
                      )}
                    </div>

                    {step2.errorMessage && (
                      <div className="p-2.5 bg-rose-100/80 rounded-xl text-rose-900 text-[11px] font-mono leading-tight">
                        <strong>Lỗi API:</strong> {step2.errorMessage}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200">
                      {step2.result || 'Chờ kết quả Bước 1 để soạn thảo lời phê học bạ.'}
                    </div>
                  </div>

                  <div className="pt-3 border-t mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {step2.usedModel && `Model: ${step2.usedModel}`}
                    </span>
                    {step2.status === 'STOPPED_ERROR' && (
                      <button
                        type="button"
                        onClick={() => handleRetryStep(2)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Thử lại Bước 2</span>
                      </button>
                    )}
                    {step2.result && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(step2.result)}
                        className="text-slate-500 hover:text-slate-800 p-1"
                        title="Sao chép kết quả"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* COLUMN 3: STEP 3 */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition ${
                    step3.status === 'COMPLETED'
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : step3.status === 'STOPPED_ERROR'
                      ? 'bg-rose-50/60 border-rose-300'
                      : step3.status === 'RUNNING'
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-400'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-slate-800">
                        3. Kế hoạch & Tin nhắn PH
                      </span>
                      {step3.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Hoàn tất
                        </span>
                      ) : step3.status === 'STOPPED_ERROR' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Đã dừng do lỗi
                        </span>
                      ) : step3.status === 'RUNNING' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Đang xử lý ({step3.attemptModel})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                          Chờ xử lý
                        </span>
                      )}
                    </div>

                    {step3.errorMessage && (
                      <div className="p-2.5 bg-rose-100/80 rounded-xl text-rose-900 text-[11px] font-mono leading-tight">
                        <strong>Lỗi API:</strong> {step3.errorMessage}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-200">
                      {step3.result || 'Chờ kết quả Bước 1 & 2 để lập kế hoạch & tin nhắn.'}
                    </div>
                  </div>

                  <div className="pt-3 border-t mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {step3.usedModel && `Model: ${step3.usedModel}`}
                    </span>
                    {step3.status === 'STOPPED_ERROR' && (
                      <button
                        type="button"
                        onClick={() => handleRetryStep(3)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Thử lại Bước 3</span>
                      </button>
                    )}
                    {step3.result && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(step3.result)}
                        className="text-slate-500 hover:text-slate-800 p-1"
                        title="Sao chép kết quả"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STANDALONE PARENT MESSAGE */}
          {activeTab === 'parent' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Học sinh</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    {config.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.stt}. {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nội dung</label>
                  <select
                    value={parentReportType}
                    onChange={(e) => setParentReportType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="VIOLATION">⚠️ Vi phạm nội quy</option>
                    <option value="ABSENT">🔴 Vắng học / Nghỉ học</option>
                    <option value="COMMENDATION">⭐ Tuyên dương / Tiến bộ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Ngày xảy ra</label>
                  <input
                    type="date"
                    value={parentDate}
                    onChange={(e) => setParentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Chi tiết cụ thể</label>
                <textarea
                  rows={2}
                  value={parentDetails}
                  onChange={(e) => setParentDetails(e.target.value)}
                  placeholder="Ví dụ: Nghỉ học không phép tiết 1 môn Toán..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={standaloneLoading}
                  onClick={handleStandaloneParentMsg}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  {standaloneLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI đang soạn thảo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>AI Soạn tin nhắn Zalo gửi Phụ huynh</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB: STANDALONE EVALUATION */}
          {activeTab === 'evaluation' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Chọn học sinh</label>
                <select
                  value={evalStudentId}
                  onChange={(e) => setEvalStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  {config.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.stt}. {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={standaloneLoading}
                  onClick={handleStandaloneEvaluation}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  {standaloneLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tổng hợp dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4 text-amber-300" />
                      <span>AI Tạo Lời Phê Học Bạ (Chuẩn TT 22)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB: STANDALONE ANALYSIS */}
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  AI quét toàn bộ <strong>{history.length}</strong> lượt báo cáo nề nếp trong lớp để chỉ ra các vấn đề trọng điểm và giải pháp sư phạm cho GVCN.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={standaloneLoading}
                  onClick={handleStandaloneAnalysis}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  {standaloneLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI đang quét phân tích...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 text-amber-300" />
                      <span>AI Lập Báo Cáo Phân Tích & Giải Pháp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STANDALONE ERROR / RESULT CONTAINER */}
          {activeTab !== 'pipeline' && standaloneError && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-xs text-rose-950">Đã dừng do lỗi API Gemini:</p>
                <p className="font-mono text-[11px] text-rose-800">{standaloneError}</p>
                <button
                  type="button"
                  onClick={onOpenApiKeyModal}
                  className="text-xs text-rose-700 underline font-bold"
                >
                  Kiểm tra lại API Key hoặc đổi model tại đây &rarr;
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'pipeline' && standaloneResult && (
            <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-indigo-950">Kết quả từ Trợ lý AI GVCN</span>
                  {standaloneModel && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-100 text-indigo-700">
                      {standaloneModel}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(standaloneResult)}
                  className="px-3 py-1.5 bg-white text-indigo-700 font-bold rounded-lg border border-indigo-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                {standaloneResult}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Cơ chế Fallback: gemini-3-flash-preview (Default) &bull; gemini-3-pro-preview &bull; gemini-2.5-flash
          </span>
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
