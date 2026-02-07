import React, { useRef, useState, useEffect } from 'react';

interface PhotoUploaderProps {
  onImageSelected: (base64: string) => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ onImageSelected }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = async () => {
    try {
      if (stream) stream.getTracks().forEach(track => track.stop());
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, 
        audio: false 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      alert("Không thể mở Camera. Vui lòng cấp quyền trong cài đặt trình duyệt hoặc Android.");
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        onImageSelected(canvas.toDataURL('image/jpeg', 0.9));
        if (stream) stream.getTracks().forEach(t => t.stop());
        setIsCameraOpen(false);
      }
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <button onClick={openCamera} className="group relative overflow-hidden bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl active:scale-95 transition-all">
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <span className="font-black text-sm uppercase tracking-widest">Chụp ảnh mới</span>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-4 p-6 bg-white border-2 border-slate-100 rounded-[2rem] text-slate-600 active:bg-slate-50 transition-all">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
           <span className="font-bold text-xs uppercase tracking-wider">Chọn ảnh từ máy</span>
        </button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center">
            <div className="w-full max-w-md h-full relative flex flex-col">
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                    <button onClick={() => { if(stream) stream.getTracks().forEach(t=>t.stop()); setIsCameraOpen(false); }} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <span className="text-white/60 font-black text-[10px] uppercase tracking-[0.3em]">Căn mặt vào khung</span>
                    <div className="w-12"></div>
                </div>

                <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                    {/* Khung căn chỉnh */}
                    <div className="relative z-10 w-[85%] aspect-[3/4] border-2 border-white/50 rounded-[3.5rem] overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]">
                         <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[65%] aspect-square border border-white/30 rounded-full"></div>
                    </div>
                </div>

                <div className="h-40 bg-black flex items-center justify-center">
                    <button onClick={capture} className="w-20 h-20 bg-white rounded-full p-1 active:scale-90 transition-transform">
                        <div className="w-full h-full border-[6px] border-black rounded-full"></div>
                    </button>
                </div>
            </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => onImageSelected(ev.target?.result as string);
              reader.readAsDataURL(file);
          }
      }} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoUploader;