import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, XCircle, Download, Share2, ArrowLeft, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/lib/utils-app';

interface Transaction {
  id: string; invoice_no: string; product_name: string; target_id: string;
  customer_name: string; customer_email: string; total_amount: number;
  sell_price: number; payment_fee: number; payment_method_name: string;
  payment_status: string; digiflazz_status: string; digiflazz_sn: string;
  status: string; payment_url: string; created_at: string;
}

export default function TransactionPage() {
  const { invoiceNo } = useParams<{ invoiceNo: string }>();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: transaction, refetch, isLoading } = useQuery<Transaction>({
    queryKey: ['transaction', invoiceNo],
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('invoice_no', invoiceNo)
        .maybeSingle();
      return data;
    },
    enabled: !!invoiceNo,
    refetchInterval: (data) => {
      if (!data) return false;
      const tx = data as unknown as Transaction;
      if (tx?.status === 'pending' || tx?.status === 'processing') return 5000;
      return false;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const statusIcon = {
    success: <CheckCircle2 className="w-16 h-16 text-green-500" />,
    pending: <Clock className="w-16 h-16 text-yellow-500 animate-pulse-slow" />,
    processing: <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />,
    failed: <XCircle className="w-16 h-16 text-destructive" />,
  };

  if (isLoading) return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </MainLayout>
  );

  if (!transaction) return (
    <MainLayout>
      <div className="container mx-auto px-4 py-20 text-center max-w-xl">
        <XCircle className="w-12 h-12 mx-auto mb-3 text-destructive/50" />
        <h2 className="font-bold text-xl text-foreground mb-2">Transaksi Tidak Ditemukan</h2>
        <p className="text-muted-foreground text-sm mb-6">Nomor invoice tidak valid atau transaksi tidak ditemukan.</p>
        <Link to="/"><Button>Kembali ke Beranda</Button></Link>
      </div>
    </MainLayout>
  );

  return (
    <>
      <Helmet>
        <title>Transaksi {transaction.invoice_no} — SHIELACOM CELL</title>
      </Helmet>
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-xl">
          {/* Back */}
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 no-print">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>

          {/* Invoice */}
          <div ref={printRef} className="bg-card rounded-2xl border border-border shadow-brand overflow-hidden">
            {/* Header */}
            <div className={`p-6 text-center ${
              transaction.status === 'success' ? 'bg-green-50' :
              transaction.status === 'failed' ? 'bg-red-50' :
              'bg-yellow-50'
            }`}>
              <div className="flex justify-center mb-3">
                {statusIcon[transaction.status as keyof typeof statusIcon] || statusIcon.pending}
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {transaction.status === 'success' ? 'Transaksi Berhasil!' :
                 transaction.status === 'failed' ? 'Transaksi Gagal' :
                 transaction.status === 'processing' ? 'Sedang Diproses...' :
                 'Menunggu Pembayaran'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{transaction.invoice_no}</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <DetailRow label="Produk" value={transaction.product_name} bold />
              <DetailRow label="Tujuan" value={transaction.target_id} />
              {transaction.digiflazz_sn && <DetailRow label="Serial Number" value={transaction.digiflazz_sn} bold />}
              {transaction.customer_name && <DetailRow label="Nama" value={transaction.customer_name} />}
              <DetailRow label="Metode Bayar" value={transaction.payment_method_name} />

              <div className="border-t border-border pt-4 space-y-2">
                <DetailRow label="Harga Produk" value={formatCurrency(transaction.sell_price)} />
                {transaction.payment_fee > 0 && <DetailRow label="Biaya Admin" value={formatCurrency(transaction.payment_fee)} />}
                <div className="flex justify-between font-bold text-sm pt-2 border-t border-border">
                  <span>Total Bayar</span>
                  <span className="text-primary text-lg">{formatCurrency(transaction.total_amount)}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Status Pembayaran</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getStatusColor(transaction.payment_status)}`}>
                    {getStatusLabel(transaction.payment_status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status Top Up</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusLabel(transaction.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal</span>
                  <span>{formatDate(transaction.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-3 no-print">
              {transaction.payment_status === 'pending' && transaction.payment_url && (
                <a href={transaction.payment_url} target="_blank" rel="noreferrer">
                  <Button className="w-full gradient-button text-primary-foreground">
                    Lanjutkan Pembayaran
                  </Button>
                </a>
              )}
              {(transaction.status === 'pending' || transaction.status === 'processing') && (
                <Button variant="outline" className="w-full gap-2" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4" /> Refresh Status
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
                  <Download className="w-4 h-4" /> Download Invoice
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => navigator.share?.({ title: `Invoice ${transaction.invoice_no}`, url: window.location.href })}
                >
                  <Share2 className="w-4 h-4" /> Bagikan
                </Button>
              </div>
              <Link to="/"><Button variant="ghost" className="w-full">Kembali ke Beranda</Button></Link>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right max-w-[60%] ${bold ? 'font-semibold text-foreground' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}
