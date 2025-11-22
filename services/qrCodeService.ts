import QRCode from 'qrcode';

export async function generateQRCode(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 300,
      margin: options?.margin || 4,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export async function generateQRCodeCanvas(
  text: string,
  canvas: HTMLCanvasElement,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<void> {
  try {
    await QRCode.toCanvas(canvas, text, {
      width: options?.width || 300,
      margin: options?.margin || 4,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code on canvas:', error);
    throw error;
  }
}

export async function generateQRCodeSVG(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: options?.width || 300,
      margin: options?.margin || 4,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF',
      },
    });
    return svg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw error;
  }
}

export function downloadQRCode(dataUrl: string, filename: string = 'qr-code.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
