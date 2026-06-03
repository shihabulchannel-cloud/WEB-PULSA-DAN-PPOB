export function formatCurrency(amount: number | null | undefined): string {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'success': case 'paid': case 'approved': case 'active':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'pending': case 'waiting': case 'process':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'failed': case 'rejected': case 'inactive':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

export function getStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'success': return 'Sukses';
    case 'pending': return 'Menunggu';
    case 'process': return 'Diproses';
    case 'failed': return 'Gagal';
    case 'paid': return 'Dibayar';
    case 'approved': return 'Disetujui';
    case 'rejected': return 'Ditolak';
    case 'waiting': return 'Menunggu';
    default: return status || '-';
  }
}
