import React, { useState, useEffect } from 'react';
import { PhotoSize, Outfit, BackgroundColor, ProcessingOptions, ImageState, OutfitColor } from './types';
import PhotoUploader from './components/PhotoUploader';
import { processIDPhoto, refineIDPhoto } from './services/geminiService';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, saveApiKeyToFirestore, getApiKeyFromFirestore, User, testFirestoreConnection } from './firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    processed: null,
    isProcessing: false,
    error: null,
  });

  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('GEMINI_API_KEY') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [options, setOptions] = useState<ProcessingOptions>({
    size: PhotoSize.SIZE_3X4,
    outfit: Outfit.WHITE_SHIRT,
    outfitColor: OutfitColor.DEFAULT,
    bgColor: BackgroundColor.WHITE,
    smoothSkin: true,
    removeBlemishes: true,
    whitening: true,
    strictIdentity: true,
  });

  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        const savedKey = await getApiKeyFromFirestore(currentUser.uid);
        if (savedKey) {
          setApiKey(savedKey);
          localStorage.setItem('GEMINI_API_KEY', savedKey);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('GEMINI_API_KEY', apiKey);
      if (user) {
        saveApiKeyToFirestore(user.uid, apiKey);
      }
    }
  }, [apiKey, user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setApiKey('');
      localStorage.removeItem('GEMINI_API_KEY');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleStart = async () => {
    if (!imageState.original) return;
    setImageState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await processIDPhoto(imageState.original, options);
      setImageState(prev => ({ ...prev, processed: result, isProcessing: false }));
    } catch (err: any) {
      setImageState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const handleRefine = async () => {
    if (!imageState.processed || !refinePrompt.trim()) return;
    setImageState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const result = await refineIDPhoto(imageState.processed, refinePrompt, options.size);
      setImageState(prev => ({ ...prev, processed: result, isProcessing: false }));
      setRefinePrompt('');
    } catch (err: any) {
      setImageState(prev => ({ ...prev, isProcessing: false, error: err.message }));
    }
  };

  const handleDownload = () => {
    if (!imageState.processed) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Calculate dimensions for 300 DPI
      // 3x4 cm -> 354 x 472 px
      // 4x6 cm -> 472 x 709 px
      let targetWidth, targetHeight;
      const DPI = 300;
      const CM_TO_INCH = 2.54;
      
      if (options.size === PhotoSize.SIZE_3X4) {
        // 3cm x 4cm at 300 DPI
        targetWidth = Math.round((3 / CM_TO_INCH) * DPI);
        targetHeight = Math.round((4 / CM_TO_INCH) * DPI);
      } else {
        // 4cm x 6cm at 300 DPI
        targetWidth = Math.round((4 / CM_TO_INCH) * DPI);
        targetHeight = Math.round((6 / CM_TO_INCH) * DPI);
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Object-cover logic to prevent stretching
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        let sw, sh, sx, sy;

        if (imgRatio > targetRatio) {
          // Image is wider than target
          sh = img.height;
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          // Image is taller than target
          sw = img.width;
          sh = img.width / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `AnhThe_${options.size}_${Date.now()}.png`;
        link.click();
      }
    };
    img.src = imageState.processed;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="text-left space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">✨ Gemini ID Photo</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">AI Studio Pro • v2.0</p>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản</span>
                <span className="text-xs font-bold text-slate-200">{user.email}</span>
              </div>
              <img src={user.photoURL || ''} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10" />
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all"
              >
                Thoát
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Đăng nhập Google
            </button>
          )}
          <button 
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 glass-panel rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
          {/* Section 0: API Key */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">0. CÀI ĐẶT GEMINI API (MIỄN PHÍ)</label>
            <div className="relative">
              <input 
                type="text" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Dán API Key của bạn tại đây..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-purple-500 transition-all"
              />
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-400 hover:text-purple-300"
              >
                Lấy Key?
              </a>
            </div>
          </div>

          {/* Section 1: Ảnh Gốc */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. ẢNH GỐC</label>
            <PhotoUploader onImageSelected={(img) => setImageState(prev => ({ ...prev, original: img, processed: null }))} />
          </div>

          {/* Section 2: Màu Nền */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. CHỌN MÀU NỀN</label>
            <div className="flex gap-4">
              {[
                { color: BackgroundColor.DARK_BLUE, class: 'bg-blue-700' },
                { color: BackgroundColor.WHITE, class: 'bg-white' },
                { color: BackgroundColor.LIGHT_BLUE, class: 'bg-sky-300' }
              ].map((bg) => (
                <button 
                  key={bg.color}
                  onClick={() => setOptions({...options, bgColor: bg.color})}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${options.bgColor === bg.color ? 'border-purple-500 scale-110 ring-4 ring-purple-500/20' : 'border-transparent'} ${bg.class}`}
                />
              ))}
              <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-transparent opacity-50 cursor-not-allowed" title="Sắp ra mắt" />
            </div>
          </div>

          {/* Section 3: Trang Phục */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">3. CHỌN TRANG PHỤC & MÀU SẮC</label>
            <div className="space-y-3">
              <select 
                value={options.outfit}
                onChange={(e) => setOptions({...options, outfit: e.target.value as Outfit})}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none appearance-none cursor-pointer"
              >
                {Object.values(Outfit).map(o => (
                  <option key={o} value={o} className="bg-[#1a1625]">{o}</option>
                ))}
              </select>

              {options.outfit !== Outfit.ORIGINAL && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.values(OutfitColor).map((color) => (
                    <button
                      key={color}
                      onClick={() => setOptions({...options, outfitColor: color})}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                        options.outfitColor === color 
                          ? 'bg-purple-600 border-purple-400 text-white' 
                          : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Kích Thước */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">4. KÍCH THƯỚC ẢNH</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(PhotoSize).map((size) => (
                <button
                  key={size}
                  onClick={() => setOptions({...options, size})}
                  className={`py-3 rounded-xl text-xs font-black transition-all border ${
                    options.size === size 
                      ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                      : 'bg-black/20 border-white/5 text-slate-500'
                  }`}
                >
                  {size === PhotoSize.SIZE_3X4 ? '3cm x 4cm' : '4cm x 6cm'}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Làm Đẹp */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">5. LÀM ĐẸP & GIỮ NHÂN DẠNG</label>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-purple-400 uppercase tracking-tight">Giữ khuôn mặt gốc</span>
                  <span className="text-[9px] text-slate-500">Ưu tiên giống 100% ảnh gốc</span>
                </div>
                <button 
                  onClick={() => setOptions({...options, strictIdentity: !options.strictIdentity})}
                  className={`w-10 h-5 rounded-full transition-colors relative ${options.strictIdentity ? 'bg-purple-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${options.strictIdentity ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">Ánh sáng & Làm mịn da</span>
                <button 
                  onClick={() => setOptions({...options, smoothSkin: !options.smoothSkin})}
                  className={`w-10 h-5 rounded-full transition-colors relative ${options.smoothSkin ? 'bg-purple-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${options.smoothSkin ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">Tự động xóa mụn, khuyết điểm</span>
                <button 
                  onClick={() => setOptions({...options, removeBlemishes: !options.removeBlemishes})}
                  className={`w-10 h-5 rounded-full transition-colors relative ${options.removeBlemishes ? 'bg-purple-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${options.removeBlemishes ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">Làm sáng da tự nhiên</span>
                <button 
                  onClick={() => setOptions({...options, whitening: !options.whitening})}
                  className={`w-10 h-5 rounded-full transition-colors relative ${options.whitening ? 'bg-purple-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${options.whitening ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleStart} 
            disabled={!imageState.original || imageState.isProcessing}
            className="w-full h-16 btn-primary-gradient rounded-3xl text-sm font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {imageState.isProcessing ? 'Đang xử lý...' : 'Bắt đầu tạo ảnh'}
          </button>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          {/* Photos Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="glass-panel p-6 rounded-[2.5rem] space-y-4 flex flex-col items-center">
              <div className="w-full flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Ảnh Gốc</span>
              </div>
              <div className="relative w-full aspect-[3/4] bg-black/20 rounded-3xl overflow-hidden border border-white/5">
                {imageState.original ? (
                  <img src={imageState.original} alt="Original" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs italic">Chưa có ảnh</div>
                )}
              </div>
            </div>

            {/* Processed */}
            <div className="glass-panel p-6 rounded-[2.5rem] space-y-4 flex flex-col items-center relative">
              <div className="w-full flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Ảnh Kết Quả AI</span>
                  <span className="text-[9px] font-bold text-purple-400">
                    {options.size === PhotoSize.SIZE_3X4 ? '3x4 cm (354x472 px)' : '4x6 cm (472x709 px)'} @ 300 DPI
                  </span>
                </div>
                <span className="bg-orange-500 text-[8px] font-black px-2 py-0.5 rounded-full text-white uppercase">PRO</span>
              </div>
              <div className="relative w-full aspect-[3/4] bg-black/20 rounded-3xl overflow-hidden border border-white/5">
                {imageState.isProcessing && (
                  <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 animate-pulse">AI đang làm việc...</p>
                  </div>
                )}
                {imageState.processed ? (
                  <img src={imageState.processed} alt="Processed" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs italic">Kết quả sẽ hiện ở đây</div>
                )}
              </div>
              {imageState.processed && (
                <button 
                  onClick={handleDownload}
                  className="absolute bottom-6 right-6 px-4 py-3 bg-white text-black hover:bg-slate-200 backdrop-blur-md rounded-2xl flex items-center gap-2 shadow-2xl transition-all active:scale-95 group"
                  title="Tải xuống ảnh chuẩn 300 DPI"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Tải ảnh chuẩn</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Evaluation */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Đánh giá từ Gemini AI</h3>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed space-y-2">
              <p>Chào bạn,</p>
              <p>{imageState.original ? 'Bức ảnh gốc đã được tải lên. ' : 'Vui lòng tải ảnh gốc lên để bắt đầu.'}</p>
              {options.strictIdentity && <p className="text-purple-400 font-bold">✨ Chế độ "Giữ khuôn mặt gốc" đang bật. AI sẽ cố gắng bảo toàn 100% diện mạo của bạn.</p>}
            </div>
          </div>

          {/* Refine Section */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">YÊU CẦU CHỈNH SỬA THÊM VỚI GEMINI</h3>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="VD: Hãy làm cho tóc gọn gàng hơn..."
                className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-xs text-slate-300 outline-none focus:border-purple-500 transition-all"
              />
              <button 
                onClick={handleRefine}
                disabled={!imageState.processed || imageState.isProcessing}
                className="px-6 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="text-[10px] font-black uppercase tracking-widest mr-2">Gửi</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Error Toast */}
      {imageState.error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-4">
          {imageState.error}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSettings(false)} />
          <div className="relative glass-panel w-full max-w-md p-8 rounded-[2.5rem] space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black tracking-tight">Cài đặt hệ thống</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Model AI</label>
                <div className="p-4 bg-black/30 border border-white/10 rounded-2xl text-xs text-slate-300">
                  Gemini 2.5 Flash Image (Experimental)
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Độ phân giải xuất file</label>
                <div className="p-4 bg-black/30 border border-white/10 rounded-2xl text-xs text-slate-300">
                  300 DPI (Chuẩn in ấn)
                </div>
              </div>
              <div className="pt-4">
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  * Ứng dụng này sử dụng Gemini API miễn phí. Vui lòng không chia sẻ API Key của bạn với bất kỳ ai.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full py-4 btn-primary-gradient rounded-2xl text-xs font-black uppercase tracking-widest"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">© 2026 Gemini ID Photo Studio • Made with ✨</p>
        <div className="flex gap-6">
          <a href="#" className="text-[10px] font-bold text-slate-600 hover:text-purple-400 uppercase tracking-widest transition-colors">Điều khoản</a>
          <a href="#" className="text-[10px] font-bold text-slate-600 hover:text-purple-400 uppercase tracking-widest transition-colors">Bảo mật</a>
          <a href="#" className="text-[10px] font-bold text-slate-600 hover:text-purple-400 uppercase tracking-widest transition-colors">Liên hệ</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
