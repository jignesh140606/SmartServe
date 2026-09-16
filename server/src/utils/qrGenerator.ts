import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate a QR code as a Base64 data URL for a given tracking URL.
 * @param itemType - 'ticket' or 'complaint'
 * @param itemId - The document ObjectId
 * @returns Base64 data URL string (e.g., data:image/png;base64,...)
 */
export async function generateTrackingQRCode(
  itemType: 'ticket' | 'complaint',
  itemId: string
): Promise<string> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const trackingUrl = `${clientUrl}/track/${itemType}/${itemId}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return qrDataUrl;
  } catch (error) {
    console.error('[QR] Failed to generate QR code:', (error as Error).message);
    return '';
  }
}
