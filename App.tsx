import React, { useState, useEffect } from 'react';
import { PhotoSize, Outfit, BackgroundColor, ProcessingOptions, ImageState } from './types';
import PhotoUploader from './PhotoUploader';
import { processIDPhoto, refineIDPhoto } from './geminiService';

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    processed: null,
    isProcessing: false,
    error: null,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [refinePrompt, setRefinePrompt] = useState('');
  const [options, setOptions] = useState<ProcessingOptions>({
    size: PhotoSize.SIZE_3X4,
    outfit: Outfit.WHITE_SHIRT,
    bgColor: BackgroundColor.BLUE,
    smoothSkin: true,
    removeBlemishes: true,
    whitening: true,
  });

  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) setApiKeyInput(savedKey);
  }, []);

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

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white flex flex-col relative shadow-xl border-x safe-area-top">
      {/* Navbar */}
      <header className="px-6 h-16 bg-white/80 backdrop-blur-md border-b flex items-center justify-between sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-indigo-100 shadow-lg">ID</div>
          <span className="font-black text-xs uppercase tracking-tighter text-slate-800">Photo Studio AI</span>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-40">
        {!imageState.original ? (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Chụp ảnh ngay</h2>
              <p className="text-slate-500 text-sm">Chỉ mất 5 giây để có một tấm ảnh thẻ chuẩn.</p>
            </div>
            <PhotoUploader onImageSelected={(img) => setImageState(prev => ({ ...prev, original: img }))} />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="relative mx-auto w-full max-w-[280px] aspect-[3/4] bg-slate-100 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl ring-1 ring-slate-200">
              {imageState.isProcessing && (
                <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest text-indigo-600 animate-pulse">AI đang xử lý...</p>
                </div>
              )}
              <img src={imageState.processed || imageState.original} alt="Preview" className="w-full h-full object-cover" />
            </div>

            {imageState.error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-[11px] font-bold border border-red-100 shadow-sm animate-shake">{imageState.error}</div>}

            {!imageState.processed && !imageState.isProcessing && (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khổ ảnh</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        {Object.values(PhotoSize).map(s => (
                            <button key={s} onClick={() => setOptions({...options, size: s})} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${options.size === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{s}</button>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phông nền</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        {Object.values(BackgroundColor).map(bg => (
                            <button key={bg} onClick={() => setOptions({...options, bgColor: bg})} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${options.bgColor === bg ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{bg === BackgroundColor.BLUE ? 'Xanh' : 'Trắng'}</button>
                        ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phong cách trang phục</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(Outfit).map(o => (
                      <button key={o} onClick={() => setOptions({...options, outfit: o})} className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${options.outfit === o ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-600 active:bg-slate-100'}`}>
                        <span className="text-xs font-bold">{o}</span>
                        {options.outfit === o && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {imageState.processed && !imageState.isProcessing && (
                <div className="bg-slate-50 p-4 rounded-3xl space-y-3 shadow-inner">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chỉnh sửa nâng cao</label>
                    <div className="flex gap-2">
                        <input type="text" value={refinePrompt} onChange={(e) => setRefinePrompt(e.target.value)} placeholder="VD: Làm trắng da thêm, cười lên..." className="flex-1 bg-white rounded-2xl px-4 py-3 text-xs outline-none focus:ring-2 ring-indigo-500 transition-all shadow-sm" />
                        <button onClick={handleRefine} className="bg-indigo-600 text-white p-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-indigo-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </div>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Controls */}
      {imageState.original && (
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white/80 backdrop-blur-xl border-t z-50 safe-area-bottom">
            {!imageState.processed ? (
                <button onClick={handleStart} disabled={imageState.isProcessing} className="w-full h-14 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 transition-all">
                    {imageState.isProcessing ? 'Đang gửi lệnh AI...' : 'Tạo ảnh thẻ ngay'}
                </button>
            ) : (
                <div className="flex gap-3">
                    <button onClick={() => setImageState({ original: null, processed: null, isProcessing: false, error: null })} className="flex-1 h-14 bg-slate-100 text-slate-500 font-bold rounded-3xl uppercase text-[10px] active:scale-95">Chụp lại</button>
                    <button onClick={() => {
                        const link = document.createElement('a');
                        link.href = imageState.processed!;
                        link.download = `AnhTheAI_${Date.now()}.png`;
                        link.click();
                    }} className="flex-[2] h-14 bg-indigo-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-xs active:scale-95">Tải xuống kết quả</button>
                </div>
            )}
        </footer>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900">Cài đặt API</h3>
                    <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">Để tránh lỗi hết lượt (429), hãy dùng API Key cá nhân từ <a href="https://aistudio.google.com/app/apikey" target="_blank" className="font-bold underline">Google AI Studio</a>.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gemini API Key</label>
                        <input 
                            type="password" 
                            value={apiKeyInput} 
                            onChange={(e) => setApiKeyInput(e.target.value)} 
                            placeholder="Dán mã Key tại đây..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 ring-indigo-500 transition-all" 
                        />
                    </div>
                    <button onClick={() => { localStorage.setItem('user_gemini_api_key', apiKeyInput); setShowSettings(false); }} className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Lưu cài đặt</button>
                    <button onClick={() => { localStorage.removeItem('user_gemini_api_key'); setApiKeyInput(''); alert("Đã xóa Key!"); }} className="w-full text-[10px] font-bold text-red-400 uppercase tracking-widest py-2">Xóa Key hiện tại</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;