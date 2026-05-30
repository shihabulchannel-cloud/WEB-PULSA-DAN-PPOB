import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
};

export const generateInvoiceNo = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${dateStr}-${rand}`;
};

export const maskPhoneNumber = (phone: string): string => {
  if (phone.length < 8) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-4);
};

export const maskEmail = (email: string): string => {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return user.slice(0, 2) + '***@' + domain;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600 bg-green-50 border-green-200';
    case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'failed': return 'text-red-600 bg-red-50 border-red-200';
    case 'expired': return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'refunded': return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'paid': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    success: 'Berhasil',
    pending: 'Menunggu',
    processing: 'Diproses',
    failed: 'Gagal',
    expired: 'Kadaluarsa',
    refunded: 'Dikembalikan',
    paid: 'Dibayar',
  };
  return labels[status] || status;
};

export const getCategoryIcon = (iconName: string): string => {
  const icons: Record<string, string> = {
    Gamepad2: 'Gamepad2',
    Phone: 'Phone',
    Wifi: 'Wifi',
    Wallet: 'Wallet',
    FileText: 'FileText',
    Ticket: 'Ticket',
  };
  return icons[iconName] || 'Package';
};
