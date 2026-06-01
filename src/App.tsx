import MobileNav from "@/components/MobileNav";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Stadiums from "./pages/Stadiums";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import StadiumDetail from "./pages/StadiumDetail";
import Media from "./pages/Media";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import PaymentStatus from "./pages/PaymentStatus";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import MarketplaceOrderDetail from "./pages/MarketplaceOrderDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/bookings" element={<Navigate to="/orders?tab=stadium" replace />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/stadiums" element={<Stadiums />} />
            <Route path="/stadiums/:id" element={<StadiumDetail />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/media" element={<Media />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/payments/:orderId" element={<PaymentStatus />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/products/:id" element={<ProductDetail />} />
            <Route path="/marketplace/cart" element={<Cart />} />
            <Route path="/marketplace/checkout" element={<Checkout />} />
            <Route path="/marketplace/orders" element={<Navigate to="/orders?tab=shop" replace />} />
            <Route path="/marketplace/orders/:id" element={<MarketplaceOrderDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MobileNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
