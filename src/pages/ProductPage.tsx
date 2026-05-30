import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Shield, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, generateInvoiceNo } from '@/lib/utils-app';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string; name: string; brand: string; sell_price: number; modal_price: number;
  description: string; image_url: string;
  categories?: { name: string; slug: string };
}
interface PaymentMethod {
  id: string; name: string; code: string; type: string; fee_type: string; fee_value: number;
}

const paymentTypeLabels: Record<string, string> = {
  qris: 'QRIS', virtual_account: 'Virtual Account', bank_transfer: 'Transfer Bank', ewallet: 'E-Wallet'
};

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [targetId, setTargetId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('id', id)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  const calculateFee = (pm: PaymentMethod) => {
    if (!product) return 0;
    if (pm.fee_type === 'percentage') return Math.ceil(product.sell_price * pm.fee_value / 100);
    return pm.fee_value;
  };

  const total = product && selectedPayment ? product.sell_price + calculateFee(selectedPayment) : product?.sell_price || 0;

  const handleOrder = async () => {
    if (!product || !targetId || !selectedPayment) {
      toast({ title: 'Lengkapi data', description: 'Isi semua field yang diperlukan', variant: 'destructive' });
      return;
    }
    if (!customerEmail && !customerPhone) {
      toast({ title: 'Kontak diperlukan', description: 'Masukkan email atau nomor HP untuk menerima notifikasi', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const invoiceNo = generateInvoiceNo();
      const fee = calculateFee(selectedPayment);
      const { data, error } = await supabase.from('transactions').insert({
        invoice_no: invoiceNo,
        product_id: product.id,
        product_name: product.name,
        product_sku: id,
        category_name: (product.categories as { name: string })?.name || '',
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        target_id: targetId,
        modal_price: product.modal_price,
        sell_price: product.sell_price,
        markup_amount: product.sell_price - product.modal_price,
        payment_fee: fee,
        total_amount: total,
        profit: product.sell_price - product.modal_price,
        payment_method_id: selectedPayment.id,
        payment_method_code: selectedPayment.code,
        payment_method_name: selectedPayment.name,
        payment_status: 'pending',
        status: 'pending',
      }).select().single();

      if (error) throw error;

      // Try to create Tripay payment
      try {
        const { data: paymentData } = await supabase.functions.invoke('tripay-create-payment', {
          body: {
            transaction_id: data.id,
            invoice_no: invoiceNo,
            amount: total,
            payment_code: selectedPayment.code,
            customer_name: customerName || 'Customer',
            customer_email: customerEmail || '',
            customer_phone: customerPhone || '',
            product_name: product.name,
          }
        });
        if (paymentData?.payment_url) {
          await supabase.from('transactions').update({ payment_url: paymentData.payment_url, payment_reference: paymentData.reference }).eq('id', data.id);
          window.location.href = paymentData.payment_url;
          return;
        }
      } catch {
        // Fallback to transaction page if Tripay not configured
      }

      navigate(`/transaction/${invoiceNo}`);
    } catch (err) {
      toast({ title: 'Gagal membuat transaksi', description: 'Silakan coba lagi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    </MainLayout>
  );

  if (!product) return (
    <MainLayout>
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive/50" />
        <p className="text-muted-foreground">Produk tidak ditemukan</p>
      </div>
    </MainLayout>
  );

  const paymentGroups = paymentMethods.reduce((acc, pm) => {
    if (!acc[pm.type]) acc[pm.type] = [];
    acc[pm.type].push(pm);
    return acc;
  }, {} as Record<string, PaymentMethod[]>);

  return (
    <>
      <Helmet>
        <title>{product.name} — SHIELACOM CELL</title>
      </Helmet>
      <MainLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Product Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-16 h-16 text-primary/20" />
                  )}
                </div>
                <span className="text-xs text-primary font-medium">{product.brand}</span>
                <h1 className="text-lg font-bold text-foreground mt-1">{product.name}</h1>
                {product.description && <p className="text-sm text-muted-foreground mt-2">{product.description}</p>}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harga</span>
                    <span className="font-bold text-primary text-lg">{formatCurrency(product.sell_price)}</span>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2">
                {[
                  { icon: Zap, text: 'Proses otomatis & instan' },
                  { icon: Shield, text: 'Transaksi aman & terjamin' },
                  { icon: CheckCircle2, text: 'Dijamin 100% berhasil' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.text} className="flex items-center gap-2 text-sm text-green-700">
                      <Icon className="w-4 h-4" />
                      <span>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Order Form */}
            <div className="lg:col-span-3 space-y-5">
              {/* Target ID */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <h3 className="font-semibold text-foreground mb-4">Isi Data Pesanan</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetId" className="text-sm font-medium">
                      {product.categories && (product.categories as { name: string }).name?.toLowerCase().includes('game')
                        ? 'User ID Game / Server ID'
                        : 'Nomor Tujuan'}
                    </Label>
                    <Input
                      id="targetId"
                      placeholder={product.categories && (product.categories as { name: string }).name?.toLowerCase().includes('game') ? 'Masukkan User ID' : 'Masukkan nomor tujuan'}
                      value={targetId}
                      onChange={e => setTargetId(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerName" className="text-sm font-medium">Nama (Opsional)</Label>
                    <Input id="customerName" placeholder="Nama Anda" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-1.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="customerEmail" className="text-sm font-medium">Email</Label>
                      <Input id="customerEmail" type="email" placeholder="email@contoh.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone" className="text-sm font-medium">No. HP / WA</Label>
                      <Input id="customerPhone" placeholder="08xxxxxxxxxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <h3 className="font-semibold text-foreground mb-4">Pilih Metode Pembayaran</h3>
                <div className="space-y-4">
                  {Object.entries(paymentGroups).map(([type, methods]) => (
                    <div key={type}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{paymentTypeLabels[type] || type}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {methods.map(pm => {
                          const fee = calculateFee(pm);
                          return (
                            <button
                              key={pm.id}
                              onClick={() => setSelectedPayment(pm)}
                              className={`p-3 rounded-xl border text-left transition-all ${selectedPayment?.id === pm.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}
                            >
                              <p className="text-sm font-medium text-foreground">{pm.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {fee === 0 ? 'Gratis' : `+${formatCurrency(fee)}`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary & Pay */}
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <h3 className="font-semibold text-foreground mb-3">Ringkasan Pembayaran</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produk</span>
                    <span className="font-medium text-foreground">{formatCurrency(product.sell_price)}</span>
                  </div>
                  {selectedPayment && calculateFee(selectedPayment) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biaya Admin</span>
                      <span className="text-foreground">{formatCurrency(calculateFee(selectedPayment))}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>
                <Button
                  onClick={handleOrder}
                  disabled={loading || !targetId || !selectedPayment}
                  className="w-full mt-4 gradient-button text-primary-foreground font-semibold py-5 hover:opacity-90 transition-opacity"
                >
                  {loading ? 'Memproses...' : `Bayar ${formatCurrency(total)}`}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-2">Dengan melanjutkan, Anda setuju dengan Syarat & Ketentuan kami</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
