import React, { useState, useEffect, useRef } from 'react';
import { generateQRCode, generateQRCodeCanvas, downloadQRCode } from '../services/qrCodeService';

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  onClose?: () => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, title = 'Video Link', onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQR();
  }, [url]);

  const generateQR = async () => {
    try {
      setLoading(true);
      const dataUrl = await generateQRCode(url, { width: 400 });
      setQrDataUrl(dataUrl);

      if (canvasRef.current) {
        await generateQRCodeCanvas(url, canvasRef.current, { width: 400 });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      downloadQRCode(qrDataUrl, `qr-code-${title.replace(/\s+/g, '-').toLowerCase()}.png`);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">Scan to view video</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        {loading ? (
          <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-gray-400">Generating QR Code...</div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg">
            <canvas ref={canvasRef} className="hidden" />
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR Code" className="w-full max-w-md" />
            )}
          </div>
        )}

        <div className="mt-6 w-full space-y-3">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Video URL</p>
            <p className="text-white text-sm break-all">{url}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyUrl}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy URL
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
