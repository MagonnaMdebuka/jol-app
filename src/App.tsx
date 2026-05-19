import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import ListingsProvider from './contexts/ListingsContext';
import SavedProvider from './contexts/SavedContext';
import ToastProvider from './components/ui/Toast';
import AppShell from './components/layout/AppShell';
import OwnerShell from './components/layout/OwnerShell';
import AuthGuard from './components/auth/AuthGuard';
import Spinner from './components/ui/Spinner';

const DiscoveryMap = lazy(() => import('./pages/DiscoveryMap'));
const Feed = lazy(() => import('./pages/Feed'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const Search = lazy(() => import('./pages/Search'));
const Saved = lazy(() => import('./pages/Saved'));
const OwnerRegister = lazy(() => import('./pages/owner/OwnerRegister'));
const OwnerLogin = lazy(() => import('./pages/owner/OwnerLogin'));
const Dashboard = lazy(() => import('./pages/owner/Dashboard'));
const VenueSetup = lazy(() => import('./pages/owner/VenueSetup'));
const NewListing = lazy(() => import('./pages/owner/NewListing'));
const EditListing = lazy(() => import('./pages/owner/EditListing'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-nz-bg">
    <Spinner className="h-8 w-8" />
  </div>
);

const App: React.FC = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <ListingsProvider>
          <SavedProvider>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<DiscoveryMap />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/saved" element={<Saved />} />
                </Route>

                <Route path="/owner/register" element={<OwnerRegister />} />
                <Route path="/owner/login" element={<OwnerLogin />} />

                <Route
                  element={
                    <AuthGuard>
                      <OwnerShell />
                    </AuthGuard>
                  }
                >
                  <Route path="/owner/dashboard" element={<Dashboard />} />
                  <Route path="/owner/venue/setup" element={<VenueSetup />} />
                  <Route path="/owner/listings/new" element={<NewListing />} />
                  <Route path="/owner/listings/:id/edit" element={<EditListing />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SavedProvider>
        </ListingsProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
