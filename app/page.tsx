'use client'

import { useState, useEffect, useRef} from 'react'

interface WorkerMessage {
  status: 'initiate' | 'ready' | 'complete';
  mask?: ImageData;
}

const EXAMPLE_URL = 'https://images.pexels.com/photos/5965592/pexels-photo-5965592.jpeg?auto=compress&cs=tinysrgb&w=1024';

export default function Home() {
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultImageUrl, setResultImageUrl] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const originalImageRef = useRef('');

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
          setIsModelReady(false);
          break;
        case 'ready':
          setIsModelReady(true);
          break;
        case 'complete':
          setIsProcessing(false);
          if (e.data.mask && originalImageRef.current) {
            const mask = e.data.mask;
            const image = new Image();
            image.src = originalImageRef.current;

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
              setResultImageUrl(resultUrl);
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
    setResultImageUrl(''); // Clear result when uploading new image
    setIsProcessing(true);
    if (worker.current) {
      worker.current.postMessage({ url });
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!isModelReady) return;
    e.preventDefault();
    e.stopPropagation();
  }

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setUploadedImageUrl(url);
    originalImageRef.current = url;
    handleImageUploaded(url);
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!isModelReady) return;
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  const handleDownload = () => {
    if (resultImageUrl) {
      const link = document.createElement('a');
      link.href = resultImageUrl;
      link.download = 'removed-background.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  const handleSetDefaultImage = () => {
    setUploadedImageUrl(EXAMPLE_URL);
    originalImageRef.current = EXAMPLE_URL;
    handleImageUploaded(EXAMPLE_URL);
  }

  const renderUploadIcon = () => (
    <>
      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-gray-500">
        {isModelReady ? 'Drag and drop an image here, or click to select' : 'Loading model... Please wait'}
      </p>
    </>
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h1 className="text-5xl font-bold mb-2 text-center">Remove Background Tool</h1>
      <h2 className="text-2xl mb-4 text-center">Upload an image to remove its background</h2>

      <div className="flex gap-8 w-full justify-center">
        <div 
          className={`w-full max-w-xl h-96 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 mt-8 relative ${!isModelReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            disabled={!isModelReady}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleFileChange}
          />
          {!uploadedImageUrl ? renderUploadIcon() : (
            <img 
              src={uploadedImageUrl} 
              alt="Uploaded image"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {(resultImageUrl || isProcessing) && (
          <div className="w-full max-w-xl h-96 mt-8 flex flex-col items-center">
            <div className="border-2 border-gray-300 rounded-lg p-6 h-full w-full flex items-center justify-center">
              {isProcessing ? (
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              ) : (
                <img 
                  src={resultImageUrl} 
                  alt="Result image"
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        )}
      </div>
      {resultImageUrl && (
        <div className="w-full flex justify-center mt-4 gap-4">
          <button
            onClick={handleDownload}
            className="px-8 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-lg"
          >
            Download
          </button>
          <button
            onClick={() => {
              setUploadedImageUrl('');
              setResultImageUrl('');
            }}
            className="px-8 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-lg"
          >
            Reset
          </button>
        </div>
      )}
      {/* {!uploadedImageUrl && isModelReady && (
        <button
          onClick={handleSetDefaultImage}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try default Image
        </button>
      )} */}
    </main>
  )
}
