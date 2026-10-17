export type PageId =
  | 'beranda'
  | 'katalog-properti'
  | 'detail-properti'
  | 'panduan-legalitas-uwto'
  | 'konsultasi-agen'
  | 'tentang-kami'
  | 'titip-properti'
  | 'faq-bantuan';

export interface PropertyItem {
  id: string;
  title: string;
  category: 'Rumah Mewah' | 'Ruko Komersial' | 'Tanah Kavling' | 'Apartemen' | 'Villa Waterfront' | 'Gudang Industri';
  location: string;
  district: string;
  price: number; // in IDR
  priceFormatted: string;
  period?: string; // e.g. "/ tahun" for rent
  intent: 'jual' | 'sewa';
  landArea: number; // LT in m2
  buildingArea: number; // LB in m2
  bedrooms?: number;
  bathrooms?: number;
  uwtoExpiryYear: number;
  uwtoStatus: string;
  legalStatus: string;
  imageUrl: string;
  additionalImages?: string[];
  featured?: boolean;
  agentName: string;
  agentPhone: string;
  agentRole: string;
  description: string;
  facilities: string[];
}

export interface AgentItem {
  id: string;
  name: string;
  role: string;
  specialty: string;
  districts: string;
  rating: number;
  dealsCount: number;
  badge: string;
  photoUrl: string;
  phone: string;
  portfolioCount: number;
  bio?: string;
  featuredUnits?: string[];
}

export interface FaqItem {
  id: string;
  category: 'uwto' | 'kpr' | 'titip' | 'wna' | 'biaya';
  question: string;
  answerHtml: string;
}
