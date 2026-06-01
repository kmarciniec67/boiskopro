import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage } from './pages/HomePage';
import { OrdersPage } from './pages/OrdersPage';

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onAuthClick={() => setAuthOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/koszyk" element={<CartPage />} />
        <Route path="/zamowienie" element={<CheckoutPage />} />
        <Route path="/zamowienia" element={<OrdersPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
