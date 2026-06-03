import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  bucket?: string;
  folder?: string;
  value?: string;
  onChange: (url: string) => void;
  maxMB?: number;
  className?: string;
  label?: string;
}

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUploader({
  bucket = 'site-images',
  folder = 'uploads',
  value,
  onChange,
  maxMB = 5,
  className = '',
  label,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: 'Format tidak didukung', description: 'Gunakan JPG, JPEG, PNG, atau WEBP', variant: 'destructive' });
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast({ title: `File terlalu besar`, description: `Maksimal ${maxMB}MB`, variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onChange(data.publicUrl);
      toast({ title: 'Gambar berhasil diupload' });
    } catch (err) {
      toast({ title: 'Upload gagal', description: err instanceof Error ? err.message : 'Coba lagi', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => onChange('');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-border group">
          <img
            src={value}
            alt="preview"
            className="w-full max-h-48 object-contain bg-muted/30"
            onError={e => { (e.target as HTMLImageElement).src = ''; }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-white/90 text-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-white flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Ganti
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="bg-destructive/90 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-destructive flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Mengupload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Klik atau drag gambar ke sini</p>
              <p className="text-xs text-muted-foreground">JPG, JPEG, PNG, WEBP — Maks {maxMB}MB</p>
            </div>
          )}
        </button>
      )}
    </div>
  );
}
