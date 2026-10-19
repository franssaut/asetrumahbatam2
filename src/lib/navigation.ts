import { PageId, PropertyItem } from '../types';
import { PROPERTIES_LIST } from '../data/mockData';

// Map page ID to URL path
export const PAGE_PATHS: Record<PageId, string> = {
  'beranda': '/',
  'katalog-properti': '/katalog-properti',
  'detail-properti': '/detail-properti',
  'panduan-legalitas-uwto': '/panduan-legalitas-uwto',
  'konsultasi-agen': '/konsultasi-agen',
  'tentang-kami': '/tentang-kami',
  'titip-properti': '/titip-properti',
  'faq-bantuan': '/faq-bantuan',
};

/**
 * Generate canonical relative URL for a property listing
 */
export function getPropertyPath(propertyId: string): string {
  return `/properti/${encodeURIComponent(propertyId)}`;
}

/**
 * Generate full absolute URL for a property listing (for sharing via WA/clipboard)
 */
export function getPropertyAbsoluteUrl(propertyId: string): string {
  const origin = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://asetrumahbatam2.vercel.app';
  return `${origin}${getPropertyPath(propertyId)}`;
}

/**
 * Generate WhatsApp share URL with rich property overview
 */
export function getPropertyWhatsAppShareUrl(property: PropertyItem): string {
  const url = getPropertyAbsoluteUrl(property.id);
  const text = 
`Halo! Saya tertarik membagikan listing properti ini dari Aset Rumah Batam:

🏡 *${property.title}*
📍 ${property.location}, ${property.district}, Batam
💰 Harga: *${property.priceFormatted}* ${property.period || ''}
📐 Luas: LT ${property.landArea}m² / LB ${property.buildingArea}m²
📜 Legalitas: ${property.legalStatus} (${property.uwtoStatus})

👉 Buka link detail properti & foto lengkap:
${url}`;

  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Copy property link to clipboard with fallback
 */
export async function copyPropertyLinkToClipboard(propertyId: string): Promise<boolean> {
  const url = getPropertyAbsoluteUrl(propertyId);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      textArea.remove();
      return success;
    }
  } catch (err) {
    console.warn('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Native Web Share API helper (for mobile browsers)
 */
export async function sharePropertyNative(property: PropertyItem): Promise<boolean> {
  const url = getPropertyAbsoluteUrl(property.id);
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `${property.title} | Aset Rumah Batam`,
        text: `Lihat listing ${property.title} seharga ${property.priceFormatted} di Batam:`,
        url: url,
      });
      return true;
    } catch (err: any) {
      // User cancelled share
      if (err.name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
      return false;
    }
  }
  return false;
}

/**
 * Parse current browser URL and return matching page and property if any
 */
export function parseInitialRoute(properties: PropertyItem[] = PROPERTIES_LIST): {
  page: PageId;
  property?: PropertyItem;
} {
  if (typeof window === 'undefined') {
    return { page: 'beranda' };
  }

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  // 1. Check for properti path pattern: /properti/:id or /detail-properti/:id
  const propertiPathMatch = pathname.match(/^\/(?:properti|detail-properti)\/([^/]+)/);
  let targetPropertyId: string | null = propertiPathMatch ? decodeURIComponent(propertiPathMatch[1]) : null;

  // 2. Fallback check for query params: ?properti=:id or ?id=:id or ?p=:id
  if (!targetPropertyId) {
    targetPropertyId = searchParams.get('properti') || searchParams.get('p') || searchParams.get('id');
  }

  // 3. Fallback check for hash: #/properti/:id or #properti-:id
  if (!targetPropertyId && hash) {
    const hashMatch = hash.match(/#(?:(?:\/)?properti[\/-])([^/?&]+)/);
    if (hashMatch) {
      targetPropertyId = decodeURIComponent(hashMatch[1]);
    }
  }

  // If a property ID was matched, find the corresponding property
  if (targetPropertyId) {
    const matched = properties.find(
      (p) => p.id.toLowerCase() === targetPropertyId!.toLowerCase()
    );
    if (matched) {
      return { page: 'detail-properti', property: matched };
    }
  }

  // 4. Match top-level page paths
  for (const [pageId, path] of Object.entries(PAGE_PATHS)) {
    if (path !== '/' && (pathname === path || pathname.startsWith(path + '/'))) {
      return { page: pageId as PageId };
    }
  }

  // Fallback to query param ?page=:page
  const queryPage = searchParams.get('page');
  if (queryPage && queryPage in PAGE_PATHS) {
    return { page: queryPage as PageId };
  }

  return { page: 'beranda' };
}
