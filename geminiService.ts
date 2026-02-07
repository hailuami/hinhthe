import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, Outfit, BackgroundColor, PhotoSize } from "./types";

const getApiKey = () => {
  // Ưu tiên 1: Key người dùng tự nhập lưu trong localStorage
  const userKey = localStorage.getItem('user_gemini_api_key');
  if (userKey && userKey.trim().length > 10) {
    return userKey.trim();
  }
  
  // Ưu tiên 2: Key từ biến môi trường (Vercel)
  const envKey = process.env.API_KEY;
  if (envKey && envKey !== "undefined") {
    return envKey;
  }
  
  throw new Error("Vui lòng vào phần Cài đặt để nhập API Key của bạn.");
};

export const processIDPhoto = async (base64Image: string, options: ProcessingOptions): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  let outfitDetail = '';
  switch (options.outfit) {
    case Outfit.VEST:
      outfitDetail = `mặc bộ đồ vest chuyên nghiệp, sơ mi trắng, thắt cà vạt.`;
      break;
    case Outfit.WHITE_SHIRT:
      outfitDetail = `mặc áo sơ mi trắng có cổ ngay ngắn.`;
      break;
    case Outfit.AO_DAI:
      outfitDetail = `mặc Áo Dài truyền thống Việt Nam.`;
      break;
    case Outfit.SCHOOL_GIRL:
      outfitDetail = `mặc đồng phục nữ sinh Việt Nam (áo trắng thắt nơ).`;
      break;
    case Outfit.SCHOOL_BOY:
      outfitDetail = `mặc đồng phục nam sinh Việt Nam (sơ mi trắng có phù hiệu).`;
      break;
    default:
      outfitDetail = `mặc trang phục ${options.outfit}`;
  }

  const prompt = `Tạo ảnh thẻ ID chuyên nghiệp: ${outfitDetail}, phông nền màu ${options.bgColor === BackgroundColor.BLUE ? 'Xanh dương' : 'Trắng'}. Khuôn mặt nhìn thẳng, ánh sáng studio đều. Chuẩn khổ ${options.size}. Trả về duy nhất ảnh kết quả, không có chữ.`;

  return callGemini(ai, cleanBase64, prompt, options.size);
};

export const refineIDPhoto = async (base64Image: string, userRequest: string, size: PhotoSize): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;
  const prompt = `Chỉnh sửa ảnh thẻ theo yêu cầu: "${userRequest}". Trả về duy nhất ảnh kết quả.`;
  return callGemini(ai, cleanBase64, prompt, size);
};

const callGemini = async (ai: any, base64Data: string, prompt: string, size: PhotoSize): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: size === PhotoSize.SIZE_3X4 ? "3:4" : "4:3"
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    
    throw new Error("AI không trả về ảnh. Có thể prompt bị từ chối.");
  } catch (error: any) {
    if (error.message?.includes("429")) {
      throw new Error("Hết lượt dùng miễn phí. Hãy nhập API Key cá nhân trong phần Cài đặt.");
    }
    throw error;
  }
};