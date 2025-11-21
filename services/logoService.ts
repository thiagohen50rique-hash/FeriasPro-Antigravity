import { CbcFullLogoString } from '../constants/logo';

let cachedLogo: string | null = null;

const renderLogoToDataURL = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const svg = new Blob([CbcFullLogoString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svg);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            // SVG viewBox is "0 0 2793 375".
            // The PDF uses the logo with a width of 50mm.
            // 50mm is approx 1.97 inches. For good quality at 300 DPI, we need 1.97 * 300 = ~591 pixels.
            const targetWidth = 600;
            const scale = targetWidth / 2793;
            canvas.width = targetWidth;
            canvas.height = 375 * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(dataUrl);
            } else {
                URL.revokeObjectURL(url);
                reject(new Error("Could not get canvas context"));
            }
        };

        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG image for PDF generation."));
        };

        img.src = url;
    });
};

/**
 * Renders the company logo from an SVG source to an optimized PNG Data URL, caching the result.
 * The first call will be slower as it performs the rendering. Subsequent calls will be instantaneous.
 * This should be pre-warmed if possible when the application loads.
 * @returns {Promise<string>} A promise that resolves with the Data URL (Base64) of the logo image.
 */
export const getLogoDataUrl = async (): Promise<string> => {
    if (cachedLogo) {
        return cachedLogo;
    }
    cachedLogo = await renderLogoToDataURL();
    return cachedLogo;
};
