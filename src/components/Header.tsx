import React from 'react';
import {
  Settings,
  History,
  Download,
  School,
  UserCheck,
  Key,
  Sparkles,
  BarChart3,
  FileText,
} from 'lucide-react';
import { ClassConfig } from '../types';

interface HeaderProps {
  config: ClassConfig;
  historyCount: number;
  hasApiKey: boolean;
  onOpenConfig: () => void;
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onOpenApiKey: () => void;
  onOpenAiAssistant: () => void;
  onOpenAnalytics: () => void;
  onOpenDocuments: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  historyCount,
  hasApiKey,
  onOpenConfig,
  onOpenHistory,
  onOpenExport,
  onOpenApiKey,
  onOpenAiAssistant,
  onOpenAnalytics,
  onOpenDocuments,
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Class Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/20">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                BÁO CÁO NỀ NẾP LỚP - PHẠM HẬU
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Lớp {config.className || 'Chưa đặt'}
              </span>
            </div>
            <div className="text-xs text-blue-100 flex flex-wrap items-center gap-2 font-medium mt-0.5">
              <span>{config.schoolName || 'Chưa cấu hình trường'}</span>
              <span className="inline-block w-1 h-1 rounded-full bg-blue-300"></span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                GVCN: <strong className="text-white">{config.teacherName || 'Chưa cấu hình'}</strong>
              </span>
              {config.zaloPhone && (
                <>
                  <span className="inline-block w-1 h-1 rounded-full bg-blue-300"></span>
                  <span className="text-blue-200 text-[11px]">Zalo: {config.zaloPhone}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Settings (API Key) Button - strictly following AI_INSTRUCTIONS.md */}
          <button
            onClick={onOpenApiKey}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg backdrop-blur transition border cursor-pointer ${
              !hasApiKey
                ? 'bg-white text-rose-600 border-rose-300 shadow-sm animate-pulse ring-2 ring-rose-400'
                : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
            }`}
            title="Settings (API Key) - Quản lý Gemini API Key & Model Fallback"
          >
            <Key className="w-3.5 h-3.5 text-amber-300" />
            <span>Settings (API Key)</span>
            {!hasApiKey ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow-xs">
                Lấy API key để sử dụng app
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Key đã kết nối"></span>
            )}
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg shadow-sm transition border border-purple-400/30 cursor-pointer active:scale-95"
            title="Trợ lý AI GVCN: Tin nhắn phụ huynh, nhận xét học bạ Thông tư 22 & giải pháp"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Trợ lý AI</span>
          </button>

          {/* Analytics Button */}
          <button
            onClick={onOpenAnalytics}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-lg backdrop-blur transition border border-white/20 cursor-pointer active:scale-95"
            title="Thống kê nề nếp & Bảng thi đua rèn luyện"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Thống kê</span>
          </button>

          {/* Document & Slides Button */}
          <button
            onClick={onOpenDocuments}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-lg backdrop-blur transition border border-white/20 cursor-pointer active:scale-95"
            title="Xuất Biên bản vi phạm, Báo cáo tuần & Slide Sinh hoạt lớp"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Mẫu biểu & Slide</span>
          </button>

          {/* Class Config Button */}
          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 text-white rounded-lg backdrop-blur transition border border-white/20 cursor-pointer active:scale-95"
            title="Cài đặt thông tin lớp & danh sách học sinh"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cấu hình</span>
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 active:scale-95 rounded-lg shadow-sm transition cursor-pointer"
            title="Xem nhật ký báo cáo đã gửi"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>Nhật ký</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Single HTML Export Button */}
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-emerald-500/90 hover:bg-emerald-500 active:scale-95 text-white rounded-lg shadow-sm transition border border-emerald-400/40 cursor-pointer"
            title="Tải về file HTML đơn tệp để mở offline trên máy tính hoặc điện thoại"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Tải file HTML</span>
          </button>
        </div>
      </div>
    </header>
  );
};
