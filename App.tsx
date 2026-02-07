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

  const saveApiKey = () => {
    localStorage.setItem('user_gemini_api_key', apiKeyInput);
    setShowSettings(false);
    alert("Đã lưu API Key!");
  };

  const handleStartProcessing = async () => {
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
    <div className="min-h-screen max-w-md mx-auto bg-white flex flex-col relative shadow-2xl border-x safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="px-6 h-16 bg-white border-b flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">ID</div>
          <span className="font-black text-sm uppercase tracking-tighter text-slate-800">Photo Studio AI</span>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            {imageState.original && (
                <button onClick={() => setImageState({ original: null, processed: null, isProcessing: false, error: null })} className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-full">Hủy</button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-48">
        {!imageState.original ? (
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tạo ảnh thẻ</h2>
                <p className="text-slate-500 text-sm">Chụp hoặc tải ảnh để bắt đầu ngay.</p>
             </div>
             <PhotoUploader onImageSelected={(img) => setImageState(prev => ({ ...prev, original: img }))} />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="relative mx-auto w-full max-w-[260px] aspect-[3/4] bg-slate-100 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl ring-1 ring-slate-200">
              {imageState.isProcessing && (
                <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-black text-[10px] uppercase tracking-widest text-indigo-600">AI đang xử lý...</p>
                </div>
              )}
              <img src={imageState.processed || imageState.original} alt="Preview" className="w-full h-full object-cover" />
            </div>

            {imageState.error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-[11px] font-bold border border-red-100">{imageState.error}</div>}

            {!imageState.processed && !imageState.isProcessing && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khổ ảnh</label>
                        <select 
                            value={options.size} 
                            onChange={(e) => setOptions({...options, size: e.target.value as PhotoSize})}
                            className="w-full bg-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none border-none"
                        >
                            {Object.values(PhotoSize).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nền</label>
                        <select 
                            value={options.bgColor} 
                            onChange={(e) => setOptions({...options, bgColor: e.target.value as BackgroundColor})}
                            className="w-full bg-slate-100 rounded-2xl px-4 py-3 text-sm font-bold outline-none border-none"
                        >
                            {Object.values(BackgroundColor).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trang phục</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(Outfit).map(o => (
                      <button 
                        key={o} 
                        onClick={() => setOptions(prev => ({ ...prev, outfit: o }))} 
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${options.outfit === o ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-600'}`}
                      >
                        <span className="text-xs font-bold">{o}</span>
                        {options.outfit === o && <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {imageState.processed && !imageState.isProcessing && (
                <div className="flex gap-2">
                    <input type="text" value={refinePrompt} onChange={(e) => setRefinePrompt(e.target.value)} placeholder="Yêu cầu chỉnh sửa thêm..." className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-xs outline-none focus:ring-2 ring-indigo-500 transition-all" />
                    <button onClick={handleRefine} className="bg-indigo-600 text-white p-4 rounded-2xl active:scale-95 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Button */}
      {imageState.original && (
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white border-t z-50">
            {!imageState.processed ? (
                <button onClick={handleStartProcessing} disabled={imageState.isProcessing} className="w-full h-14 bg-indigo-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 transition-all">
                    {imageState.isProcessing ? 'Đang tạo ảnh...' : 'Bắt đầu tạo ảnh thẻ'}
                </button>
            ) : (
                <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = imageState.processed!;
                    link.download = `AnhTheAI_${Date.now()}.png`;
                    link.click();
                }} className="w-full h-14 bg-green-600 text-white font-black rounded-3xl shadow-xl uppercase tracking-widest text-xs active:scale-95">Tải xuống ảnh</button>
            )}
        </footer>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900">Cài đặt API Key</h3>
                    <button onClick={() => setShowSettings(false)} className="text-slate-400 font-bold">Đóng</button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Nếu bạn gặp lỗi 429 (Hết lượt dùng), hãy tạo Key cá nhân tại <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-indigo-600 font-bold underline">Google AI Studio</a> và dán vào đây.</p>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Gemini API Key</label>
                    <input 
                        type="password" 
                        value={apiKeyInput} 
                        onChange={(e) => setApiKeyInput(e.target.value)} 
                        placeholder="Dán mã API Key của bạn..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 ring-indigo-500" 
                    />
                </div>
                <button onClick={saveApiKey} className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Lưu cài đặt</button>
                <button onClick={() => { localStorage.removeItem('user_gemini_api_key'); setApiKeyInput(''); alert("Đã xóa Key!"); }} className="w-full text-[10px] font-bold text-red-400 uppercase tracking-widest">Xóa Key hiện tại</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;