import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ExternalLink,
  Check,
  Cpu,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  GEMINI_MODELS,
  getStoredApiKey,
  saveStoredApiKey,
  getStoredModel,
  saveStoredModel,
} from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, icon?: string) => void;
  onApiKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onApiKeySaved,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSelectedModel(getStoredModel());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      onShowToast('Vui lòng nhập API Key để lưu!', '⚠️');
      return;
    }

    saveStoredApiKey(cleanKey);
    saveStoredModel(selectedModel);
    onShowToast('Đã lưu API Key & cấu hình Model AI thành công!', '✅');
    if (onApiKeySaved) onApiKeySaved();
    onClose();
  };

  const handleClearKey = () => {
    saveStoredApiKey('');
    setApiKey('');
    onShowToast('Đã xóa API Key khỏi trình duyệt!', '🗑️');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Thiết Lập Model & Gemini API Key
              </h3>
              <p className="text-xs text-blue-100">
                Sử dụng AI cho trợ lý nề nếp, lời phê học bạ & nhắn tin phụ huynh
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
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Guide Banner */}
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-950 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-amber-900">
                Chưa có Google Gemini API Key?
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Khóa API hoàn toàn miễn phí từ Google AI Studio. Bấm vào liên kết bên dưới để lấy key miễn phí trong 1 phút:
              </p>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 underline mt-1 text-xs"
              >
                <span>👉 https://aistudio.google.com/api-keys</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 text-xs">
              Gemini API Key <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán mã AIzaSy... vào đây"
                className="w-full px-3.5 py-2.5 pr-20 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition"
                  title={showKey ? 'Ẩn key' : 'Hiện key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              API Key được lưu trữ an toàn trong trình duyệt (LocalStorage) của bạn, không gửi qua máy chủ trung gian.
            </p>
          </div>

          {/* Model Cards Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" />
                Chọn Model AI (Tự động Fallback khi lỗi/hết quota)
              </label>
              <span className="text-[11px] text-slate-500">Thứ tự ưu tiên</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {GEMINI_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {model.name}
                        </span>
                        {model.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            Khuyên dùng
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                          {model.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{model.tag}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              ℹ️ Nếu model được chọn gặp lỗi hoặc quá tải (429 RESOURCE_EXHAUSTED), hệ thống sẽ tự động chuyển sang model tiếp theo trong danh sách.
            </p>
          </div>

          {/* Footer Action buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClearKey}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition"
              >
                Xóa Key này
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu cấu hình</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
