
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MarketplaceScreen from './screens/MarketplaceScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import MembershipScreen from './screens/MembershipScreen';
import CartScreen from './screens/CartScreen';
import SavedScreen from './screens/SavedScreen';
import AdminScreen from './screens/AdminScreen';
import AccessoriesScreen from './screens/AccessoriesScreen';
import { AppProvider } from './AppContext';
import AdminPartnersScreen from './screens/AdminPartnersScreen';


const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl relative overflow-hidden">
          <Routes>
            <Route path="/" element={<MarketplaceScreen />} />
            <Route path="/accessories" element={<AccessoriesScreen />} />
            <Route path="/product/:id" element={<ProductDetailScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/saved" element={<SavedScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/membership" element={<MembershipScreen />} />
            <Route path="/admin" element={<AdminScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/admin/partners" element={<AdminPartnersScreen />} />
          </Routes>
        </div>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
