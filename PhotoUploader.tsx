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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }, 
        audio: false 
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err: any) {
      console.error("Camera Error:", err);
      alert("Lỗi: Camera không khả dụng hoặc bị từ chối quyền.");
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
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
        const base64 = canvas.toDataURL('image/jpeg', 0.95);
        onImageSelected(base64);
        closeCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        onImageSelected(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isCameraOpen, stream]);

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <button onClick={openCamera} className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-600 text-white rounded-[2rem] shadow-xl active:scale-95 transition-all">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <span className="font-black text-[11px] uppercase tracking-wider">Chụp ảnh</span>
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-slate-100 text-slate-600 rounded-[2rem] shadow-sm active:scale-95 transition-all">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <span className="font-black text-[11px] uppercase tracking-wider">Tải ảnh lên</span>
        </button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
          <div className="relative w-full h-full flex flex-col max-w-md">
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
               <button onClick={closeCamera} className="p-3 bg-black/40 text-white rounded-full backdrop-blur-md">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
               <span className="text-white font-black text-[10px] uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full">ID PHOTO MODE</span>
               <div className="w-12"></div>
            </div>
            <div className="flex-1 relative overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] aspect-[3/4] border-4 border-white/20 rounded-[3.5rem] relative">
                  <div className="absolute inset-0 border-[600px] border-black/60 -m-[600px]"></div>
                </div>
              </div>
            </div>
            <div className="h-44 bg-black flex flex-col items-center justify-center">
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 active:scale-90 transition-transform">
                <div className="w-full h-full border-[4px] border-black rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoUploader;