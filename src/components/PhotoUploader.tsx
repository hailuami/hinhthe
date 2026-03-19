
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
      console.error("Android Camera Error:", err);
      alert("Lỗi: " + (err.name === 'NotAllowedError' ? "Cần cấp quyền camera trong cài đặt Android." : "Camera không khả dụng."));
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
        // Lật ảnh để đúng chiều thực tế (vì dùng camera trước thường bị ngược)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.95);
        onImageSelected(base64);
        closeCamera();
      }
    }
  };

  // Fix: Added handleFileChange to process images selected from the file system/gallery
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
      // Android yêu cầu gọi play() rõ ràng sau khi gán srcObject
      videoRef.current.play().catch(console.error);
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isCameraOpen, stream]);

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="flex items-center justify-center gap-2 py-3 px-4 bg-black/30 hover:bg-black/50 border border-white/10 text-slate-300 rounded-xl transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="font-bold text-[10px] uppercase tracking-wider">Tải ảnh lên 📂</span>
        </button>

        <button 
          onClick={openCamera} 
          className="flex items-center justify-center gap-2 py-3 px-4 bg-black/30 hover:bg-black/50 border border-white/10 text-slate-300 rounded-xl transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="font-bold text-[10px] uppercase tracking-wider">Camera 📷</span>
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
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[85%] aspect-[3/4] border-4 border-white/20 rounded-[3.5rem] relative">
                  <div className="absolute inset-0 border-[600px] border-black/60 -m-[600px]"></div>
                  <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] aspect-square border-2 border-blue-400/50 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.2)]"></div>
                  <div className="absolute bottom-[20%] left-0 right-0 border-t-2 border-dashed border-white/40"></div>
                </div>
              </div>
            </div>

            <div className="h-44 bg-black flex flex-col items-center justify-center gap-4">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Căn giữa khuôn mặt</p>
              <button 
                onClick={capturePhoto}
                className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 active:scale-90 transition-transform"
              >
                <div className="w-full h-full border-[6px] border-black rounded-full"></div>
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
