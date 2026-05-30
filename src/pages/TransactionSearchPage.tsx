
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function TransactionSearchPage() {
  const [invoiceNo, setInvoiceNo] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = invoiceNo.trim().toUpperCase();
    if (trimmed) navigate(`/transaction/${trimmed}`);
  };

  return (
    <>
      <Helmet>
        <title>Cek Status Transaksi — SHIELACOM CELL</title>
      </Helmet>
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-brand">
                <Receipt className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Cek Status Transaksi</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Masukkan nomor invoice untuk melihat status transaksi Anda
              </p>
            </div>

            {/* Search Form */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="invoiceNo" className="text-sm font-medium">
                    Nomor Invoice
                  </Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="invoiceNo"
                      placeholder="Contoh: INV-20260530-1234"
                      value={invoiceNo}
                      onChange={e => setInvoiceNo(e.target.value)}
                      className="pl-9 uppercase"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={!invoiceNo.trim()}
                  className="w-full gradient-button text-primary-foreground font-semibold py-5"
                >
                  Cek Transaksi
                </Button>
              </form>
            </div>

            {/* Status Guide */}
            <div className="mt-6 bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Arti Status Transaksi</p>
              <div className="space-y-2.5">
                {[
                  { icon: Clock, color: 'text-yellow-500', label: 'Pending', desc: 'Menunggu pembayaran dikonfirmasi' },
                  { icon: Clock, color: 'text-blue-500', label: 'Processing', desc: 'Sedang diproses oleh sistem' },
                  { icon: CheckCircle2, color: 'text-green-500', label: 'Sukses', desc: 'Transaksi berhasil diproses' },
                  { icon: AlertCircle, color: 'text-red-500', label: 'Gagal', desc: 'Transaksi gagal, hubungi CS' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`} />
                      <div>
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-xs text-muted-foreground ml-1.5">— {item.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Nomor invoice dikirim ke email/WhatsApp Anda saat transaksi dibuat
            </p>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
