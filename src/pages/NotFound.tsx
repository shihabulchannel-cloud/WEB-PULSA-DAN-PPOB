import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-bg p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-gradient mb-3">404</h1>
        <p className="text-xl font-semibold text-foreground mb-2">Halaman Tidak Ditemukan</p>
        <p className="text-muted-foreground mb-8">Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
        <Link to="/">
          <Button className="gap-2 gradient-button text-primary-foreground">
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
