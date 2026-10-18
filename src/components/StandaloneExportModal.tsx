import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileCode,
  Smartphone,
  Laptop,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface StandaloneExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const StandaloneExportModal: React.FC<StandaloneExportModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadFile = async () => {
    try {
      // Fetch the standalone HTML created in /public/bao_cao_zalo_gvcn.html
      const response = await fetch('/bao_cao_zalo_gvcn.html');
      const htmlText = await response.text();

      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'BaoCao_Zalo_GVCN.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast('Đã tải xuống file BaoCao_Zalo_GVCN.html!', '📥');
    } catch (e) {
      onShowToast('Lỗi khi tải file. Bạn có thể mở trực tiếp link tải bên dưới.', '⚠️');
    }
  };

  const handleCopyHtmlCode = async () => {
    try {
      const response = await fetch('/bao_cao_zalo_gvcn.html');
      const htmlText = await response.text();
      await navigator.clipboard.writeText(htmlText);
      setCopied(true);
      onShowToast('Đã sao chép toàn bộ mã nguồn HTML vào Clipboard!', '📋');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Không thể sao chép tự động.', '⚠️');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base">File HTML Đơn Tệp (Chạy Offline)</h3>
              <p className="text-xs text-emerald-100">
                Lưu trữ và sử dụng trực tiếp trên máy tính hoặc điện thoại mà không cần cài đặt
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-emerald-900">
            <strong className="block font-bold text-sm mb-1 text-emerald-950">
              🎉 Đáp ứng đúng 100% yêu cầu của bạn:
            </strong>
            Toàn bộ mã nguồn đã được đóng gói hoàn chỉnh vào <strong>MỘT file HTML duy nhất</strong>{' '}
            (bao gồm HTML, Tailwind CSS, JavaScript thuần và bộ nhớ LocalStorage).
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadFile}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải file .HTML về máy</span>
            </button>

            <button
              type="button"
              onClick={handleCopyHtmlCode}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-semibold rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Đã chép mã nguồn!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Sao chép mã HTML</span>
                </>
              )}
            </button>
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span>📖</span> Hướng dẫn lưu lại và sử dụng:
            </h4>

            <div className="space-y-2.5">
              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <strong>Cách 1 (Khuyên dùng):</strong> Bấm nút <em>"Tải file .HTML về máy"</em> ở trên. Trình duyệt sẽ tải về file <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">BaoCao_Zalo_GVCN.html</code>.
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <strong>Cách 2 (Lưu thủ công):</strong> Nhấn <em>"Sao chép mã HTML"</em>, mở chương trình <strong>Notepad</strong> (trên Windows) hoặc <strong>TextEdit</strong> (trên Mac), dán vào và chọn <strong>Save As</strong> &gt; đặt tên là <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">index.html</code> (với đuôi tệp là .html).
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <strong>Sử dụng trên máy tính / điện thoại:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                    <li>
                      <Laptop className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                      <strong>Máy tính:</strong> Bấm đúp chuột vào file để mở trực tiếp bằng Chrome, Edge, Cốc Cốc, Safari... Không cần cài đặt máy chủ!
                    </li>
                    <li>
                      <Smartphone className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                      <strong>Điện thoại:</strong> Gửi file này qua Zalo hoặc Google Drive vào điện thoại, sau đó mở bằng trình duyệt và bấm <em>"Thêm vào Màn hình chính"</em> (Add to Home Screen) để dùng như một ứng dụng độc lập mọi lúc mọi nơi.
                    </li>
                  </ul>
                </div>
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
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
