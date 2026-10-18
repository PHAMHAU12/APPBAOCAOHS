export const GEMINI_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    tag: 'Mặc định - Nhanh & Tối ưu',
    badge: 'Default',
    isDefault: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    tag: 'Suy luận chuyên sâu - Phân tích kỹ',
    badge: 'Pro',
    isDefault: false,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Dự phòng ổn định cao',
    badge: 'Fallback',
    isDefault: false,
  },
];

export const STORAGE_KEY_API_KEY = 'gemini_api_key';
export const STORAGE_KEY_SELECTED_MODEL = 'gemini_selected_model';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } catch (e) {
    console.error('Cannot save API key', e);
  }
}

export function getStoredModel(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_SELECTED_MODEL) || 'gemini-3-flash-preview';
  } catch {
    return 'gemini-3-flash-preview';
  }
}

export function saveStoredModel(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED_MODEL, modelId);
  } catch (e) {
    console.error('Cannot save selected model', e);
  }
}

export interface CallAiOptions {
  onModelAttempt?: (modelId: string, attemptIndex: number) => void;
}

/**
 * Gọi Gemini API với cơ chế Retry & Fallback qua các model
 * Thứ tự thử: Model đang chọn -> các model còn lại trong danh sách
 */
export async function callGeminiWithFallback(
  prompt: string,
  options?: CallAiOptions
): Promise<{ text: string; usedModel: string }> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('CHƯA_CÓ_API_KEY: Vui lòng nhập Gemini API Key để sử dụng tính năng này.');
  }

  const selectedModel = getStoredModel();
  // Build fallback queue starting with selectedModel then remaining models
  const modelQueue = [
    selectedModel,
    ...GEMINI_MODELS.map((m) => m.id).filter((id) => id !== selectedModel),
  ];

  let lastError = '';

  for (let i = 0; i < modelQueue.length; i++) {
    const model = modelQueue[i];
    if (options?.onModelAttempt) {
      options.onModelAttempt(model, i + 1);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) {
            errMessage = `${errData.error.status || response.status}: ${errData.error.message}`;
          }
        } catch {
          // ignore json parse error
        }
        lastError = `[Model ${model}] ${errMessage}`;
        console.warn(`Lỗi khi gọi model ${model}:`, errMessage);
        // Fallback to next model
        continue;
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        lastError = `[Model ${model}] API không trả về nội dung text`;
        continue;
      }

      return {
        text,
        usedModel: model,
      };
    } catch (e: any) {
      lastError = `[Model ${model}] ${e?.message || 'Lỗi mạng kết nối tới Gemini'}`;
      console.warn(`Lỗi kết nối model ${model}:`, e);
    }
  }

  // All models failed
  throw new Error(`Tất cả các model Gemini đều thất bại: ${lastError}`);
}

/**
 * 1. AI Soạn tin nhắn gửi Phụ huynh học sinh
 */
export async function aiGenerateParentMessage(params: {
  studentName: string;
  studentStt: number;
  reportType: 'ABSENT' | 'VIOLATION' | 'COMMENDATION';
  specificDetails: string;
  dateStr: string;
  teacherName: string;
  className: string;
  schoolName: string;
}): Promise<{ text: string; usedModel: string }> {
  const typeMap = {
    ABSENT: 'Vắng học / Nghỉ học',
    VIOLATION: 'Vi phạm nội quy nề nếp',
    COMMENDATION: 'Tuyên dương / Khen ngợi thành tích',
  };

  const prompt = `Bạn là một Giáo viên Chủ nhiệm mẫu mực, tâm huyết và tinh tế tại trường ${
    params.schoolName || 'Việt Nam'
  }.
Hãy viết một tin nhắn Zalo gửi riêng cho Phụ huynh của học sinh:
- Tên học sinh: ${params.studentName} (STT: ${params.studentStt})
- Lớp: ${params.className}
- Giáo viên chủ nhiệm: ${params.teacherName}
- Ngày xảy ra sự việc: ${params.dateStr}
- Phân loại: ${typeMap[params.reportType]}
- Chi tiết ghi nhận: ${params.specificDetails}

Yêu cầu về văn phong và cấu trúc:
1. Mở đầu bằng lời chào kính trọng, lịch sự tới Quý Phụ huynh.
2. Thông báo rõ ràng, chính xác sự việc của em ${params.studentName} vào ngày ${params.dateStr}.
3. Lời lẽ sư phạm, đồng cảm, mang tính xây dựng, phối hợp giáo dục giữa gia đình và nhà trường (tuyệt đối không chỉ trích gay gắt khiến phụ huynh tự ái).
4. Nếu là tuyên dương: Hãy bày tỏ sự tự hào, khen ngợi cụ thể và chúc mừng phụ huynh.
5. Nếu là vi phạm hoặc vắng: Đề nghị phụ huynh cùng phối hợp nhắc nhở, hỏi thăm tình hình sức khỏe/tâm lý của em.
6. Lời kết ấm áp, cung cấp thông tin liên hệ của GVCN và trân trọng cảm ơn.
7. Thêm các icon Zalo sinh động phù hợp để tin nhắn thân thiện và dễ đọc.`;

  return callGeminiWithFallback(prompt);
}

