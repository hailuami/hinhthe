import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, Outfit, BackgroundColor, PhotoSize } from "./types";

const getApiKey = () => {
  const userKey = localStorage.getItem('user_gemini_api_key');
  if (userKey && userKey.trim().length > 10) return userKey.trim();
  
  const envKey = process.env.API_KEY;
  if (envKey && envKey !== "undefined") return envKey;
  
  throw new Error("Vui lòng vào 'Cài đặt' để dán API Key của bạn.");
};

export const processIDPhoto = async (base64Image: string, options: ProcessingOptions): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  let outfitPrompt = '';
  switch (options.outfit) {
    case Outfit.VEST: outfitPrompt = "mặc áo vest đen, sơ mi trắng, thắt cà vạt chuyên nghiệp"; break;
    case Outfit.WHITE_SHIRT: outfitPrompt = "mặc áo sơ mi trắng có cổ, lịch sự"; break;
    case Outfit.AO_DAI: outfitPrompt = "mặc Áo dài truyền thống Việt Nam trang trọng"; break;
    case Outfit.SCHOOL_GIRL: outfitPrompt = "mặc đồng phục học sinh nữ (áo sơ mi trắng, nơ xanh)"; break;
    case Outfit.SCHOOL_BOY: outfitPrompt = "mặc đồng phục học sinh nam (sơ mi trắng, cà vạt)"; break;
    default: outfitPrompt = `mặc ${options.outfit}`;
  }

  const prompt = `Tạo ảnh thẻ studio chuyên nghiệp: ${outfitPrompt}, nền màu ${options.bgColor === BackgroundColor.BLUE ? 'xanh dương đậm' : 'trắng tinh'}. Khuôn mặt nhìn thẳng, ánh sáng đều, sắc nét. Chuẩn khổ ${options.size}. Trả về duy nhất 1 ảnh, không kèm chữ.`;

  return callGemini(ai, cleanBase64, prompt, options.size);
};

export const refineIDPhoto = async (base64Image: string, userRequest: string, size: PhotoSize): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;
  const prompt = `Chỉnh sửa ảnh thẻ này: "${userRequest}". Giữ nguyên bố cục ảnh thẻ. Trả về 1 ảnh duy nhất.`;
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
    throw new Error("Không nhận được dữ liệu ảnh từ AI.");
  } catch (error: any) {
    if (error.message?.includes("429")) throw new Error("Hết lượt dùng miễn phí. Hãy nhập API Key cá nhân trong Cài đặt.");
    throw error;
  }
};