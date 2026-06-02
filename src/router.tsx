
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import TransactionPage from "./pages/TransactionPage";
import TransactionSearchPage from "./pages/TransactionSearchPage";
import SearchPage from "./pages/SearchPage";
import StaticPage from "./pages/StaticPage";
import PromoPage from "./pages/PromoPage";
import ResellerPage from "./pages/ResellerPage";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTransactions from "./pages/admin/Transactions";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminMarkup from "./pages/admin/Markup";
import AdminSettings from "./pages/admin/Settings";
import AdminBanners from "./pages/admin/Banners";
import AdminBlog from "./pages/admin/Blog";
import AdminFAQ from "./pages/admin/FAQ";
import AdminReports from "./pages/admin/Reports";
import AdminApiLogs from "./pages/admin/ApiLogs";
import AdminNotifications from "./pages/admin/Notifications";
import AdminTestimonials from "./pages/admin/Testimonials";
import AdminPaymentMethods from "./pages/admin/PaymentMethods";
import AdminDigiflazz from "./pages/admin/Digiflazz";
import AdminCMS from "./pages/admin/CMS";
import AdminSystemLogs from "./pages/admin/SystemLogs";
import ProtectedRoute from "./components/ProtectedRoute";

export const routers = [
  // Public Routes
  { path: "/", name: "home", element: <HomePage /> },
  { path: "/category/:slug", name: "category", element: <CategoryPage /> },
  { path: "/product/:id", name: "product", element: <ProductPage /> },
  { path: "/transaction", name: "transaction-search", element: <TransactionSearchPage /> },
  { path: "/transaction/:invoiceNo", name: "transaction", element: <TransactionPage /> },
  { path: "/search", name: "search", element: <SearchPage /> },

  // Static Pages
  { path: "/about", name: "about", element: <StaticPage page="about" /> },
  { path: "/how-to-buy", name: "how-to-buy", element: <StaticPage page="how-to-buy" /> },
  { path: "/faq", name: "faq", element: <StaticPage page="faq" /> },
  { path: "/privacy", name: "privacy", element: <StaticPage page="privacy" /> },
  { path: "/terms", name: "terms", element: <StaticPage page="terms" /> },
  { path: "/blog", name: "blog", element: <StaticPage page="about" /> },
  { path: "/promo", name: "promo", element: <PromoPage /> },
  { path: "/reseller", name: "reseller", element: <ResellerPage /> },

  // Admin Routes
  { path: "/admin/login", name: "admin-login", element: <AdminLogin /> },
  { path: "/admin", name: "admin-dashboard", element: <ProtectedRoute><AdminDashboard /></ProtectedRoute> },
  { path: "/admin/transactions", name: "admin-transactions", element: <ProtectedRoute><AdminTransactions /></ProtectedRoute> },
  { path: "/admin/products", name: "admin-products", element: <ProtectedRoute><AdminProducts /></ProtectedRoute> },
  { path: "/admin/categories", name: "admin-categories", element: <ProtectedRoute><AdminCategories /></ProtectedRoute> },
  { path: "/admin/markup", name: "admin-markup", element: <ProtectedRoute><AdminMarkup /></ProtectedRoute> },
  { path: "/admin/payment-methods", name: "admin-payment-methods", element: <ProtectedRoute><AdminPaymentMethods /></ProtectedRoute> },
  { path: "/admin/banners", name: "admin-banners", element: <ProtectedRoute><AdminBanners /></ProtectedRoute> },
  { path: "/admin/testimonials", name: "admin-testimonials", element: <ProtectedRoute><AdminTestimonials /></ProtectedRoute> },
  { path: "/admin/blog", name: "admin-blog", element: <ProtectedRoute><AdminBlog /></ProtectedRoute> },
  { path: "/admin/faq", name: "admin-faq", element: <ProtectedRoute><AdminFAQ /></ProtectedRoute> },
  { path: "/admin/reports", name: "admin-reports", element: <ProtectedRoute><AdminReports /></ProtectedRoute> },
  { path: "/admin/notifications", name: "admin-notifications", element: <ProtectedRoute><AdminNotifications /></ProtectedRoute> },
  { path: "/admin/api-logs", name: "admin-api-logs", element: <ProtectedRoute><AdminApiLogs /></ProtectedRoute> },
  { path: "/admin/digiflazz", name: "admin-digiflazz", element: <ProtectedRoute><AdminDigiflazz /></ProtectedRoute> },
  { path: "/admin/cms", name: "admin-cms", element: <ProtectedRoute><AdminCMS /></ProtectedRoute> },
  { path: "/admin/logs", name: "admin-logs", element: <ProtectedRoute><AdminSystemLogs /></ProtectedRoute> },
  { path: "/admin/settings", name: "admin-settings", element: <ProtectedRoute><AdminSettings /></ProtectedRoute> },

  // Catch all
  { path: "*", name: "404", element: <NotFound /> },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
