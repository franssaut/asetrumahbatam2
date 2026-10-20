import { PageId, PropertyItem } from '../types';
import { FAQ_LIST } from '../data/mockData';

export const BASE_SITE_URL = 'https://asetrumahbatam2.vercel.app';

export interface SEOConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string;
  jsonLd?: Record<string, any>;
}

/**
 * Metadata presets for all top-level pages
 */
export const PAGE_SEO_METADATA: Record<PageId, SEOConfig> = {
  'beranda': {
    title: 'Aset Rumah Batam | Platform Jual Beli Rumah, Properti & Legalitas UWTO Batam',
    description: 'Platform broker real estat terpercaya di Batam. Cari & jual rumah mewah, ruko komersial, villa, dan tanah dengan verifikasi legalitas faktur UWTO BP Batam resmi & simulasi KPR.',
    canonicalPath: '/',
    type: 'website',
    keywords: 'rumah batam, jual beli rumah batam, properti batam, perumahan batam center, rumah sukajadi batam, villa nongsa, ruko nagoya, legalitas uwto, uwto bp batam, kpr batam',
  },
  'katalog-properti': {
    title: 'Katalog Properti Pilihan Batam | Rumah Mewah, Ruko, Villa & Kavling',
    description: 'Jelajahi listing properti terlengkap di Batam: Batam Center, Sukajadi, Nagoya, Nongsa & Tiban. Sertifikat HGB/SHM resmi dan validasi faktur UWTO BP Batam.',
    canonicalPath: '/katalog-properti',
    type: 'website',
    keywords: 'katalog properti batam, perumahan batam center, rumah sukajadi golf, ruko nagoya thamrin, villa nongsa, apartemen harbour bay, cari rumah batam',
  },
  'detail-properti': {
    title: 'Detail Properti & Spesifikasi Lengkap | Aset Rumah Batam',
    description: 'Informasi detail properti di Batam, foto resolusi tinggi, spesifikasi luas tanah/bangunan, status UWTO BP Batam, legalitas sertifikat, dan simulasi cicilan KPR.',
    canonicalPath: '/katalog-properti',
    type: 'website',
    keywords: 'spesifikasi properti batam, harga rumah batam, simulasi kpr batam, legalitas tanah batam',
  },
  'panduan-legalitas-uwto': {
    title: 'Panduan Legalitas & Tarif UWTO BP Batam | Siklus 30 Tahun & Hak Pakai WNA',
    description: 'Pelajari mekanisme Uang Wajib Tahunan Otorita (UWTO) BP Batam, tarif zona per meter persegi, simulasi biaya perpanjangan, dan regulasi kepemilikan properti untuk WNA.',
    canonicalPath: '/panduan-legalitas-uwto',
    type: 'article',
    keywords: 'panduan uwto batam, tarif perpanjangan uwto bp batam, biaya uwto per meter, hak pakai wna batam, legalitas properti batam, surat perjanjian alokasi lahan spal',
  },
  'konsultasi-agen': {
    title: 'Konsultasi Agen Berlisensi & Advokat Properti Batam | Aset Rumah Batam',
    description: 'Jadwalkan konsultasi gratis dengan broker AREBI bersertifikat dan konsultan legalitas properti Batam untuk survei unit, negosiasi harga, dan pendampingan notaris.',
    canonicalPath: '/konsultasi-agen',
    type: 'website',
    keywords: 'konsultan properti batam, agen real estat batam, broker arebi batam, notaris ppat batam, jadwal survei rumah batam',
  },
  'tentang-kami': {
    title: 'Tentang Kami | Broker Real Estat Terpercaya & Berizin di Batam',
    description: 'Mengenal Aset Rumah Batam: sejarah, komitmen integritas hukum agraria BP Batam, tim manajemen terakreditasi, dan rekam jejak transaksi properti di Batam.',
    canonicalPath: '/tentang-kami',
    type: 'website',
    keywords: 'profil aset rumah batam, kantor broker batam, broker real estat mahkota raya, agen terpercaya batam',
  },
  'titip-properti': {
    title: 'Titip Jual & Sewa Properti Batam | Pasarkan Cepat & Aman',
    description: 'Pasarkan rumah, ruko, tanah, atau villa Anda bersama Aset Rumah Batam. Jaringan pembeli luas, taksasi harga pasar akurat, dan pendampingan berkas legal hingga closing.',
    canonicalPath: '/titip-properti',
    type: 'website',
    keywords: 'titip jual rumah batam, titip sewa ruko batam, pasarkan properti batam, broker jual cepat batam',
  },
  'faq-bantuan': {
    title: 'Pusat FAQ & Bantuan Hukum Properti Batam | Pertanyaan Seputar UWTO & KPR',
    description: 'Jawaban lengkap pertanyaan seputar jual beli properti di Batam, sistem perpanjangan UWTO BP Batam, syarat KPR bank, pajak BPHTB, serta hak beli properti bagi WNA.',
    canonicalPath: '/faq-bantuan',
    type: 'website',
    keywords: 'faq properti batam, pertanyaan uwto batam, syarat kpr batam, pajak jual beli rumah batam, aturan wna beli rumah batam',
  },
  'dashboard-user': {
    title: 'Dashboard Pengguna | Aset Rumah Batam',
    description: 'Kelola properti favorit, pengajuan titip jual, jadwal survei konsultasi, dan pengaturan akun Anda di Aset Rumah Batam.',
    canonicalPath: '/dashboard',
    type: 'website',
  },
  'login': {
    title: 'Masuk / Daftar Akun | Aset Rumah Batam',
    description: 'Masuk ke portal Aset Rumah Batam untuk mengelola portofolio listing, pengajuan survei, dan transaksi properti Anda.',
    canonicalPath: '/login',
    type: 'website',
  },
};