/**
 * 2. AI Soạn lời phê nhận xét học bạ / đánh giá rèn luyện theo Thông tư 22/58
 */
export async function aiGenerateConductEvaluation(params: {
  studentName: string;
  studentStt: number;
  className: string;
  absentCount: number;
  violationCount: number;
  commendationCount: number;
  violationsList: string[];
  commendationsList: string[];
}): Promise<{ text: string; usedModel: string }> {
  const prompt = `Bạn là Giáo viên Chủ nhiệm chuyên nghiệp, am hiểu sâu sắc quy chế đánh giá học sinh theo Thông tư 22/2021/TT-BGDĐT và Thông tư 58/2011/TT-BGDĐT của Bộ Giáo dục & Đào tạo Việt Nam.
Hãy viết bản Đánh giá Rèn luyện & Lời phê học bạ cho học sinh:
- Họ và tên: ${params.studentName} (STT: ${params.studentStt}, Lớp: ${params.className})
- Tình hình chuyên cần: Vắng tổng cộng ${params.absentCount} buổi
- Tình hình vi phạm: ${params.violationCount} lần ghi nhận
  (Chi tiết: ${params.violationsList.join(', ') || 'Không có vi phạm'})
- Thành tích & Tuyên dương: ${params.commendationCount} lần
  (Chi tiết: ${params.commendationsList.join(', ') || 'Chưa có ghi nhận đặc biệt'})

Yêu cầu xuất ra định dạng rõ ràng gồm 3 phần:
1. **Mức rèn luyện dự kiến đề xuất:** (Tốt / Khá / Đạt / Chưa đạt) kèm căn cứ ngắn gọn.
2. **Lời phê học bạ (Chuẩn văn phong Thông tư Bộ GD&ĐT):** Tối đa 3 - 4 câu cô đọng, nêu rõ phẩm chất ưu điểm, điểm cần cố gắng và định hướng phấn đấu.
3. **Lời khuyên riêng từ GVCN:** Lời dặn dò chân thành gửi riêng cho học sinh để em tiến bộ hơn.`;

  return callGeminiWithFallback(prompt);
}

/**
 * 3. AI Phân tích nề nếp tổng thể lớp & Đề xuất giải pháp sư phạm
 */
export async function aiAnalyzeClassTrends(params: {
  className: string;
  schoolName: string;
  totalReports: number;
  absentCount: number;
  violationCount: number;
  commendationCount: number;
  topViolations: { tag: string; count: number }[];
  repeatOffenders: { name: string; count: number }[];
  starStudents: { name: string; count: number }[];
}): Promise<{ text: string; usedModel: string }> {
  const prompt = `Bạn là chuyên gia tư vấn giáo dục và quản lý lớp học.
Dưới đây là số liệu thống kê nề nếp của lớp ${params.className} - Trường ${params.schoolName}:
- Tổng số lượt báo cáo ghi nhận: ${params.totalReports}
- Lượt vắng học: ${params.absentCount}
- Lượt vi phạm kỷ luật: ${params.violationCount}
- Lượt được tuyên dương: ${params.commendationCount}
- Các lỗi vi phạm phổ biến nhất: ${params.topViolations
    .map((v) => `${v.tag} (${v.count} lượt)`)
    .join(', ') || 'Ít vi phạm'}
- Học sinh cần quan tâm đặc biệt (vi phạm nhiều lần): ${params.repeatOffenders
    .map((s) => `${s.name} (${s.count} lần)`)
    .join(', ') || 'Không có'}
- Học sinh tiêu biểu (tuyên dương nhiều nhất): ${params.starStudents
    .map((s) => `${s.name} (${s.count} lần)`)
    .join(', ') || 'Không có'}

Hãy lập bản BÁO CÁO PHÂN TÍCH TÌNH HÌNH NỀ NẾP & ĐỀ XUẤT GIẢI PHÁP SƯ PHẠM cho GVCN:
1. **Đánh giá tổng quan:** Điểm mạnh nổi bật và điểm yếu cần chấn chỉnh của tập thể lớp.
2. **Nguyên nhân tiềm ẩn:** Phân tích vì sao các lỗi trên lại xảy ra nhiều (do thói quen, bài giảng, sinh lý lứa tuổi, kỷ luật lỏng lẻo...).
3. **Kế hoạch hành động cụ thể cho GVCN:**
   - Biện pháp cho tiết Sinh hoạt lớp cuối tuần.
   - Kế hoạch phối hợp với Ban cán sự và Đội Cờ đỏ.
   - Cách tiếp cận riêng với nhóm học sinh cá biệt (kèm cặp, động viên thay vì chỉ phạt).
4. **Định hướng phong trào thi đua tuần tới.**`;

  return callGeminiWithFallback(prompt);
}
