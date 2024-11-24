'use client'

import { useState, useEffect, useRef} from 'react'

interface WorkerMessage {
  status: 'initiate' | 'ready' | 'complete';
  mask?: ImageData;
}

export default function Home() {
  const [resultUrl, setResult] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const worker = useRef<Worker | null>(null);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module'
      });
    }

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      switch (e.data.status) {
        case 'initiate':
          setReady(false);
          break;
        case 'ready':
          setReady(true);
          break;
        case 'complete':
          if (e.data.mask && imageUrl) {
            const mask = e.data.mask;
            const image = new Image();
            image.src = imageUrl;

            image.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = image.width;
              canvas.height = image.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
          
              // Draw original image output to canvas
              ctx.drawImage(image, 0, 0);
          
              // Update alpha channel
              const pixelData = ctx.getImageData(0, 0, image.width, image.height);
              for (let i = 0; i < mask.data.length; ++i) {
                  pixelData.data[4 * i + 3] = mask.data[i];
              }
              ctx.putImageData(pixelData, 0, 0);

              // Convert canvas to data URL and set result
              const resultUrl = canvas.toDataURL('image/png');
              setResult(resultUrl);
            };
        
          }
          break;
      }
    };

    worker.current.addEventListener('message', onMessageReceived);

    return () => {
      worker.current?.removeEventListener('message', onMessageReceived);
    };
  }, []);

  const handleImageUploaded = (url: string) => {
    console.log(url, worker.current)
    setResult(null); // Clear result when uploading new image
    if (worker.current) {
      worker.current.postMessage({ url });
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!ready) return;
    e.preventDefault();
    e.stopPropagation();
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!ready) return;
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      handleImageUploaded(url)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      handleImageUploaded(url)
    }
  }

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = 'removed-background.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  const renderUploadIcon = () => (
    <>
      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-gray-500">
        {ready ? 'Drag and drop an image here, or click to select' : 'Loading model... Please wait'}
      </p>
    </>
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h1 className="text-5xl font-bold mb-2 text-center">Remove Background Tool</h1>
      <h2 className="text-2xl mb-4 text-center">Upload an image to remove its background</h2>

      <div className="flex gap-8 w-full justify-center">
        <div 
          className={`w-full max-w-xl h-96 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 mt-8 relative ${!ready ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            disabled={!ready}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleFileChange}
          />
          {!imageUrl ? renderUploadIcon() : (
            <img 
              src={imageUrl} 
              alt="Uploaded image"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {resultUrl && (
          <div className="w-full max-w-xl h-96 mt-8 flex flex-col items-center">
            <div className="border-2 border-gray-300 rounded-lg p-6 h-full w-full flex items-center justify-center">
              <img 
                src={resultUrl} 
                alt="Result image"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              onClick={handleDownload}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Download 
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
