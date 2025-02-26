import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import BusinessManager from './pages/RestaurantManager';
import { PublicMenu } from './pages/PublicMenu';
import { QRCodePage } from './pages/QRCodePage';
import { Newsletter } from './pages/Newsletter';

const queryClient = new QueryClient();

// Layout component for admin routes
const AdminLayout = () => (
  <>
    <Header />
    <Outlet />
    <Footer />
  </>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Admin routes with header and footer */}
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/business/manage/:id" element={<BusinessManager />} />
              <Route path="/newsletter" element={<Newsletter />} />
            </Route>
            
            {/* Public routes */}
            <Route path="/business/:alias" element={<PublicMenu />} />
            <Route path="/business/:alias/qrcode" element={<QRCodePage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;