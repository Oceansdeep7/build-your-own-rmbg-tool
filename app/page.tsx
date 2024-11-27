'use client'

import { useState, useEffect, useRef } from 'react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface WorkerMessage {
  status: 'initiate' | 'ready' | 'complete';
  mask?: ImageData;
}

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

  const renderUploadIcon = () => (
    <>
      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-gray-500">
        {isModelReady ? (
          'Drag and drop an image here, or click to select'
        ) : (
          <span className="inline-flex items-center">
            <span className="animate-pulse">Loading model</span>
            <span className="animate-[bounce_1s_infinite]">.</span>
            <span className="animate-[bounce_1s_infinite_200ms]">.</span>
            <span className="animate-[bounce_1s_infinite_400ms]">.</span>
          </span>
        )}
      </p>
    </>
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h1 className="text-5xl font-bold mb-2 text-center">Remove Background Tool</h1>
      <h2 className="text-2xl mb-4 text-center">Upload an image to remove its background</h2>

      <div className="flex gap-8 w-full justify-center">
        {!resultImageUrl ? (
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
              <div className="relative w-full h-full flex justify-center">
                <img 
                  src={uploadedImageUrl} 
                  alt="Uploaded image"
                  className="max-w-full max-h-full object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-4"></div>
                    <p>Processing image...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <ReactCompareSlider
            style={{ maxHeight: '50vw' }}
            itemOne={<ReactCompareSliderImage src={uploadedImageUrl} alt="Origin Image" />}
            itemTwo={<ReactCompareSliderImage style={{
              backgroundColor: 'white',
              backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
              `,
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              backgroundSize: '20px 20px',
              width: '100%'
            }} src={resultImageUrl} alt="Result Image" />}
          />
        )}
      </div>
      {resultImageUrl && (
        <div className="w-full flex justify-center mt-6 gap-4">
          <button
            onClick={() => {
              setUploadedImageUrl('');
              setResultImageUrl('');
            }}
            className="px-8 py-3 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-lg"
          >
            Reset
          </button>
          <button
            onClick={handleDownload}
            className="px-8 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-lg"
          >
            Download
          </button>
        </div>
      )}
    </main>
  )
}
