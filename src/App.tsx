import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ReportForm } from './components/ReportForm';
import { PreviewCard } from './components/PreviewCard';
import { ConfigModal } from './components/ConfigModal';
import { HistoryModal } from './components/HistoryModal';
import { StandaloneExportModal } from './components/StandaloneExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { DocumentExportModal } from './components/DocumentExportModal';
import {
  Sparkles,
  BarChart3,
  FileText,
  Key,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ClassConfig,
  ReportType,
  AbsentType,
  Student,
  ReportItem,
} from './types';
import { DEFAULT_CONFIG } from './data/defaultData';
import {
  generateReportMessage,
  cleanPhoneNumber,
  getZaloLink,
  formatVietnameseDate,
} from './utils/zaloHelper';
import { getStoredApiKey } from './services/geminiService';

const STORAGE_KEY_CONFIG = 'app_class_zalo_config';
const STORAGE_KEY_HISTORY = 'app_class_zalo_history';

export default function App() {
  // Class configuration loaded from LocalStorage
  const [config, setConfig] = useState<ClassConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.students)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading config from LocalStorage', e);
    }
    return DEFAULT_CONFIG;
  });

  // History records loaded from LocalStorage
  const [history, setHistory] = useState<ReportItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error reading history from LocalStorage', e);
    }
    return [];
  });

  // Gemini API Key state
  const [hasApiKey, setHasApiKey] = useState<boolean>(() => {
    return Boolean(getStoredApiKey());
  });

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);

  // Form State
  const [dateStr, setDateStr] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [period, setPeriod] = useState<string>('Tiết 1');
  const [subject, setSubject] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('ABSENT');
  const [absentType, setAbsentType] = useState<AbsentType>('EXCUSED');
  const [violationTags, setViolationTags] = useState<string[]>([]);
  const [commendationTags, setCommendationTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);

  // Toast feedback state
  const [toast, setToast] = useState<{ visible: boolean; message: string; icon: string }>({
    visible: false,
    message: '',
    icon: '✅',
  });

  const showToast = (message: string, icon = '✅') => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Check key on mount & save
  const refreshApiKeyStatus = () => {
    setHasApiKey(Boolean(getStoredApiKey()));
  };

  // AI_INSTRUCTIONS.md: Khi chưa có key, hiển thị Modal bắt buộc nhập
  useEffect(() => {
    const key = getStoredApiKey();
    if (!key) {
      setIsApiKeyOpen(true);
    }
  }, []);

  // Persist config whenever it changes
  const handleSaveConfig = (newConfig: ClassConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
      showToast('Đã lưu cấu hình lớp thành công!', '✅');
    } catch (e) {
      console.error('Failed to save config', e);
    }
  };

  // Persist history
  const saveHistory = (items: ReportItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  // Handle Restore Full Backup (Config + History)
  const handleRestoreBackup = (backupConfig: ClassConfig, backupHistory?: ReportItem[]) => {
    setConfig(backupConfig);
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(backupConfig));
    } catch (e) {
      console.error(e);
    }

    if (backupHistory && Array.isArray(backupHistory)) {
      setHistory(backupHistory);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(backupHistory));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Realtime calculated message
  const messageText = useMemo(() => {
    return generateReportMessage({
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
    });
  }, [
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
  ]);

  // Validation
  const validateForm = (): boolean => {
    if (selectedStudents.length === 0) {
      showToast('Vui lòng chọn ít nhất một học sinh trong danh sách!', '⚠️');
      return false;
    }
    if (
      reportType === 'VIOLATION' &&
      violationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 lỗi vi phạm hoặc nhập ghi chú!', '⚠️');
      return false;
    }
    if (
      reportType === 'COMMENDATION' &&
      commendationTags.length === 0 &&
      !customNote.trim()
    ) {
      showToast('Vui lòng chọn ít nhất 1 mục tuyên dương hoặc ghi chú!', '⚠️');
      return false;
    }
    if (!config.zaloPhone.trim()) {
      showToast('Vui lòng nhập Số Zalo của GVCN trong phần Cấu hình!', '⚠️');
      setIsConfigOpen(true);
      return false;
    }
    return true;
  };

  const createHistoryItem = (): ReportItem => {
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      date: dateStr,
      dateDisplay: formatVietnameseDate(dateStr),
      period,
      subject,
      type: reportType,
      absentType: reportType === 'ABSENT' ? absentType : undefined,
      violationTags: reportType === 'VIOLATION' ? violationTags : [],
      commendationTags: reportType === 'COMMENDATION' ? commendationTags : [],
      customNote,
      students: selectedStudents,
      reporter: config.reporterName || 'Ban cán sự',
      teacherName: config.teacherName,
      className: config.className,
      schoolName: config.schoolName,
      formattedMessage: messageText,
    };
  };

  // Handle Send to Zalo
  const handleSendToZalo = () => {
    if (!validateForm()) return;

    // 1. Copy message automatically to clipboard
    navigator.clipboard.writeText(messageText).catch(() => {});

    // 2. Save to history
    const newItem = createHistoryItem();
    saveHistory([newItem, ...history]);

    // 3. Open Zalo chat
    const zaloUrl = getZaloLink(config.zaloPhone);
    showToast('Đã chép nội dung! Đang mở cửa sổ Zalo với GVCN...', '🚀');

    setTimeout(() => {
      window.open(zaloUrl, '_blank');
    }, 250);
  };

  // Handle Copy message
  const handleCopyText = () => {
    navigator.clipboard
      .writeText(messageText)
      .then(() => {
        showToast('Đã sao chép nội dung báo cáo vào Clipboard!', '📋');
      })
      .catch(() => {
        showToast('Lỗi khi sao chép. Vui lòng thử lại!', '❌');
      });
  };

  // Handle Save to history without opening Zalo
  const handleSaveToHistory = () => {
    if (!validateForm()) return;
    const newItem = createHistoryItem();
    saveHistory([newItem, ...history]);
    showToast('Đã lưu lượt báo cáo vào Nhật ký!', '💾');
  };

  // Handle Reset form
  const handleResetForm = () => {
    setSelectedStudents([]);
    setViolationTags([]);
    setCommendationTags([]);
    setCustomNote('');
    setSubject('');
    showToast('Đã làm mới biểu mẫu để nhập báo cáo tiếp theo!', '🔄');
  };

  // Delete single history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử báo cáo?')) {
      saveHistory([]);
      showToast('Đã xóa toàn bộ lịch sử.', '🗑️');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 antialiased flex flex-col pb-16 font-sans">
      {/* Header Bar with quick navigation */}
      <Header
        config={config}
        historyCount={history.length}
        hasApiKey={hasApiKey}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenDocuments={() => setIsDocumentsOpen(true)}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6 w-full flex-1">
        {/* Welcome & Quick Feature Bar */}
        <div className="mb-5 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shadow-inner">
              📢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  BÁO CÁO NỀ NẾP LỚP - PHẠM HẬU
                </h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Lớp {config.className || 'Chưa đặt'} ({config.students.length} học sinh)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ghi nhận nhanh vắng học, vi phạm nề nếp, kết nối trực tiếp Zalo GVCN và trợ lý AI giáo dục.
              </p>
            </div>
          </div>

          {/* Quick Action Shortcut Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAiAssistantOpen(true)}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Trợ lý AI (Tin nhắn PH & Lời phê)</span>
            </button>

            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Thống kê & Thi đua</span>
            </button>

            <button
              onClick={() => setIsDocumentsOpen(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Biên bản Word & Slide</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Student selector */}
          <div className="lg:col-span-7">
            <ReportForm
              config={config}
              dateStr={dateStr}
              setDateStr={setDateStr}
              period={period}
              setPeriod={setPeriod}
              subject={subject}
              setSubject={setSubject}
              reportType={reportType}
              setReportType={setReportType}
              absentType={absentType}
              setAbsentType={setAbsentType}
              violationTags={violationTags}
              setViolationTags={setViolationTags}
              commendationTags={commendationTags}
              setCommendationTags={setCommendationTags}
              customNote={customNote}
              setCustomNote={setCustomNote}
              selectedStudents={selectedStudents}
              setSelectedStudents={setSelectedStudents}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>

          {/* Right Column: Real-time Zalo Preview & Direct Action */}
          <div className="lg:col-span-5">
            <PreviewCard
              config={config}
              messageText={messageText}
              hasStudentsSelected={selectedStudents.length > 0}
              onSendToZalo={handleSendToZalo}
              onCopyText={handleCopyText}
              onSaveToHistory={handleSaveToHistory}
              onResetForm={handleResetForm}
              onOpenConfig={() => setIsConfigOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* MODALS */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        history={history}
        onSaveConfig={handleSaveConfig}
        onRestoreBackup={handleRestoreBackup}
        onShowToast={showToast}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        config={config}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onShowToast={showToast}
      />

      <StandaloneExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onShowToast={showToast}
      />

      <ApiKeyModal
        isOpen={isApiKeyOpen}
        onClose={() => setIsApiKeyOpen(false)}
        onShowToast={showToast}
        onApiKeySaved={refreshApiKeyStatus}
      />

      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        config={config}
        history={history}
        onShowToast={showToast}
        onOpenApiKeyModal={() => {
          setIsAiAssistantOpen(false);
          setIsApiKeyOpen(true);
        }}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        config={config}
        history={history}
      />

      <DocumentExportModal
        isOpen={isDocumentsOpen}
        onClose={() => setIsDocumentsOpen(false)}
        config={config}
        history={history}
        onShowToast={showToast}
      />

      {/* FLOATING TOAST NOTIFICATION */}
      <div
        className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 pointer-events-none max-w-sm ${
          toast.visible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-12 opacity-0 scale-95'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80">
          <span className="text-base">{toast.icon}</span>
          <span className="font-medium text-slate-100">{toast.message}</span>
        </div>
      </div>
    </div>
  );
}