/**
 * Generate SEO and JSON-LD schema specifically for a single property item
 */
export function getPropertySEO(property: PropertyItem): SEOConfig {
  const propertyUrl = `${BASE_SITE_URL}/properti/${encodeURIComponent(property.id)}`;
  const mainImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : `${BASE_SITE_URL}/logo.jpg`;

  const schemaType = property.category.toLowerCase().includes('ruko') || property.category.toLowerCase().includes('komersial')
    ? 'CommercialProperty'
    : property.category.toLowerCase().includes('apartemen')
    ? 'Apartment'
    : 'SingleFamilyResidence';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    '@id': propertyUrl,
    'name': property.title,
    'description': property.description || `${property.title} di ${property.location}, ${property.district}, Batam. Legalitas ${property.legalStatus}.`,
    'url': propertyUrl,
    'image': property.images && property.images.length > 0 ? property.images : [mainImage],
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': property.district || 'Batam Center',
      'addressRegion': 'Kepulauan Riau',
      'addressCountry': 'ID',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': 1.1301,
      'longitude': 104.0529,
    },
    'numberOfRooms': property.bedrooms || 3,
    'numberOfBathroomsTotal': property.bathrooms || 2,
    'floorSize': {
      '@type': 'QuantitativeValue',
      'value': property.buildingArea,
      'unitCode': 'MTK',
    },
    'offers': {
      '@type': 'Offer',
      'price': property.price,
      'priceCurrency': 'IDR',
      'availability': 'https://schema.org/InStock',
      'url': propertyUrl,
      'validFrom': '2026-01-01',
    },
  };

  return {
    title: `${property.title} (${property.priceFormatted}) | Aset Rumah Batam`,
    description: `${property.title} di ${property.location}, ${property.district}, Batam. LT ${property.landArea}m² / LB ${property.buildingArea}m², ${property.bedrooms} KT, ${property.bathrooms} KM. Legalitas ${property.legalStatus} (${property.uwtoStatus}).`,
    canonicalPath: `/properti/${encodeURIComponent(property.id)}`,
    image: mainImage,
    type: 'website',
    keywords: `${property.title.toLowerCase()}, properti ${property.district.toLowerCase()}, rumah ${property.location.toLowerCase()}, ${property.category.toLowerCase()} batam, ${property.legalStatus.toLowerCase()}`,
    jsonLd,
  };
}

/**
 * Generate JSON-LD FAQ schema for FAQ page
 */
export function getFaqPageJsonLd(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${BASE_SITE_URL}/faq-bantuan#faq`,
    'mainEntity': FAQ_LIST.map((faq) => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answerHtml.replace(/<[^>]+>/g, ''),
      },
    })),
  };
}

/**
 * Update HTML Document Head Meta Tags dynamically
 */
export function applyPageSEO(config: SEOConfig): void {
  if (typeof document === 'undefined') return;

  // 1. Update Title
  document.title = config.title;

  // 2. Helper to set or create meta tag
  const setMeta = (name: string, content: string, isProperty = false) => {
    if (!content) return;
    const attr = isProperty ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  // 3. Update Standard Meta Tags
  setMeta('title', config.title);
  setMeta('description', config.description);
  if (config.keywords) {
    setMeta('keywords', config.keywords);
  }

  // 4. Update Canonical Link
  const fullCanonicalUrl = config.canonicalPath 
    ? `${BASE_SITE_URL}${config.canonicalPath}` 
    : BASE_SITE_URL;
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', fullCanonicalUrl);

  // 5. Update Open Graph Meta Tags
  const ogImage = config.image || `${BASE_SITE_URL}/logo.jpg`;
  setMeta('og:title', config.title, true);
  setMeta('og:description', config.description, true);
  setMeta('og:url', fullCanonicalUrl, true);
  setMeta('og:image', ogImage, true);
  setMeta('og:image:secure_url', ogImage, true);
  setMeta('og:type', config.type || 'website', true);

  // 6. Update Twitter Card Meta Tags
  setMeta('twitter:title', config.title);
  setMeta('twitter:description', config.description);
  setMeta('twitter:url', fullCanonicalUrl);
  setMeta('twitter:image', ogImage);

  // 7. Inject / Update Dynamic JSON-LD Structured Data
  const DYNAMIC_JSONLD_ID = 'dynamic-seo-jsonld';
  let jsonLdScript = document.getElementById(DYNAMIC_JSONLD_ID) as HTMLScriptElement | null;

  if (config.jsonLd) {
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = DYNAMIC_JSONLD_ID;
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(config.jsonLd);
  } else if (jsonLdScript) {
    jsonLdScript.remove();
  }
}
