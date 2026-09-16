import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'ticket' | 'complaint';
  itemId: string;
  itemTitle: string;
  qrCodeDataUrl?: string | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  itemType,
  itemId,
  itemTitle,
  qrCodeDataUrl,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [effectiveQr, setEffectiveQr] = useState<string | null>(qrCodeDataUrl || null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const trackingUrl = `${window.location.origin}/track/${itemType}/${itemId}`;

  useEffect(() => {
    if (qrCodeDataUrl) {
      setEffectiveQr(qrCodeDataUrl);
      setIsGenerating(false);
    } else if (isOpen && itemId && itemType) {
      setIsGenerating(true);
      QRCode.toDataURL(trackingUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setEffectiveQr(url);
          setIsGenerating(false);
        })
        .catch((err) => {
          console.error('[QRCodeModal] Error generating QR code client-side:', err);
          setIsGenerating(false);
        });
    }
  }, [isOpen, qrCodeDataUrl, trackingUrl, itemId, itemType]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadQR = () => {
    if (!effectiveQr) return;
    const link = document.createElement('a');
    link.href = effectiveQr;
    link.download = `smartserve-${itemType}-${itemId.slice(-6)}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code Live Tracking">
      <div className="space-y-4 text-center">
        <div>
          <span className="inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {itemType} #{itemId.slice(-6).toUpperCase()}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-1">{itemTitle}</h3>
          <p className="text-xs text-gray-500 mt-1">
            Scan this QR code with any mobile camera or device to view real-time resolution status.
          </p>
        </div>

        <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200 shadow-xs max-w-xs mx-auto">
          {effectiveQr ? (
            <img
              src={effectiveQr}
              alt={`QR Code for ${itemTitle}`}
              className="w-48 h-48 rounded-lg shadow-2xs transition-transform duration-200 hover:scale-105"
            />
          ) : isGenerating ? (
            <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
              <span className="text-xs font-medium">Rendering QR Code...</span>
            </div>
          ) : (
            <div className="w-48 h-48 flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400">
              <QrCode className="w-12 h-12 mb-2 stroke-1" />
              <span className="text-xs">QR Code Unavailable</span>
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg text-left text-xs space-y-1.5 border border-gray-200">
          <span className="font-medium text-gray-700">Live Tracking Link:</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={trackingUrl}
              className="flex-1 bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-600 truncate focus:outline-hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0 text-xs py-1 px-2.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Tracking Page
          </a>

          <div className="flex gap-2">
            {effectiveQr && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Download QR
              </Button>
            )}
            <Button type="button" size="sm" onClick={onClose} className="text-xs">
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
