import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, PropertyItem, PageId } from '../types';
import { 
  getFavoritePropertyIds, 
  toggleFavoriteProperty, 
  signOutUser, 
  demoLogin, 
  updateUserProfile, 
  updateUserPassword 
} from '../lib/auth';
import { 
  getSupabase, 
  submitPropertyListing, 
  submitConsultationBooking,
  savePropertyToSupabase,
  deletePropertyFromSupabase,
  getLocalCustomProperties
} from '../lib/supabase';
import { getPropertyPath } from '../lib/navigation';
import { UWTO_TARIFF_DATA, AGENTS_LIST } from '../data/mockData';

interface DashboardUserPageProps {
  user: UserProfile;
  properties: PropertyItem[];
  onNavigate: (page: PageId) => void;
  onSelectProperty: (property: PropertyItem) => void;
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onAddProperty?: (property: PropertyItem) => void;
  onEditProperty?: (property: PropertyItem) => void;
  onDeleteProperty?: (propertyId: string) => void;
}

interface LocalSubmission {
  id?: string;
  user_id?: string;
  property_type?: string;
  region?: string;
  address?: string;
  estimated_price?: string;
  legal_status?: string;
  uwto_duration?: string;
  created_at?: string;
  intent?: string;
  status?: 'review' | 'appraisal' | 'published' | 'deal';
}

interface LocalBooking {
  id?: string;
  user_id?: string;
  client_name?: string;
  whatsapp_number?: string;
  agent_id?: string;
  preferred_time_slot?: string;
  property_interests?: string;
  created_at?: string;
  status?: 'confirmed' | 'pending' | 'completed';
}

