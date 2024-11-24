'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface WorkerMessage {
  status: 'initiate' | 'ready' | 'complete';
  mask?: ImageData;
}

export default function Home() {
  const [result, setResult] = useState<ImageData | null>(null);
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
          if (e.data.mask) {
            // const image = await RawImage.fromURL(url);

            // const canvas = document.createElement('canvas');
            // canvas.width = image.width;
            // canvas.height = image.height;
            // const ctx = canvas.getContext('2d');
        
            // // Draw original image output to canvas
            // ctx.drawImage(image.toCanvas(), 0, 0);
        
            // // Update alpha channel
            // const pixelData = ctx.getImageData(0, 0, image.width, image.height);
            // for (let i = 0; i < mask.data.length; ++i) {
            //     pixelData.data[4 * i + 3] = mask.data[i];
            // }
            // ctx.putImageData(pixelData, 0, 0);
        
            // // Update UI
            // imageContainer.append(canvas);
            // imageContainer.style.removeProperty('background-image');
            // imageContainer.style.background = `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURb+/v////5nD/3QAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVBjTYwABQSCglEENMxgYGAAynwRB8BEAgQAAAABJRU5ErkJggg==")`;
          
            setResult(e.data.mask);
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
    if (worker.current) {
      worker.current.postMessage({ url });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h1 className="text-5xl font-bold mb-2 text-center">Remove Background Tool</h1>
      <h2 className="text-2xl mb-4 text-center">Upload an image to remove its background</h2>

      <div 
        className="w-full max-w-2xl h-96 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 mt-8 relative"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            handleImageUploaded(url)
          }
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setImageUrl(url);
              handleImageUploaded(url)
            }
          }}
        />
        {!imageUrl ? (
          <>
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">Drag and drop an image here, or click to select</p>
          </>
        ) : (
          <img 
            src={imageUrl} 
            alt="Uploaded image"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
    </main>
  )
}
