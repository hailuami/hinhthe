import { GoogleGenAI } from "@google/genai";
import { ProcessingOptions, Outfit, BackgroundColor, PhotoSize, OutfitColor } from "../types";

const getApiKey = () => {
  // Ưu tiên lấy key từ localStorage nếu người dùng đã nhập trong giao diện
  const userKey = localStorage.getItem('GEMINI_API_KEY');
  if (userKey && userKey.trim().length > 10) {
    return userKey;
  }

  const envKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== "undefined") {
    return envKey;
  }
  throw new Error("Vui lòng nhập Gemini API Key trong phần cài đặt để bắt đầu.");
};

export const processIDPhoto = async (base64Image: string, options: ProcessingOptions): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  let outfitDetail = '';
  const colorStr = options.outfitColor !== OutfitColor.DEFAULT ? `màu ${options.outfitColor}` : '';

  switch (options.outfit) {
    case Outfit.ORIGINAL:
      outfitDetail = `giữ nguyên trang phục gốc của người trong ảnh.`;
      break;
    case Outfit.VEST:
      outfitDetail = `mặc bộ đồ vest chuyên nghiệp ${colorStr}, sơ mi trắng bên trong, thắt cà vạt.`;
      break;
    case Outfit.WHITE_SHIRT:
      outfitDetail = `mặc áo sơ mi trắng có cổ ngay ngắn.`;
      break;
    case Outfit.AO_DAI:
      outfitDetail = `mặc Áo Dài truyền thống Việt Nam ${colorStr} trang trọng.`;
      break;
    case Outfit.MILITARY:
      outfitDetail = `mặc quân phục quân đội Việt Nam chính quy, màu xanh lá cây đặc trưng, có cầu vai và phù hiệu trang trọng.`;
      break;
    case Outfit.POLICE:
      outfitDetail = `mặc sắc phục công an Việt Nam chính quy, màu xanh cỏ úa hoặc xanh lá mạ, có cầu vai và phù hiệu trang trọng.`;
      break;
    default:
      outfitDetail = `mặc trang phục ${options.outfit} ${colorStr}`;
  }

  let bgDetail = '';
  switch (options.bgColor) {
    case BackgroundColor.DARK_BLUE:
      bgDetail = 'phông nền màu Xanh dương đậm (Deep/Dark Blue) chuẩn ảnh thẻ, màu sắc trang trọng và đậm nét, không được là màu xanh nhạt hay xanh da trời';
      break;
    case BackgroundColor.LIGHT_BLUE:
      bgDetail = 'phông nền màu Xanh dương nhạt (Light/Pastel Blue), tươi sáng và nhẹ nhàng';
      break;
    case BackgroundColor.WHITE:
      bgDetail = 'phông nền màu Trắng tinh khiết (Pure White)';
      break;
  }

  let beautyDetail = '';
  if (options.smoothSkin || options.removeBlemishes || options.whitening) {
    const enhancements = [];
    if (options.smoothSkin) enhancements.push("làm mịn da tự nhiên");
    if (options.removeBlemishes) enhancements.push("xóa các khuyết điểm nhỏ trên da");
    if (options.whitening) enhancements.push("làm sáng da nhẹ nhàng");
    beautyDetail = `Thực hiện các bước làm đẹp: ${enhancements.join(", ")}. `;
  } else {
    beautyDetail = "TUYỆT ĐỐI GIỮ NGUYÊN diện mạo và làn da gốc, không thực hiện bất kỳ bước làm mịn hay chỉnh sửa khuôn mặt nào. ";
  }

  let identityDetail = '';
  if (options.strictIdentity) {
    identityDetail = `YÊU CẦU TỐI THƯỢNG: Phải giữ nguyên 100% các đường nét khuôn mặt, ánh mắt, khuôn miệng và cấu trúc xương mặt của người trong ảnh gốc. Tuyệt đối không được "làm đẹp" hay thay đổi bất kỳ chi tiết nào trên khuôn mặt. Ảnh kết quả phải trông giống hệt người thật trong ảnh gốc, chỉ thay đổi trang phục và phông nền. `;
  } else {
    identityDetail = `Giữ nguyên diện mạo, các đường nét khuôn mặt và đặc điểm nhận dạng của người trong ảnh. `;
  }

  const prompt = `Bạn là chuyên gia xử lý ảnh thẻ chuyên nghiệp. ${identityDetail}Hãy chuyển ảnh này thành ảnh ID chuẩn: tự động cắt ảnh lấy từ phần ngực trở lên (head and shoulders shot), ${outfitDetail}, ${bgDetail}. ${beautyDetail}Khuôn mặt nhìn thẳng, ánh sáng studio đồng đều, không bóng đổ. Trả về duy nhất ảnh kết quả chất lượng cao, không có bất kỳ chữ hay ký hiệu nào khác.`;

  return callGemini(ai, cleanBase64, prompt, options.size);
};

export const refineIDPhoto = async (base64Image: string, userRequest: string, size: PhotoSize): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const cleanBase64 = base64Image.split(',')[1] || base64Image;
  const prompt = `Dựa trên ảnh thẻ này, hãy chỉnh sửa thêm: "${userRequest}". QUAN TRỌNG: Giữ nguyên diện mạo gốc. Trả về duy nhất ảnh kết quả.`;
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
          aspectRatio: "3:4" // Gemini handles 3:4 best for portraits, we will crop to exact size on client
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    
    throw new Error("AI không trả về ảnh. Có thể do ảnh gốc không rõ mặt.");
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error("Lỗi AI: " + error.message);
  }
};