export const DashboardUserPage: React.FC<DashboardUserPageProps> = ({
  user,
  properties,
  onNavigate,
  onSelectProperty,
  onLogout,
  onUpdateUser,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
}) => {
  type DashboardTab = 'overview' | 'favorites' | 'listings' | 'submissions' | 'bookings' | 'kpr-uwto' | 'role-tools' | 'profile';
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<LocalSubmission[]>([]);
  const [bookings, setBookings] = useState<LocalBooking[]>([]);

  // Modals for Quick In-Dashboard Creation
  const [showQuickSubmitModal, setShowQuickSubmitModal] = useState(false);
  const [showQuickBookingModal, setShowQuickBookingModal] = useState(false);

  // Full Listing Upload & Edit Modal State
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingModalMode, setListingModalMode] = useState<'create' | 'edit'>('create');
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  // Form Fields for Listing Upload & Edit
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<PropertyItem['category']>('Perumahan Residensial');
  const [formIntent, setFormIntent] = useState<'jual' | 'sewa'>('jual');
  const [formDistrict, setFormDistrict] = useState('Batam Center');
  const [formLocation, setFormLocation] = useState('Batam Center');
  const [formAddress, setFormAddress] = useState('');
  const [formPrice, setFormPrice] = useState<string>('1850000000');
  const [formPeriod, setFormPeriod] = useState<string>('');
  const [formLandArea, setFormLandArea] = useState<string>('120');
  const [formBuildingArea, setFormBuildingArea] = useState<string>('95');
  const [formBedrooms, setFormBedrooms] = useState<string>('3');
  const [formBathrooms, setFormBathrooms] = useState<string>('2');
  const [formLegalStatus, setFormLegalStatus] = useState('Sertifikat HGB Murni (BPN)');
  const [formUwtoYear, setFormUwtoYear] = useState<string>('2052');
  const [formUwtoStatus, setFormUwtoStatus] = useState('Aktif s/d 2052 (LMS BP Batam Valid)');
  const [formImageUrl, setFormImageUrl] = useState('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80');
  const [formDescription, setFormDescription] = useState('');
  const [formFacilities, setFormFacilities] = useState<string[]>([
    'Keamanan 24 Jam & One Gate System',
    'Row Jalan Lebar (10-14m)',
    'Air SPAM & Listrik PLN Stabil',
    'Verifikasi Faktur UWTO Clear BP Batam',
  ]);
  const [formStatus, setFormStatus] = useState<'published' | 'draft' | 'sold'>('published');
  const [formFeatured, setFormFeatured] = useState<boolean>(false);
  const [isSavingListing, setIsSavingListing] = useState(false);

  // Filter & Search inside listings tab
  const [listingFilter, setListingFilter] = useState<'all' | 'published' | 'draft' | 'sold'>('all');
  const [listingSearch, setListingSearch] = useState('');
  const [listingSubView, setListingSubView] = useState<'properties' | 'submissions'>('properties');

  // Interactive Toast Feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Auto dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Quick Submission Form State
  const [quickSubType, setQuickSubType] = useState('Perumahan Residensial');
  const [quickSubRegion, setQuickSubRegion] = useState('Batam Center');
  const [quickSubAddress, setQuickSubAddress] = useState('');
  const [quickSubPrice, setQuickSubPrice] = useState('1.500.000.000');
  const [quickSubLegal, setQuickSubLegal] = useState('Sertifikat HGB Murni (BPN)');
  const [quickSubIntent, setQuickSubIntent] = useState<'jual' | 'sewa'>('jual');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Quick Booking Form State
  const [quickBookAgent, setQuickBookAgent] = useState('hendry-tan');
  const [quickBookTime, setQuickBookTime] = useState('Pagi (10:00 - 11:30 WIB)');
  const [quickBookInterest, setQuickBookInterest] = useState('Survei Perumahan & Legalitas UWTO');
  const [isBookingQuick, setIsBookingQuick] = useState(false);

  // Profile Edit States
  const [editFullName, setEditFullName] = useState(user.fullName);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editRole, setEditRole] = useState<UserProfile['role']>(user.role);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Interactive KPR Calculator States
  const [calcPropertyPrice, setCalcPropertyPrice] = useState<number>(1500000000);
  const [calcDpPercent, setCalcDpPercent] = useState<number>(20);
  const [calcInterestRate, setCalcInterestRate] = useState<number>(5.5);
  const [calcTenorYears, setCalcTenorYears] = useState<number>(15);

  // Interactive UWTO Calculator States
  const [calcUwtoArea, setCalcUwtoArea] = useState<number>(200);
  const [calcUwtoZoneIndex, setCalcUwtoZoneIndex] = useState<number>(0);

  // Sync state when user prop changes
  useEffect(() => {
    setEditFullName(user.fullName);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
  }, [user]);

  // Load user data on mount & query Supabase
  useEffect(() => {
    // 1. Favorites
    setFavoriteIds(getFavoritePropertyIds());

    // 2. Submissions (Local + Supabase)
    const loadSubmissions = async () => {
      let localList: LocalSubmission[] = [];
      try {
        localList = JSON.parse(localStorage.getItem('arb_local_submissions') || '[]');
      } catch (e) {}

      const client = getSupabase();
      if (client) {
        try {
          const { data: dbSubmissions } = await client
            .from('property_submissions')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbSubmissions && dbSubmissions.length > 0) {
            const userDbSubs = dbSubmissions.filter((s: any) =>
              s.user_id === user.id ||
              (user.phone && s.owner_whatsapp === user.phone) ||
              (s.owner_name && s.owner_name.toLowerCase().includes(user.fullName.toLowerCase()))
            );
            if (userDbSubs.length > 0) {
              setSubmissions(userDbSubs);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase submissions query notice:', err);
        }
      }

      if (localList.length > 0) {
        setSubmissions(localList);
      } else {
        setSubmissions([
          {
            id: 'sub-sample-01',
            property_type: 'Cluster Autumn Hills (Rumah 2 Lantai)',
            region: 'Batam Center',
            address: 'Central Hills Boulevard Blok B-12',
            estimated_price: 'Rp 1.450.000.000',
            legal_status: 'Sertifikat HGB Murni (BPN)',
            uwto_duration: 'Tahun 2051 (25 Thn)',
            intent: 'jual',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: 'appraisal',
          },
          {
            id: 'sub-sample-02',
            property_type: 'Ruko Hook Mahkota Raya',
            region: 'Batam Center',
            address: 'Kompleks Mahkota Raya Blok A No. 15',
            estimated_price: 'Rp 2.800.000.000',
            legal_status: 'Sertifikat HGB Murni (BPN)',
            uwto_duration: 'Tahun 2045 (19 Thn)',
            intent: 'jual',
            created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
            status: 'published',
          },
        ]);
      }
    };

    // 3. Bookings (Local + Supabase)
    const loadBookings = async () => {
      let localList: LocalBooking[] = [];
      try {
        localList = JSON.parse(localStorage.getItem('arb_local_bookings') || '[]');
      } catch (e) {}

      const client = getSupabase();
      if (client) {
        try {
          const { data: dbBookings } = await client
            .from('consultation_bookings')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbBookings && dbBookings.length > 0) {
            const userDbBookings = dbBookings.filter((b: any) =>
              b.user_id === user.id ||
              (user.phone && b.whatsapp_number === user.phone) ||
              (b.client_name && b.client_name.toLowerCase().includes(user.fullName.toLowerCase()))
            );
            if (userDbBookings.length > 0) {
              setBookings(userDbBookings);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase bookings query notice:', err);
        }
      }

      if (localList.length > 0) {
        setBookings(localList);
      } else {
        setBookings([
          {
            id: 'book-sample-01',
            client_name: user.fullName,
            whatsapp_number: user.phone || '+62 812-7000-8812',
            agent_id: 'Dewi Lestari (Senior KPR & Residential Advisor)',
            preferred_time_slot: 'Besok Pagi (10:00 - 11:30 WIB)',
            property_interests: 'Konsultasi Perpanjangan UWTO & Investasi Villa Nongsa',
            created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
            status: 'confirmed',
          },
        ]);
      }
    };

    loadSubmissions();
    loadBookings();
  }, [user]);

  // Favorite properties list & total portfolio estimate
  const favoriteProperties = useMemo(() => {
    return properties.filter((p) => favoriteIds.includes(p.id));
  }, [properties, favoriteIds]);

  const totalFavoriteValue = useMemo(() => {
    return favoriteProperties.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [favoriteProperties]);

  const handleRemoveFavorite = (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = toggleFavoriteProperty(propertyId);
    setFavoriteIds(res.favorites);
  };

  const PRESET_IMAGES = [
    {
      title: 'Rumah Mewah Modern',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Villa Waterfront Nongsa',
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Residensial Minimalis',
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Hunian Hook Sukajadi',
      url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Ruko Bisnis Nagoya',
      url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Apartemen Penthouse',
      url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const AVAILABLE_FACILITIES = [
    'Keamanan 24 Jam & One Gate System',
    'Row Jalan Lebar (10-14m)',
    'Kolam Renang Privat / Club House',
    'Smart Home System & CCTV',
    'Garasi / Carport 2-3 Mobil',
    'Taman Depan & Belakang Asri',
    'Air SPAM & Listrik PLN Stabil',
    'Verifikasi Faktur UWTO Clear BP Batam',
    'Sertifikat Hak Milik / HGB Clean & Clear',
    'Dekat Terminal Ferry Batam Center',
    'Dekat Pusat Kuliner & Mall Nagoya',
    'View Laut Waterfront Bebas Polusi',
  ];

  const DISTRICTS_LIST = [
    'Batam Center',
    'Sukajadi / KDA',
    'Nagoya / Lubuk Baja',
    'Nongsa Waterfront',
    'Sekupang / Tiban',
    'Batu Aji / Marina',
    'Kabil / Punggur',
    'Bengkong',
    'Batu Ampar',
  ];

  // All properties managed by the user / editable in portal
  const userManagedProperties = useMemo(() => {
    const customIds = new Set(getLocalCustomProperties().map((p) => p.id.toLowerCase()));

    // In agent or admin mode, they can manage all properties (with custom prioritized)
    if (user.role === 'agen' || user.role === 'admin') {
      return properties;
    }

    // For clients or investors: return all custom created properties + properties with user's ownerId
    const own = properties.filter(
      (p) =>
        customIds.has(p.id.toLowerCase()) ||
        (p.ownerId && p.ownerId === user.id) ||
        (p.agentName && p.agentName.toLowerCase() === user.fullName.toLowerCase())
    );

    // If user hasn't added any custom property yet, provide top catalog properties as interactive starter listings
    if (own.length === 0) {
      return properties.slice(0, 4);
    }
    return own;
  }, [properties, user]);

  const filteredManagedProperties = useMemo(() => {
    return userManagedProperties.filter((p) => {
      // Filter by status
      if (listingFilter === 'published' && p.status === 'draft') return false;
      if (listingFilter === 'published' && p.status === 'sold') return false;
      if (listingFilter === 'draft' && p.status !== 'draft') return false;
      if (listingFilter === 'sold' && p.status !== 'sold') return false;

      // Filter by search
      if (listingSearch.trim()) {
        const q = listingSearch.toLowerCase();
        const matches =
          p.title.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.legalStatus.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [userManagedProperties, listingFilter, listingSearch]);

  const handleOpenCreateModal = () => {
    setListingModalMode('create');
    setEditingPropertyId(null);
    setFormTitle('');
    setFormCategory('Perumahan Residensial');
    setFormIntent('jual');
    setFormDistrict('Batam Center');
    setFormLocation('Batam Center');
    setFormAddress('');
    setFormPrice('1850000000');
    setFormPeriod('');
    setFormLandArea('120');
    setFormBuildingArea('95');
    setFormBedrooms('3');
    setFormBathrooms('2');
    setFormLegalStatus('Sertifikat HGB Murni (BPN)');
    setFormUwtoYear('2052');
    setFormUwtoStatus('Aktif s/d 2052 (LMS BP Batam Valid)');
    setFormImageUrl(PRESET_IMAGES[0].url);
    setFormDescription('Unit perumahan residensial asri siap huni dengan tata ruang lega, sertifikasi legalitas resmi BPN & BP Batam.');
    setFormFacilities([
      'Keamanan 24 Jam & One Gate System',
      'Row Jalan Lebar (10-14m)',
      'Air SPAM & Listrik PLN Stabil',
      'Verifikasi Faktur UWTO Clear BP Batam',
    ]);
    setFormStatus('published');
    setFormFeatured(false);
    setShowListingModal(true);
  };

  const handleOpenEditModal = (prop: PropertyItem) => {
    setListingModalMode('edit');
    setEditingPropertyId(prop.id);
    setFormTitle(prop.title);
    setFormCategory(prop.category);
    setFormIntent(prop.intent);
    setFormDistrict(prop.district);
    setFormLocation(prop.location);
    setFormAddress(prop.location);
    setFormPrice(String(prop.price));
    setFormPeriod(prop.period || '');
    setFormLandArea(String(prop.landArea));
    setFormBuildingArea(String(prop.buildingArea));
    setFormBedrooms(String(prop.bedrooms || 3));
    setFormBathrooms(String(prop.bathrooms || 2));
    setFormLegalStatus(prop.legalStatus);
    setFormUwtoYear(String(prop.uwtoExpiryYear));
    setFormUwtoStatus(prop.uwtoStatus);
    setFormImageUrl(prop.imageUrl);
    setFormDescription(prop.description);
    setFormFacilities(prop.facilities || []);
    setFormStatus(prop.status || 'published');
    setFormFeatured(Boolean(prop.featured));
    setShowListingModal(true);
  };

  const handleToggleFacility = (fac: string) => {
    setFormFacilities((prev) =>
      prev.includes(fac) ? prev.filter((f) => f !== fac) : [...prev, fac]
    );
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Judul properti wajib diisi');
      return;
    }

    setIsSavingListing(true);

    const priceNum = Number(formPrice.replace(/\D/g, '')) || 1000000000;
    
    // Generate formatted price
    let formattedPrice = '';
    if (priceNum >= 1000000000) {
      formattedPrice = `Rp ${(priceNum / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Miliar`;
    } else if (priceNum >= 1000000) {
      formattedPrice = `Rp ${(priceNum / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Juta`;
    } else {
      formattedPrice = `Rp ${priceNum.toLocaleString('id-ID')}`;
    }
    if (formIntent === 'sewa' && formPeriod) {
      formattedPrice = `${formattedPrice} ${formPeriod}`;
    }

    const idToUse =
      listingModalMode === 'edit' && editingPropertyId
        ? editingPropertyId
        : `prop-custom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const savedProperty: PropertyItem = {
      id: idToUse,
      title: formTitle.trim(),
      category: formCategory,
      intent: formIntent,
      district: formDistrict,
      location: formLocation || formAddress || formDistrict,
      price: priceNum,
      priceFormatted: formattedPrice,
      period: formIntent === 'sewa' ? (formPeriod || '/ tahun') : undefined,
      landArea: Number(formLandArea) || 120,
      buildingArea: Number(formBuildingArea) || 90,
      bedrooms: Number(formBedrooms) || 3,
      bathrooms: Number(formBathrooms) || 2,
      uwtoExpiryYear: Number(formUwtoYear) || 2050,
      uwtoStatus: formUwtoStatus || `Aktif s/d ${formUwtoYear} (LMS BP Batam Valid)`,
      legalStatus: formLegalStatus,
      imageUrl: formImageUrl || PRESET_IMAGES[0].url,
      description: formDescription.trim() || `Properti prestisius dengan sertifikasi legalitas resmi BP Batam, berlokasi sangat strategis di kawasan ${formDistrict}.`,
      facilities: formFacilities.length > 0 ? formFacilities : ['Keamanan 24 Jam', 'Air SPAM & PLN Stabil'],
      status: formStatus,
      featured: formFeatured,
      ownerId: user.id,
      agentName: user.fullName || 'Konsultan ARB',
      agentPhone: user.phone || '+62 823-9105-9216',
      agentRole: user.role === 'agen' ? 'Agen Resmi Aset Rumah Batam' : 'Pemilik Terverifikasi',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await savePropertyToSupabase(savedProperty);
      if (listingModalMode === 'edit') {
        onEditProperty?.(savedProperty);
      } else {
        onAddProperty?.(savedProperty);
      }
      setToastMessage({
        type: 'success',
        text: res.message || `Listing "${savedProperty.title}" berhasil ${listingModalMode === 'edit' ? 'diperbarui' : 'diunggah'} dan disimpan ke Supabase!`
      });
      setShowListingModal(false);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: 'Terjadi kesalahan saat menyimpan listing: ' + (err.message || 'Coba lagi')
      });
    } finally {
      setIsSavingListing(false);
    }
  };

  const handleDeleteListing = async (prop: PropertyItem) => {
    if (!window.confirm(`Hapus listing "${prop.title}" dari database dan website?`)) {
      return;
    }
    try {
      await deletePropertyFromSupabase(prop.id);
      onDeleteProperty?.(prop.id);
      setToastMessage({
        type: 'success',
        text: `Listing "${prop.title}" berhasil dihapus dari Supabase dan web.`
      });
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: 'Gagal menghapus listing: ' + err.message
      });
    }
  };

  const handleQuickStatusChange = async (prop: PropertyItem, newStatus: 'published' | 'draft' | 'sold') => {
    const updated: PropertyItem = { ...prop, status: newStatus };
    await savePropertyToSupabase(updated);
    onEditProperty?.(updated);
    setToastMessage({
      type: 'info',
      text: `Status "${prop.title}" diubah menjadi: ${newStatus === 'published' ? 'Tayang di Web' : newStatus === 'draft' ? 'Draf Simpanan' : 'Terjual / Deal'}`
    });
  };

  // Submit Quick Listing inside Dashboard
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingQuick(true);
    try {
      const res = await submitPropertyListing({
        userId: user.id,
        ownerName: user.fullName,
        ownerWhatsapp: user.phone || '081270008812',
        propertyType: quickSubType,
        region: quickSubRegion,
        address: quickSubAddress || `Kawasan ${quickSubRegion}, Batam`,
        price: quickSubPrice,
        landArea: 120,
        buildingArea: 90,
        legalStatus: quickSubLegal,
        uwtoDuration: 'Tahun 2050 (LMS BP Batam Valid)',
        intent: quickSubIntent,
        notes: 'Diajukan langsung via Dashboard Pengguna ARB',
      });

      if (res.success) {
        const newRecord: LocalSubmission = {
          id: 'sub_' + Date.now(),
          user_id: user.id,
          property_type: quickSubType,
          region: quickSubRegion,
          address: quickSubAddress || `Kawasan ${quickSubRegion}, Batam`,
          estimated_price: `Rp ${quickSubPrice}`,
          legal_status: quickSubLegal,
          uwto_duration: 'Tahun 2050',
          intent: quickSubIntent,
          created_at: new Date().toISOString(),
          status: 'review',
        };
        setSubmissions([newRecord, ...submissions]);
        setShowQuickSubmitModal(false);
        setQuickSubAddress('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Submit Quick Booking inside Dashboard
  const handleQuickBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingQuick(true);
    try {
      const agentObj = AGENTS_LIST.find((a) => a.id === quickBookAgent) || AGENTS_LIST[0];
      const res = await submitConsultationBooking({
        userId: user.id,
        name: user.fullName,
        phone: user.phone || '081270008812',
        agentId: `${agentObj.name} (${agentObj.specialty})`,
        timeSlot: quickBookTime,
        interests: quickBookInterest,
      });

      if (res.success) {
        const newBooking: LocalBooking = {
          id: 'book_' + Date.now(),
          user_id: user.id,
          client_name: user.fullName,
          whatsapp_number: user.phone || '081270008812',
          agent_id: `${agentObj.name} (${agentObj.specialty})`,
          preferred_time_slot: quickBookTime,
          property_interests: quickBookInterest,
          created_at: new Date().toISOString(),
          status: 'confirmed',
        };
        setBookings([newBooking, ...bookings]);
        setShowQuickBookingModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBookingQuick(false);
    }
  };

  // KPR Calculator Computation
  const kprCalculations = useMemo(() => {
    const price = Math.max(calcPropertyPrice, 100000000);
    const dpAmount = price * (calcDpPercent / 100);
    const loanAmount = price - dpAmount;
    const monthlyRate = (calcInterestRate / 100) / 12;
    const totalMonths = calcTenorYears * 12;

    let monthlyInstallment = 0;
    if (monthlyRate > 0) {
      monthlyInstallment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyInstallment = loanAmount / totalMonths;
    }

    const totalPayment = (monthlyInstallment * totalMonths) + dpAmount;
    const totalInterest = totalPayment - price;

    // Additional Batam Real Estate transaction fees
    const bphtbTax = Math.max(0, (price - 80000000) * 0.05); // BPHTB 5%
    const notaryFee = price * 0.01; // Notaris / AJB ~1%
    const bankProvisi = loanAmount * 0.01; // Provisi bank ~1%
    const totalEstimatedInitialCosts = dpAmount + bphtbTax + notaryFee + bankProvisi;

    return {
      price,
      dpAmount,
      loanAmount,
      monthlyInstallment,
      totalPayment,
      totalInterest,
      bphtbTax,
      notaryFee,
      bankProvisi,
      totalEstimatedInitialCosts,
    };
  }, [calcPropertyPrice, calcDpPercent, calcInterestRate, calcTenorYears]);

  // UWTO Calculator Computation
  const uwtoCalculations = useMemo(() => {
    const zone = UWTO_TARIFF_DATA[calcUwtoZoneIndex] || UWTO_TARIFF_DATA[0];
    const cost30Years = calcUwtoArea * zone.ratePerSqm30Years;
    const cost20Years = Math.round(cost30Years * (20 / 30));
    return {
      zone,
      cost30Years,
      cost20Years,
    };
  }, [calcUwtoArea, calcUwtoZoneIndex]);

  const getRoleBadge = (role: UserProfile['role']) => {
    switch (role) {
      case 'agen':
        return { label: 'Konsultan Agen Resmi', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'investor':
        return { label: 'Investor Prioritas', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'admin':
        return { label: 'Administrator Portal', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: 'Klien Pembeli / Penjual', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
  };

  const roleBadge = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-[#f8f9ff] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="fixed top-24 right-4 sm:right-6 z-50 max-w-md animate-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-900/95 text-white border-emerald-500/40' 
                : toastMessage.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-500/40'
                : 'bg-[#0051d5]/95 text-white border-blue-400/40'
            }`}>
              <span className="material-symbols-outlined text-[22px] shrink-0 mt-0.5">
                {toastMessage.type === 'success' ? 'check_circle' : toastMessage.type === 'error' ? 'error' : 'info'}
              </span>
              <div className="flex-1 text-xs leading-relaxed font-semibold">
                {toastMessage.text}
              </div>
              <button 
                onClick={() => setToastMessage(null)}
                className="text-white/60 hover:text-white cursor-pointer ml-1"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. Header Profile Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#eff4ff]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0051d5&color=fff`}
                  alt={user.fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-[#0051d5]/15 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white" title="Akun Aktif & Terverifikasi">
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0e1c2f] tracking-tight">
                    {user.fullName}
                  </h1>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Supabase Auth Aktif
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#44474c] mt-1 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">mail</span>
                    {user.email}
                  </span>
                  {user.phone && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">phone</span>
                        {user.phone}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  ID Supabase: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-600 text-[10px]">{user.id}</code>
                </p>
              </div>
            </div>

            {/* Quick Action Trigger Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 bg-[#0051d5] hover:bg-[#316bf3] active:scale-95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(0,81,213,0.25)] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_business</span>
                + Upload Listing Baru
              </button>

              <button
                onClick={() => setShowQuickSubmitModal(true)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-gray-200 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_home</span>
                Titip Cepat
              </button>

              <button
                onClick={() => setShowQuickBookingModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#eff4ff] hover:bg-[#dbe1ff] text-[#0051d5] text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-[#0051d5]/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                Jadwal Survei
              </button>

              <button
                onClick={async () => {
                  await signOutUser();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-red-200 transition-all cursor-pointer"
                title="Keluar dari akun"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-100">
            <div 
              onClick={() => setActiveTab('favorites')}
              className="bg-[#eff4ff]/60 hover:bg-[#eff4ff] rounded-2xl p-4 border border-[#0051d5]/15 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Properti Favorit</span>
                <span className="material-symbols-outlined text-[#0051d5] text-[20px] group-hover:scale-110 transition-transform">favorite</span>
              </div>
              <p className="text-2xl font-black text-[#0e1c2f] mt-1">{favoriteIds.length}</p>
              <p className="text-[11px] text-[#0051d5] font-semibold mt-1 truncate">
                Est. Rp {(totalFavoriteValue / 1000000000).toFixed(1)} Miliar
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('listings')}
              className="bg-[#eff4ff]/60 hover:bg-[#eff4ff] rounded-2xl p-4 border border-[#0051d5]/15 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Kelola Listing</span>
                <span className="material-symbols-outlined text-emerald-600 text-[20px] group-hover:scale-110 transition-transform">real_estate_agent</span>
              </div>
              <p className="text-2xl font-black text-[#0e1c2f] mt-1">{userManagedProperties.length}</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                {userManagedProperties.filter(p => p.status !== 'draft').length} Unit Tayang di Web
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('bookings')}
              className="bg-[#eff4ff]/60 hover:bg-[#eff4ff] rounded-2xl p-4 border border-[#0051d5]/15 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Jadwal Temu & Survei</span>
                <span className="material-symbols-outlined text-purple-600 text-[20px] group-hover:scale-110 transition-transform">event_available</span>
              </div>
              <p className="text-2xl font-black text-[#0e1c2f] mt-1">{bookings.length}</p>
              <p className="text-[11px] text-purple-700 font-semibold mt-1">
                Agen Siaga Terhubung
              </p>
            </div>

            <div 
              onClick={() => setActiveTab('kpr-uwto')}
              className="bg-[#eff4ff]/60 hover:bg-[#eff4ff] rounded-2xl p-4 border border-[#0051d5]/15 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">Simulasi KPR / UWTO</span>
                <span className="material-symbols-outlined text-amber-600 text-[20px] group-hover:scale-110 transition-transform">calculate</span>
              </div>
              <p className="text-lg font-black text-[#0e1c2f] mt-1">Tools Aktif</p>
              <p className="text-[11px] text-amber-700 font-semibold mt-1">
                BCA, Mandiri, BP Batam
              </p>
            </div>
          </div>
        </div>

        {/* 2. Main Dashboard Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Ringkasan MVP
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">favorite</span>
            Favorit ({favoriteIds.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('listings');
              setListingSubView('properties');
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'listings' || activeTab === 'submissions'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">real_estate_agent</span>
            Kelola Listing ({userManagedProperties.length})
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Jadwal Survei ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('kpr-uwto')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'kpr-uwto'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            Kalkulator KPR & UWTO
          </button>

          <button
            onClick={() => setActiveTab('role-tools')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'role-tools'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">work</span>
            Modul Peran: {user.role.toUpperCase()}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#0e1c2f] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            Pengaturan Akun
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW / BERANDA DASHBOARD                       */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="bg-white rounded-3xl p-6 border border-[#eff4ff] shadow-xs">
              <h2 className="text-sm font-bold text-[#0e1c2f] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] text-[20px]">bolt</span>
                Aksi Cepat Dashboard
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={handleOpenCreateModal}
                  className="p-3.5 rounded-2xl bg-[#0051d5] hover:bg-[#316bf3] text-white text-left transition-all shadow-sm group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-white text-[24px] mb-1 group-hover:scale-110 transition-transform">add_business</span>
                  <p className="text-xs font-bold text-white">+ Upload Listing Baru</p>
                  <p className="text-[10px] text-white/80">Input properti ke katalog</p>
                </button>

                <button
                  onClick={() => onNavigate('katalog-properti')}
                  className="p-3.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100 text-left transition-all border border-blue-100 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#0051d5] text-[24px] mb-1 group-hover:scale-110 transition-transform">explore</span>
                  <p className="text-xs font-bold text-[#0e1c2f]">Jelajahi Katalog</p>
                  <p className="text-[10px] text-gray-500">Cari rumah mewah & ruko</p>
                </button>

                <button
                  onClick={() => setActiveTab('kpr-uwto')}
                  className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100 text-left transition-all border border-amber-100 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-amber-600 text-[24px] mb-1 group-hover:scale-110 transition-transform">savings</span>
                  <p className="text-xs font-bold text-[#0e1c2f]">Simulasi KPR & UWTO</p>
                  <p className="text-[10px] text-gray-500">Hitung bunga & tarif BP Batam</p>
                </button>

                <button
                  onClick={() => setShowQuickBookingModal(true)}
                  className="p-3.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100 text-left transition-all border border-purple-100 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-purple-600 text-[24px] mb-1 group-hover:scale-110 transition-transform">calendar_clock</span>
                  <p className="text-xs font-bold text-[#0e1c2f]">Survei Bersama Agen</p>
                  <p className="text-[10px] text-gray-500">Pilih waktu & lokasi unit</p>
                </button>
              </div>
            </div>

            {/* Split Section: Pipeline & Latest Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left (2 cols): Submission Pipeline Status */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#eff4ff] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#0e1c2f] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0051d5] text-[20px]">account_tree</span>
                    Status Pelacakan Listing Saya (Pipeline Tracker)
                  </h3>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className="text-xs text-[#0051d5] font-semibold hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    Belum ada listing yang diajukan.
                  </div>
                ) : (
                  submissions.slice(0, 3).map((item, idx) => {
                    const statusText = item.status === 'published' 
                      ? 'Listing Aktif di Katalog' 
                      : item.status === 'appraisal' 
                      ? 'Survei & Foto HDR Tim ARB' 
                      : 'Verifikasi Legalitas & Fatwa BP Batam';
                    const stepIndex = item.status === 'published' ? 4 : item.status === 'appraisal' ? 3 : 2;

                    return (
                      <div key={item.id || idx} className="p-4 rounded-2xl bg-[#eff4ff]/40 border border-[#0051d5]/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-[#0051d5]">
                              {item.intent || 'Jual'}
                            </span>
                            <h4 className="font-bold text-sm text-[#0e1c2f] mt-1">{item.property_type}</h4>
                            <p className="text-xs text-gray-500">{item.address || item.region}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            {statusText}
                          </span>
                        </div>

                        {/* Pipeline Stepper */}
                        <div className="grid grid-cols-4 gap-1 pt-1 text-[10px] text-center font-semibold">
                          <div className={`p-1.5 rounded-lg ${stepIndex >= 1 ? 'bg-[#0051d5] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            1. Masuk
                          </div>
                          <div className={`p-1.5 rounded-lg ${stepIndex >= 2 ? 'bg-[#0051d5] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            2. Legalitas
                          </div>
                          <div className={`p-1.5 rounded-lg ${stepIndex >= 3 ? 'bg-[#0051d5] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            3. Foto & Nilai
                          </div>
                          <div className={`p-1.5 rounded-lg ${stepIndex >= 4 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            4. Tayang Web
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right (1 col): Assigned Consultant Card & Next Appointment */}
              <div className="bg-white rounded-3xl p-6 border border-[#eff4ff] shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0e1c2f] flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-purple-600 text-[20px]">support_agent</span>
                    Konsultan Properti Siaga
                  </h3>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
                    <img
                      src={AGENTS_LIST[1].photoUrl}
                      alt="Konsultan"
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#0e1c2f]">{AGENTS_LIST[1].name}</p>
                      <p className="text-[11px] text-purple-700 font-semibold">{AGENTS_LIST[1].role}</p>
                      <p className="text-[10px] text-gray-500">Spesialisasi: {AGENTS_LIST[1].specialty}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span>Rating Kepuasan</span>
                      <strong className="text-amber-600 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        5.0 (38 Klien)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100">
                      <span>Status Layanan</span>
                      <strong className="text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Online Siaga
                      </strong>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/6282391059216?text=${encodeURIComponent(`Halo Bu Dewi Lestari, saya ${user.fullName} ingin konsultasi properti dan legalitas Batam.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Chat WhatsApp Konsultan
                </a>
              </div>
            </div>

            {/* Recommended Properties Preview */}
            <div className="bg-white rounded-3xl p-6 border border-[#eff4ff] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0e1c2f]">Rekomendasi Properti Terbaru di Batam</h3>
                  <p className="text-xs text-gray-500">Pilihan unit residensial dan investasi dengan legalitas clean & clear</p>
                </div>
                <button
                  onClick={() => onNavigate('katalog-properti')}
                  className="text-xs text-[#0051d5] font-semibold hover:underline"
                >
                  Buka Katalog Lengkap ({properties.length} Unit)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.slice(0, 3).map((prop) => (
                  <div
                    key={prop.id}
                    onClick={() => onSelectProperty(prop)}
                    className="group rounded-2xl border border-gray-100 hover:border-[#0051d5]/30 overflow-hidden bg-white hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={prop.imageUrl}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#0e1c2f]/80 text-white">
                        {prop.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] text-[#0051d5] font-semibold">{prop.location}, {prop.district}</p>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0e1c2f] line-clamp-1 mt-0.5 group-hover:text-[#0051d5] transition-colors">
                        {prop.title}
                      </h4>
                      <p className="text-sm font-extrabold text-[#0051d5] mt-1">{prop.priceFormatted}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROPERTI FAVORIT                                   */}
        {/* ========================================================= */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0e1c2f]">
                  Koleksi Properti Favorit Anda ({favoriteProperties.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Total estimasi nilai portofolio tersimpan: <strong className="text-[#0e1c2f]">Rp {(totalFavoriteValue / 1000000000).toFixed(2)} Miliar</strong>
                </p>
              </div>
              <button
                onClick={() => onNavigate('katalog-properti')}
                className="inline-flex items-center gap-1.5 bg-[#0051d5] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#316bf3] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Tambah dari Katalog
              </button>
            </div>

            {favoriteProperties.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#eff4ff] shadow-xs">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-[#0051d5]">
                  <span className="material-symbols-outlined text-[32px]">favorite_border</span>
                </div>
                <h3 className="text-lg font-bold text-[#0e1c2f]">Belum Ada Properti yang Disimpan</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Tandai properti impian Anda di katalog dengan tombol favorit agar mudah ditinjau kembali kapan saja.
                </p>
                <button
                  onClick={() => onNavigate('katalog-properti')}
                  className="mt-6 inline-flex items-center gap-2 bg-[#0051d5] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#316bf3] shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                  Buka Katalog Properti Batam
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 border border-[#eff4ff] flex flex-col group"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={prop.imageUrl}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-[#0e1c2f]/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                        {prop.category}
                      </span>
                      <button
                        onClick={(e) => handleRemoveFavorite(prop.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                        title="Hapus dari Favorit"
                      >
                        <span className="material-symbols-outlined text-[18px]">favorite</span>
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-semibold text-[#0051d5] flex items-center gap-1 mb-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {prop.location}, {prop.district}
                        </div>
                        <a
                          href={getPropertyPath(prop.id)}
                          onClick={(e) => {
                            e.preventDefault();
                            onSelectProperty(prop);
                          }}
                          className="font-bold text-base text-[#0e1c2f] hover:text-[#0051d5] transition-colors line-clamp-1 cursor-pointer"
                        >
                          {prop.title}
                        </a>
                        <p className="text-lg font-extrabold text-[#0051d5] mt-2">
                          {prop.priceFormatted}
                          {prop.period && <span className="text-xs font-normal text-gray-500">{prop.period}</span>}
                        </p>

                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 my-3 text-[11px] text-gray-600 text-center">
                          <div>
                            <span className="block font-bold text-[#0e1c2f]">{prop.landArea} m²</span>
                            <span>Tanah</span>
                          </div>
                          <div>
                            <span className="block font-bold text-[#0e1c2f]">{prop.buildingArea} m²</span>
                            <span>Bangunan</span>
                          </div>
                          <div>
                            <span className="block font-bold text-[#0e1c2f]">{prop.uwtoExpiryYear}</span>
                            <span>UWTO</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => onSelectProperty(prop)}
                          className="flex-1 py-2 text-center rounded-xl bg-[#eff4ff] hover:bg-[#0051d5] text-[#0051d5] hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Lihat Detail Unit
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Halo, saya tertarik dengan listing ${prop.title} (${prop.priceFormatted}) di Batam: ${window.location.origin}${getPropertyPath(prop.id)}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                          title="Bagikan via WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[18px]">share</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: KELOLA & UPLOAD LISTING PROPERTI                    */}
        {/* ========================================================= */}
        {(activeTab === 'listings' || activeTab === 'submissions') && (
          <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="bg-white rounded-3xl p-6 border border-[#eff4ff] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[26px]">real_estate_agent</span>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0e1c2f]">
                    Kelola & Upload Listing Properti Batam
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                  Upload unit baru dengan foto & legalitas, perbarui harga/spesifikasi (Edit), atur status (Tayang / Draf / Terjual), dan simpan tersinkronisasi langsung ke Supabase Database.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 bg-[#0051d5] hover:bg-[#316bf3] active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(0,81,213,0.25)] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_business</span>
                  + Upload Listing Baru
                </button>

                <button
                  onClick={() => setShowQuickSubmitModal(true)}
                  className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_home</span>
                  Titip Cepat
                </button>
              </div>
            </div>

            {/* Sub-view switcher: Portofolio Listing vs Riwayat Pengajuan Titip */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setListingSubView('properties')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    listingSubView === 'properties'
                      ? 'bg-[#0051d5] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:text-[#0e1c2f] border border-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">apartment</span>
                  Portofolio Listing Web ({userManagedProperties.length})
                </button>

                <button
                  onClick={() => setListingSubView('submissions')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    listingSubView === 'submissions'
                      ? 'bg-[#0051d5] text-white shadow-xs'
                      : 'bg-white text-gray-600 hover:text-[#0e1c2f] border border-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">assignment</span>
                  Riwayat Pengajuan Titip ({submissions.length})
                </button>
              </div>

              {listingSubView === 'properties' && (
                <div className="text-xs text-gray-500 font-medium">
                  Menampilkan <strong className="text-[#0e1c2f]">{filteredManagedProperties.length}</strong> dari {userManagedProperties.length} unit
                </div>
              )}
            </div>

            {/* VIEW A: PORTOFOLIO LISTING WEB (Upload, Edit, Simpan, Hapus, Status) */}
            {listingSubView === 'properties' && (
              <div className="space-y-4">
                {/* Search & Filter Toolbar */}
                <div className="bg-white rounded-2xl p-4 border border-[#eff4ff] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Status Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setListingFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        listingFilter === 'all'
                          ? 'bg-[#0e1c2f] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Semua ({userManagedProperties.length})
                    </button>
                    <button
                      onClick={() => setListingFilter('published')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        listingFilter === 'published'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Tayang di Web ({userManagedProperties.filter((p) => p.status !== 'draft' && p.status !== 'sold').length})
                    </button>
                    <button
                      onClick={() => setListingFilter('draft')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        listingFilter === 'draft'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Draf Simpanan ({userManagedProperties.filter((p) => p.status === 'draft').length})
                    </button>
                    <button
                      onClick={() => setListingFilter('sold')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        listingFilter === 'sold'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Terjual / Deal ({userManagedProperties.filter((p) => p.status === 'sold').length})
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      placeholder="Cari judul atau lokasi..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#0051d5] focus:bg-white transition-colors"
                    />
                    {listingSearch && (
                      <button
                        onClick={() => setListingSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Listings Grid */}
                {filteredManagedProperties.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-[#eff4ff]">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0051d5]">
                      <span className="material-symbols-outlined text-[32px]">domain_disabled</span>
                    </div>
                    <h3 className="text-base font-bold text-[#0e1c2f]">Tidak Ada Listing Ditemukan</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      {listingSearch ? `Tidak ada listing yang cocok dengan kata kunci "${listingSearch}".` : 'Belum ada properti dalam kategori status ini.'}
                    </p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-5 inline-flex items-center gap-2 bg-[#0051d5] hover:bg-[#316bf3] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_business</span>
                      Upload Listing Baru
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredManagedProperties.map((prop) => {
                      const isDraft = prop.status === 'draft';
                      const isSold = prop.status === 'sold';
                      const statusLabel = isDraft ? 'Draf Simpanan' : isSold ? 'Terjual / Deal' : 'Tayang di Web';
                      const statusColor = isDraft
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : isSold
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                      return (
                        <div
                          key={prop.id}
                          className="bg-white rounded-2xl overflow-hidden border border-[#eff4ff] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Image Header with Badges */}
                            <div className="aspect-video relative overflow-hidden bg-gray-100">
                              <img
                                src={prop.imageUrl}
                                alt={prop.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md shadow-xs ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0e1c2f]/80 text-white backdrop-blur-md">
                                  {prop.category}
                                </span>
                              </div>
                              <span className="absolute top-2.5 right-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase shadow-xs">
                                {prop.intent || 'jual'}
                              </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-2.5">
                              <div>
                                <p className="text-[11px] font-semibold text-[#0051d5] flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                                  {prop.district} • {prop.location}
                                </p>
                                <h3 
                                  onClick={() => handleOpenEditModal(prop)}
                                  className="font-bold text-sm text-[#0e1c2f] line-clamp-1 mt-0.5 hover:text-[#0051d5] transition-colors cursor-pointer"
                                  title={prop.title}
                                >
                                  {prop.title}
                                </h3>
                                <p className="text-base font-black text-[#0051d5] mt-1">
                                  {prop.priceFormatted}
                                </p>
                              </div>

                              {/* Specs Bar */}
                              <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px] text-gray-600 text-center">
                                <div>
                                  <span className="font-bold text-[#0e1c2f] block">{prop.landArea} m²</span>
                                  <span>LT / Tanah</span>
                                </div>
                                <div>
                                  <span className="font-bold text-[#0e1c2f] block">{prop.buildingArea} m²</span>
                                  <span>LB / Bngn</span>
                                </div>
                                <div>
                                  <span className="font-bold text-[#0e1c2f] block">{prop.uwtoExpiryYear}</span>
                                  <span>UWTO</span>
                                </div>
                              </div>

                              {/* Rooms & Legal */}
                              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-gray-400">bed</span>
                                  {prop.bedrooms || 3} KT • {prop.bathrooms || 2} KM
                                </span>
                                <span className="truncate max-w-[130px] font-medium text-gray-600" title={prop.legalStatus}>
                                  {prop.legalStatus}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="p-4 pt-0 space-y-2 border-t border-gray-100 mt-2">
                            {/* Quick Status Selector */}
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase">Ubah Status:</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(prop, 'published')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    prop.status !== 'draft' && prop.status !== 'sold'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                  }`}
                                  title="Tayang di Katalog Web"
                                >
                                  Tayang
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(prop, 'draft')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    prop.status === 'draft'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                                  }`}
                                  title="Jadikan Draf Simpanan"
                                >
                                  Draf
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(prop, 'sold')}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                    prop.status === 'sold'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                  }`}
                                  title="Tandai Sudah Terjual"
                                >
                                  Deal
                                </button>
                              </div>
                            </div>

                            {/* Buttons: Edit, View on Web, Delete */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                onClick={() => handleOpenEditModal(prop)}
                                className="flex-1 py-2 px-3 rounded-xl bg-[#eff4ff] hover:bg-[#0051d5] text-[#0051d5] hover:text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit_square</span>
                                <span>Edit Listing</span>
                              </button>

                              <button
                                onClick={() => onSelectProperty(prop)}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                                title="Lihat Tampilan di Website"
                              >
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                              </button>

                              <button
                                onClick={() => handleDeleteListing(prop)}
                                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                title="Hapus Listing dari Supabase"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: RIWAYAT PENGAJUAN TITIP PROPERTI */}
            {listingSubView === 'submissions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#0e1c2f]">
                    Daftar Formulir Titip Properti Diajukan ({submissions.length})
                  </h3>
                  <button
                    onClick={() => setShowQuickSubmitModal(true)}
                    className="inline-flex items-center gap-1.5 bg-[#0051d5] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#316bf3] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_home</span>
                    Titip Properti Baru
                  </button>
                </div>

                {submissions.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-[#eff4ff]">
                    <p className="text-sm text-gray-500">Belum ada pengajuan titip properti.</p>
                  </div>
                ) : (
                  submissions.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#eff4ff] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0051d5] uppercase">
                            {sub.intent || 'Jual'}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {sub.status === 'published' ? 'Tayang di Web' : sub.status === 'appraisal' ? 'Appraisal & Foto HDR' : 'Verifikasi Legalitas ARB'}
                          </span>
                        </div>
                        <h3 className="font-bold text-[#0e1c2f] text-base sm:text-lg">{sub.property_type || 'Properti Batam'}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-gray-400">pin_drop</span>
                          {sub.address || sub.region}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                          <span>Harga Dititipkan: <strong className="text-[#0e1c2f]">{sub.estimated_price}</strong></span>
                          <span>Legalitas: <strong className="text-[#0e1c2f]">{sub.legal_status}</strong></span>
                          {sub.uwto_duration && <span>Status UWTO: <strong className="text-[#0e1c2f]">{sub.uwto_duration}</strong></span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/6282391059216?text=${encodeURIComponent(`Halo Tim ARB, saya ingin cek progres verifikasi pengajuan properti saya: ${sub.property_type} di ${sub.address || sub.region}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#eff4ff] hover:bg-[#0051d5] text-[#0051d5] hover:text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span>
                          Tanya Tim Legal ARB
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: JADWAL KONSULTASI & SURVEI                         */}
        {/* ========================================================= */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0e1c2f]">
                  Jadwal Survei Lapangan & Temu Notaris ({bookings.length})
                </h2>
                <p className="text-xs text-gray-500">Pendampingan survei privat dan konsultasi legalitas bersama konsultan resmi</p>
              </div>
              <button
                onClick={() => setShowQuickBookingModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#0051d5] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#316bf3] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                Jadwalkan Survei Baru
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#eff4ff]">
                <p className="text-sm text-gray-500">Belum ada jadwal survei yang dipesan.</p>
              </div>
            ) : (
              bookings.map((book, idx) => (
                <div
                  key={book.id || idx}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#eff4ff] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {book.preferred_time_slot || 'Segera Dikonfirmasi'}
                    </span>
                    <h3 className="font-bold text-[#0e1c2f] text-base">
                      Konsultasi bersama: {book.agent_id || 'Dewi Lestari (Senior Advisor)'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Topik Diskusi / Minat Unit: <strong>{book.property_interests || 'Legalitas UWTO & Survei Unit'}</strong>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Pemohon: {book.client_name} • WhatsApp: {book.whatsapp_number}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/6282391059216?text=${encodeURIComponent(`Halo Konsultan ARB, saya ${user.fullName} ingin konfirmasi agenda survei lapangan properti.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      Konfirmasi via WhatsApp
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: KALKULATOR KPR & UWTO INTERAKTIF                   */}
        {/* ========================================================= */}
        {activeTab === 'kpr-uwto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: KPR Calculator */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eff4ff] space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[22px]">calculate</span>
                  <h3 className="text-base font-bold text-[#0e1c2f]">Kalkulator Simulasi KPR Batam</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400">Bank Tier-1 Ready</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-bold text-[#0e1c2f]">Harga Properti (IDR)</label>
                    <span className="font-bold text-[#0051d5]">Rp {(calcPropertyPrice).toLocaleString('id-ID')}</span>
                  </div>
                  <input
                    type="range"
                    min="300000000"
                    max="10000000000"
                    step="50000000"
                    value={calcPropertyPrice}
                    onChange={(e) => setCalcPropertyPrice(Number(e.target.value))}
                    className="w-full accent-[#0051d5]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-[#0e1c2f] block mb-1">Uang Muka (DP %)</label>
                    <select
                      value={calcDpPercent}
                      onChange={(e) => setCalcDpPercent(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                    >
                      <option value={10}>10% (DP Ringan)</option>
                      <option value={15}>15%</option>
                      <option value={20}>20% (Umum)</option>
                      <option value={30}>30%</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#0e1c2f] block mb-1">Suku Bunga (%)</label>
                    <select
                      value={calcInterestRate}
                      onChange={(e) => setCalcInterestRate(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                    >
                      <option value={4.25}>4.25% (Promo BCA)</option>
                      <option value={5.5}>5.50% (Mandiri Fix)</option>
                      <option value={6.75}>6.75% (BNI / CIMB)</option>
                      <option value={8.5}>8.50% (Floating)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#0e1c2f] block mb-1">Tenor Kredit</label>
                    <select
                      value={calcTenorYears}
                      onChange={(e) => setCalcTenorYears(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                    >
                      <option value={5}>5 Tahun</option>
                      <option value={10}>10 Tahun</option>
                      <option value={15}>15 Tahun</option>
                      <option value={20}>20 Tahun</option>
                      <option value={25}>25 Tahun</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Results Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0e1c2f] to-[#0051d5] text-white space-y-3">
                  <div>
                    <span className="text-[11px] text-white/80">Estimasi Cicilan Bulanan</span>
                    <p className="text-2xl font-black tracking-tight">
                      Rp {Math.round(kprCalculations.monthlyInstallment).toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-white/80"> / bulan</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-[11px]">
                    <div>
                      <span className="text-white/70 block">Plafon Pinjaman Bank</span>
                      <strong>Rp {Math.round(kprCalculations.loanAmount).toLocaleString('id-ID')}</strong>
                    </div>
                    <div>
                      <span className="text-white/70 block">Uang Muka (DP {calcDpPercent}%)</span>
                      <strong>Rp {Math.round(kprCalculations.dpAmount).toLocaleString('id-ID')}</strong>
                    </div>
                    <div>
                      <span className="text-white/70 block">Pajak BPHTB (5%)</span>
                      <strong>Rp {Math.round(kprCalculations.bphtbTax).toLocaleString('id-ID')}</strong>
                    </div>
                    <div>
                      <span className="text-white/70 block">Estimasi Biaya Awal Total</span>
                      <strong className="text-emerald-300">Rp {Math.round(kprCalculations.totalEstimatedInitialCosts).toLocaleString('id-ID')}</strong>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/6282391059216?text=${encodeURIComponent(`Halo Tim KPR ARB, saya ingin konsultasi pengajuan KPR untuk properti seharga Rp ${calcPropertyPrice.toLocaleString('id-ID')} dengan cicilan sekitar Rp ${Math.round(kprCalculations.monthlyInstallment).toLocaleString('id-ID')}/bulan.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  Ajukan Pre-Approval KPR ke Bank Rekanan
                </a>
              </div>
            </div>

            {/* Right: UWTO BP Batam Calculator */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eff4ff] space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[22px]">history_edu</span>
                  <h3 className="text-base font-bold text-[#0e1c2f]">Kalkulator Tarif UWTO BP Batam</h3>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Tarif Resmi LMS</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#0e1c2f] block mb-1">Zona Wilayah BP Batam</label>
                  <select
                    value={calcUwtoZoneIndex}
                    onChange={(e) => setCalcUwtoZoneIndex(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                  >
                    {UWTO_TARIFF_DATA.map((z, idx) => (
                      <option key={idx} value={idx}>
                        {z.zone} (Rp {z.ratePerSqm30Years.toLocaleString('id-ID')} / m²)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">{uwtoCalculations.zone.desc}</p>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-bold text-[#0e1c2f]">Luas Tanah (LT)</label>
                    <span className="font-bold text-[#0051d5]">{calcUwtoArea} m²</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="2000"
                    step="10"
                    value={calcUwtoArea}
                    onChange={(e) => setCalcUwtoArea(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>

                {/* UWTO Results Card */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-[#0e1c2f] space-y-2">
                  <span className="text-[11px] text-amber-800 font-semibold">Estimasi Tarif UWTO Resmi BP Batam:</span>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs">Perpanjangan 30 Tahun:</span>
                    <strong className="text-sm text-amber-900 font-black">
                      Rp {uwtoCalculations.cost30Years.toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200">
                    <span className="text-xs">Perpanjangan 20 Tahun:</span>
                    <strong className="text-sm text-amber-900 font-black">
                      Rp {uwtoCalculations.cost20Years.toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600 leading-relaxed">
                  💡 <strong>Catatan Legalitas:</strong> Biaya di atas belum termasuk jasa notaris/PPAT dan faktur LMS BP Batam. Tim legalitas ARB siap mendampingi proses validasi sertifikat dan penerbitan faktur UWTO sampai tuntas.
                </div>

                <a
                  href={`https://wa.me/6282391059216?text=${encodeURIComponent(`Halo Tim Legal ARB, saya ingin konsultasi perpanjangan UWTO tanah luas ${calcUwtoArea} m² di kawasan ${uwtoCalculations.zone.zone}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0e1c2f] hover:bg-[#0051d5] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">gavel</span>
                  Konsultasi Legalitas & LMS BP Batam
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: MODUL SPESIFIK BERDASARKAN PERAN PENGGUNA          */}
        {/* ========================================================= */}
        {activeTab === 'role-tools' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eff4ff] space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0e1c2f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[24px]">workspace_premium</span>
                  Modul Khusus: {roleBadge.label}
                </h3>
                <p className="text-xs text-gray-500">Fitur dirancang sesuai kebutuhan peran akun Anda</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${roleBadge.color}`}>
                Mode {user.role.toUpperCase()}
              </span>
            </div>

            {/* Sub-view for KLIEN */}
            {user.role === 'klien' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[24px]">verified_user</span>
                  <h4 className="font-bold text-sm text-[#0e1c2f]">Jaminan Bebas Sengketa</h4>
                  <p className="text-xs text-gray-600">Seluruh unit listing di Aset Rumah Batam melewati due-diligence legalitas 4 pilar di BPN & BP Batam.</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[24px]">price_change</span>
                  <h4 className="font-bold text-sm text-[#0e1c2f]">Alert Penurunan Harga</h4>
                  <p className="text-xs text-gray-600">Dapatkan notifikasi jika listing favorit Anda mengalami penyesuaian harga dari pemilik.</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[24px]">description</span>
                  <h4 className="font-bold text-sm text-[#0e1c2f]">Draft Akta & Dokumen</h4>
                  <p className="text-xs text-gray-600">Akses format checklist AJB, Fatwa Planologi, dan formulir perpanjangan UWTO resmi.</p>
                </div>
              </div>
            )}

            {/* Sub-view for AGEN */}
            {user.role === 'agen' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                    <span className="text-xs text-gray-500 font-semibold">Estimasi Saldo Komisi Listing</span>
                    <p className="text-2xl font-black text-emerald-800">Rp 48.500.000</p>
                    <p className="text-[11px] text-emerald-700">Standar AREBI 2.5% Closing Transaksi</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                    <span className="text-xs text-gray-500 font-semibold">Leads Klien Masuk</span>
                    <p className="text-2xl font-black text-[#0e1c2f]">14 Calon Buyer</p>
                    <p className="text-[11px] text-gray-500">6 Menunggu Jadwal Survei</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                    <span className="text-xs text-gray-500 font-semibold">Akreditasi Agen</span>
                    <p className="text-sm font-bold text-emerald-800 mt-2">AREBI Certified No. 4921</p>
                    <p className="text-[11px] text-emerald-600">Aktif s/d 2027</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <h4 className="font-bold text-xs text-[#0e1c2f] uppercase mb-2">Tindakan Cepat Agen:</h4>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowQuickSubmitModal(true)} className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold">
                      + Input Listing Portofolio Baru
                    </button>
                    <button onClick={() => setActiveTab('bookings')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                      Kelola Janji Temu Klien
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view for INVESTOR */}
            {user.role === 'investor' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                    <span className="text-xs text-gray-500 font-semibold">Rata-rata Yield Sewa Ruko</span>
                    <p className="text-2xl font-black text-purple-800">7.8% - 9.2% / thn</p>
                    <p className="text-[11px] text-purple-700">Pusat Bisnis Nagoya & Batam Center</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                    <span className="text-xs text-gray-500 font-semibold">Regulasi Kepemilikan WNA</span>
                    <p className="text-sm font-bold text-[#0e1c2f] mt-1">PP No. 18 / 2021 (Hak Pakai)</p>
                    <p className="text-[11px] text-gray-500">Paspor & Visa Valid Tanpa Perlu PT PMA</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                    <span className="text-xs text-gray-500 font-semibold">Peluang Capital Gain</span>
                    <p className="text-2xl font-black text-emerald-700">12.5% / thn</p>
                    <p className="text-[11px] text-gray-500">Kawasan KEK Nongsa & Kabil FTZ</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view for ADMIN */}
            {user.role === 'admin' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                    <span className="text-[11px] text-rose-700 font-semibold">Total Pengguna</span>
                    <p className="text-xl font-black text-rose-900 mt-0.5">184 Akun</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                    <span className="text-[11px] text-blue-700 font-semibold">Listing Database</span>
                    <p className="text-xl font-black text-blue-900 mt-0.5">{properties.length} Properti</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[11px] text-emerald-700 font-semibold">Antrean Verifikasi</span>
                    <p className="text-xl font-black text-emerald-900 mt-0.5">{submissions.length} Pengajuan</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                    <span className="text-[11px] text-purple-700 font-semibold">Status Supabase</span>
                    <p className="text-xs font-bold text-purple-900 mt-1">🟢 Connected</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: PENGATURAN PROFIL & AKUN SUPABASE                   */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supabase Profile Edit Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eff4ff] space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0051d5] text-[22px]">manage_accounts</span>
                  <h3 className="text-base font-bold text-[#0e1c2f]">Kelola Profil & Supabase Auth</h3>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Supabase Live
                </span>
              </div>

              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {profileMsg.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingProfile(true);
                  setProfileMsg(null);
                  try {
                    const res = await updateUserProfile({
                      fullName: editFullName,
                      phone: editPhone,
                      role: editRole,
                    });
                    if (res.success && res.user) {
                      onUpdateUser(res.user);
                      setProfileMsg({ type: 'success', text: 'Profil berhasil diperbarui di Supabase database!' });
                    } else {
                      setProfileMsg({ type: 'error', text: res.message || 'Gagal menyimpan profil.' });
                    }
                  } catch (err: any) {
                    setProfileMsg({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Email Terdaftar (Supabase Auth)</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Email terikat ke akun Supabase Auth Anda.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0e1c2f] mb-1">Peran Akun</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserProfile['role'])}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  >
                    <option value="klien">👤 Klien (Pembeli / Penjual Properti)</option>
                    <option value="agen">👔 Agen (Konsultan Properti Resmi)</option>
                    <option value="investor">💼 Investor (Pemodal Real Estat)</option>
                    <option value="admin">🛡️ Administrator (Akses Penuh Portal)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Simpan Perubahan ke Supabase</span>
                    </>
                  )}
                </button>
              </form>

              {/* Password Change Form */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-[#0e1c2f] uppercase tracking-wider mb-2">Ganti Kata Sandi Akun</h4>
                
                {passwordMsg && (
                  <div
                    className={`p-3 mb-3 rounded-xl text-xs flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {passwordMsg.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (newPassword.length < 6) {
                      setPasswordMsg({ type: 'error', text: 'Kata sandi minimal 6 karakter.' });
                      return;
                    }
                    setSavingPassword(true);
                    setPasswordMsg(null);
                    try {
                      const res = await updateUserPassword(newPassword);
                      if (res.success) {
                        setPasswordMsg({ type: 'success', text: res.message });
                        setNewPassword('');
                      } else {
                        setPasswordMsg({ type: 'error', text: res.message });
                      }
                    } catch (err: any) {
                      setPasswordMsg({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
                    } finally {
                      setSavingPassword(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kata sandi baru (min. 6 karakter)"
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0051d5]"
                  />
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full py-2 px-4 rounded-xl bg-gray-900 hover:bg-[#0051d5] text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {savingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi di Supabase'}
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Demo Switcher for Testing Roles */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eff4ff]">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">switch_account</span>
                <h3 className="text-base font-bold text-[#0e1c2f]">Ganti Peran Demo (Testing Cepat)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Anda dapat beralih peran seketika untuk menguji tampilan dashboard MVP dari sudut pandang Klien, Agen, Investor, atau Admin tanpa perlu logout.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => onUpdateUser(demoLogin('klien'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'klien' ? 'border-[#0051d5] bg-blue-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">👤 Budi Santoso (Klien Prioritas)</p>
                    <p className="text-[11px] text-gray-500">Mencari rumah tinggal & investasi di Batam</p>
                  </div>
                  {user.role === 'klien' && <span className="text-xs text-[#0051d5] font-bold">Sedang Aktif</span>}
                </button>

                <button
                  onClick={() => onUpdateUser(demoLogin('agen'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'agen' ? 'border-emerald-500 bg-emerald-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">👔 Hendra Wijaya (Konsultan Agen)</p>
                    <p className="text-[11px] text-gray-500">Spesialis legalitas UWTO BP Batam</p>
                  </div>
                  {user.role === 'agen' && <span className="text-xs text-emerald-600 font-bold">Sedang Aktif</span>}
                </button>

                <button
                  onClick={() => onUpdateUser(demoLogin('investor'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'investor' ? 'border-purple-500 bg-purple-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">💼 Michael Tan (Investor Internasional)</p>
                    <p className="text-[11px] text-gray-500">Fokus pada ruko komersial & lahan industri</p>
                  </div>
                  {user.role === 'investor' && <span className="text-xs text-purple-600 font-bold">Sedang Aktif</span>}
                </button>

                <button
                  onClick={() => onUpdateUser(demoLogin('admin'))}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    user.role === 'admin' ? 'border-rose-500 bg-rose-50/60 font-bold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#0e1c2f]">🛡️ Admin Utama (Administrator)</p>
                    <p className="text-[11px] text-gray-500">Akses penuh pengelolaan listing & pengguna</p>
                  </div>
                  {user.role === 'admin' && <span className="text-xs text-rose-600 font-bold">Sedang Aktif</span>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* QUICK MODAL 1: TITIP PROPERTI CEPAT                       */}
      {/* ========================================================= */}
      {showQuickSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5] text-[22px]">add_home</span>
                <h3 className="text-base font-bold text-[#0e1c2f]">Titip Properti Langsung</h3>
              </div>
              <button
                onClick={() => setShowQuickSubmitModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Tujuan Pengajuan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickSubIntent('jual')}
                    className={`py-2 rounded-xl font-bold cursor-pointer transition-all ${
                      quickSubIntent === 'jual'
                        ? 'bg-[#0051d5] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Titip Jual
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickSubIntent('sewa')}
                    className={`py-2 rounded-xl font-bold cursor-pointer transition-all ${
                      quickSubIntent === 'sewa'
                        ? 'bg-[#0051d5] text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Titip Sewa
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Tipe / Kategori Properti</label>
                <select
                  value={quickSubType}
                  onChange={(e) => setQuickSubType(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                >
                  <option value="Perumahan Residensial">Perumahan Residensial</option>
                  <option value="Rumah Mewah">Rumah Mewah</option>
                  <option value="Ruko Komersial">Ruko Komersial</option>
                  <option value="Apartemen">Apartemen Penthouse</option>
                  <option value="Tanah Kavling">Tanah Kavling</option>
                  <option value="Villa Waterfront">Villa Waterfront</option>
                  <option value="Gudang Industri">Gudang Industri</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Kawasan Wilayah Batam</label>
                <select
                  value={quickSubRegion}
                  onChange={(e) => setQuickSubRegion(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                >
                  <option value="Batam Center">Batam Center</option>
                  <option value="Sukajadi">Sukajadi / KDA</option>
                  <option value="Nagoya / Lubuk Baja">Nagoya / Lubuk Baja</option>
                  <option value="Nongsa">Nongsa Waterfront</option>
                  <option value="Sekupang / Tiban">Sekupang / Tiban</option>
                  <option value="Batu Aji / Marina">Batu Aji / Marina</option>
                  <option value="Kabil / Punggur">Kabil / Punggur</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Nama Kompleks / Alamat</label>
                <input
                  type="text"
                  value={quickSubAddress}
                  onChange={(e) => setQuickSubAddress(e.target.value)}
                  placeholder="Misal: Perumahan Orchard Park Blok C"
                  required
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Estimasi Harga (IDR)</label>
                <input
                  type="text"
                  value={quickSubPrice}
                  onChange={(e) => setQuickSubPrice(e.target.value)}
                  placeholder="Misal: 1.850.000.000"
                  required
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Status Sertifikat</label>
                <select
                  value={quickSubLegal}
                  onChange={(e) => setQuickSubLegal(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                >
                  <option value="Sertifikat HGB Murni (BPN)">Sertifikat HGB Murni (BPN)</option>
                  <option value="Sertifikat Hak Milik (SHM)">Sertifikat Hak Milik (SHM)</option>
                  <option value="Hak Pakai / Strata Title">Hak Pakai / Strata Title</option>
                  <option value="Alokasi BP Batam / SKEP SPJ">Alokasi BP Batam / SKEP SPJ</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickSubmitModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuick}
                  className="px-5 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingQuick ? 'Menyimpan...' : 'Kirim ke Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUICK MODAL 2: JADWALKAN SURVEI PROPERTI                  */}
      {/* ========================================================= */}
      {showQuickBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 text-[22px]">calendar_add_on</span>
                <h3 className="text-base font-bold text-[#0e1c2f]">Jadwalkan Survei / Temu Agen</h3>
              </div>
              <button
                onClick={() => setShowQuickBookingModal(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Pilih Konsultan Spesialis</label>
                <select
                  value={quickBookAgent}
                  onChange={(e) => setQuickBookAgent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                >
                  {AGENTS_LIST.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} — {ag.specialty} ({ag.districts})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Waktu Preferensi Temu</label>
                <select
                  value={quickBookTime}
                  onChange={(e) => setQuickBookTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                >
                  <option value="Pagi (09:00 - 11:30 WIB)">Pagi (09:00 - 11:30 WIB)</option>
                  <option value="Siang (13:30 - 15:30 WIB)">Siang (13:30 - 15:30 WIB)</option>
                  <option value="Sore (16:00 - 17:30 WIB)">Sore (16:00 - 17:30 WIB)</option>
                  <option value="Akhir Pekan (Sabtu / Minggu)">Akhir Pekan (Sabtu / Minggu)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Topik Diskusi / Unit yang Ingin Disurvei</label>
                <input
                  type="text"
                  value={quickBookInterest}
                  onChange={(e) => setQuickBookInterest(e.target.value)}
                  placeholder="Misal: Survei Rumah Sukajadi & Simulasi KPR BCA"
                  required
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickBookingModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isBookingQuick}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isBookingQuick ? 'Memproses...' : 'Konfirmasi Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: UPLOAD & EDIT LISTING PROPERTI SUPABASE          */}
      {/* ========================================================= */}
      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#eff4ff]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0051d5] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">
                    {listingModalMode === 'create' ? 'add_business' : 'edit_document'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0e1c2f]">
                    {listingModalMode === 'create' ? 'Upload Listing Properti Baru' : 'Edit Listing Properti'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Disimpan real-time ke Supabase & katalog portal Aset Rumah Batam
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowListingModal(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveListing} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* Section 1: Transaksi & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Tipe Transaksi</label>
                  <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setFormIntent('jual')}
                      className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        formIntent === 'jual' ? 'bg-[#0051d5] text-white shadow-xs' : 'text-gray-600 hover:text-[#0e1c2f]'
                      }`}
                    >
                      Jual
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIntent('sewa')}
                      className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        formIntent === 'sewa' ? 'bg-[#0051d5] text-white shadow-xs' : 'text-gray-600 hover:text-[#0e1c2f]'
                      }`}
                    >
                      Sewa
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Status Publikasi</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                  >
                    <option value="published">🟢 Tayang di Web</option>
                    <option value="draft">🟡 Draf Simpanan</option>
                    <option value="sold">🔵 Terjual / Deal</option>
                  </select>
                </div>

                <div className="flex items-center pt-5 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="rounded accent-[#0051d5] w-4 h-4 cursor-pointer"
                    />
                    <span>Unit Unggulan (Featured)</span>
                  </label>
                </div>
              </div>

              {/* Section 2: Judul & Kategori & Lokasi */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">
                    Judul Listing Properti <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Rumah Mewah 2 Lantai Siap Huni Hook di Central Hills"
                    required
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#0051d5] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0e1c2f] mb-1">Kategori Properti</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                    >
                      <option value="Perumahan Residensial">Perumahan Residensial</option>
                      <option value="Rumah Mewah">Rumah Mewah</option>
                      <option value="Ruko Komersial">Ruko Komersial</option>
                      <option value="Apartemen">Apartemen Penthouse</option>
                      <option value="Tanah Kavling">Tanah Kavling</option>
                      <option value="Villa Waterfront">Villa Waterfront</option>
                      <option value="Gudang Industri">Gudang Industri</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0e1c2f] mb-1">Distrik Wilayah Batam</label>
                    <select
                      value={formDistrict}
                      onChange={(e) => {
                        setFormDistrict(e.target.value);
                        if (!formLocation || formLocation === formDistrict) {
                          setFormLocation(e.target.value);
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                    >
                      {DISTRICTS_LIST.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Nama Kompleks / Alamat Spesifik</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => {
                      setFormAddress(e.target.value);
                      setFormLocation(e.target.value);
                    }}
                    placeholder="Contoh: Perumahan Orchard Park Blok C-08, Batam Center"
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#0051d5] focus:bg-white"
                  />
                </div>
              </div>

              {/* Section 3: Harga Properti */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0e1c2f]">
                      Harga (IDR) <span className="text-red-500">*</span>
                    </label>
                    <span className="font-black text-[#0051d5] text-[11px]">
                      {Number(formPrice.replace(/\D/g, '') || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="Misal: 1850000000"
                    required
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Keterangan Tambahan / Periode</label>
                  <input
                    type="text"
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value)}
                    placeholder={formIntent === 'sewa' ? 'Misal: / tahun atau / bulan' : 'Opsional (misal: Nego Tipis)'}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs"
                  />
                </div>
              </div>

              {/* Section 4: Foto Properti (Unggah Fleksibel) */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#0e1c2f] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#0051d5] text-[18px]">photo_camera</span>
                    Foto Properti Utama
                  </label>
                  <span className="text-[10px] text-gray-500">File upload / Preset pilihan</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* Photo Preview */}
                  <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-gray-200 relative shrink-0 shadow-xs border border-gray-200">
                    <img
                      src={formImageUrl}
                      alt="Pratinjau"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                      Preview
                    </span>
                  </div>

                  {/* Upload File Input & Custom URL */}
                  <div className="flex-1 w-full space-y-2">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-700 block mb-1">
                        1. Unggah File Foto dari Perangkat:
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="w-full text-xs text-gray-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0051d5] file:text-white hover:file:bg-[#316bf3] file:cursor-pointer cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-gray-700 block mb-1">
                        2. Atau Masukkan URL Gambar:
                      </span>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 rounded-xl bg-white border border-gray-200 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Photo Selector */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-700 block mb-1.5">
                    3. Atau Pilih Cepat Foto Contoh Arsitektur Batam:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`rounded-lg overflow-hidden border-2 transition-all p-0.5 text-left cursor-pointer group ${
                          formImageUrl === preset.url ? 'border-[#0051d5] ring-2 ring-[#0051d5]/30' : 'border-transparent hover:border-gray-300'
                        }`}
                        title={preset.title}
                      >
                        <div className="aspect-video relative rounded overflow-hidden">
                          <img
                            src={preset.url}
                            alt={preset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <span className="text-[9px] font-medium text-gray-700 truncate block mt-0.5 px-0.5">
                          {preset.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 5: Spesifikasi Dimensi & Ruangan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Luas Tanah (LT m²)</label>
                  <input
                    type="number"
                    value={formLandArea}
                    onChange={(e) => setFormLandArea(e.target.value)}
                    placeholder="120"
                    min="1"
                    required
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Luas Bangunan (LB m²)</label>
                  <input
                    type="number"
                    value={formBuildingArea}
                    onChange={(e) => setFormBuildingArea(e.target.value)}
                    placeholder="90"
                    min="1"
                    required
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Kamar Tidur (KT)</label>
                  <input
                    type="number"
                    value={formBedrooms}
                    onChange={(e) => setFormBedrooms(e.target.value)}
                    placeholder="3"
                    min="0"
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Kamar Mandi (KM)</label>
                  <input
                    type="number"
                    value={formBathrooms}
                    onChange={(e) => setFormBathrooms(e.target.value)}
                    placeholder="2"
                    min="0"
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                  />
                </div>
              </div>

              {/* Section 6: Legalitas & Siklus UWTO BP Batam */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Status Sertifikat</label>
                  <select
                    value={formLegalStatus}
                    onChange={(e) => setFormLegalStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold"
                  >
                    <option value="Sertifikat HGB Murni (BPN)">Sertifikat HGB Murni (BPN)</option>
                    <option value="Sertifikat Hak Milik (SHM)">Sertifikat Hak Milik (SHM)</option>
                    <option value="Hak Pakai WNA (PP 18/2021)">Hak Pakai WNA (PP 18/2021)</option>
                    <option value="Alokasi BP Batam / SKEP SPJ">Alokasi BP Batam / SKEP SPJ</option>
                    <option value="Strata Title Apartemen">Strata Title Apartemen</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Tahun Berakhir UWTO</label>
                  <input
                    type="number"
                    value={formUwtoYear}
                    onChange={(e) => {
                      setFormUwtoYear(e.target.value);
                      setFormUwtoStatus(`Aktif s/d ${e.target.value} (LMS BP Batam Valid)`);
                    }}
                    placeholder="2052"
                    min="2024"
                    max="2080"
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0e1c2f] mb-1">Status Validitas UWTO</label>
                  <input
                    type="text"
                    value={formUwtoStatus}
                    onChange={(e) => setFormUwtoStatus(e.target.value)}
                    placeholder="Aktif s/d 2052 (LMS Valid)"
                    className="w-full p-2.5 rounded-xl bg-white border border-gray-200 text-xs"
                  />
                </div>
              </div>

              {/* Section 7: Fasilitas */}
              <div>
                <label className="block font-bold text-[#0e1c2f] mb-2">
                  Fasilitas & Keunggulan Properti (Pilih yang tersedia)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_FACILITIES.map((fac) => {
                    const isSelected = formFacilities.includes(fac);
                    return (
                      <button
                        key={fac}
                        type="button"
                        onClick={() => handleToggleFacility(fac)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#0051d5] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isSelected ? 'check' : 'add'}
                        </span>
                        {fac}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 8: Deskripsi */}
              <div>
                <label className="block font-bold text-[#0e1c2f] mb-1">Deskripsi Properti</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Jelaskan keunggulan unit, kondisi bangunan, aksesibilitas fasilitas umum di Batam..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:border-[#0051d5] focus:bg-white leading-relaxed"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowListingModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSavingListing}
                  className="px-6 py-2.5 rounded-xl bg-[#0051d5] hover:bg-[#316bf3] text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md"
                >
                  {isSavingListing ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                      <span>{listingModalMode === 'create' ? 'Upload & Simpan Listing' : 'Simpan Perubahan Listing'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
