'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '../ui';

export const Header = () => {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => router.push('/')}
              className="text-2xl font-bold text-primary-600 hover:text-primary-700"
            >
              Tailor App
            </button>

            {user && (
              <nav className="hidden md:flex space-x-6">
                <button
                  onClick={() => router.push('/shops')}
                  className="text-gray-700 hover:text-primary-600"
                >
                  Browse Tailors
                </button>

                {user.role === 'customer' && (
                  <>
                    <button
                      onClick={() => router.push('/measurements')}
                      className="text-gray-700 hover:text-primary-600"
                    >
                      My Measurements
                    </button>
                    <button
                      onClick={() => router.push('/orders')}
                      className="text-gray-700 hover:text-primary-600"
                    >
                      My Orders
                    </button>
                  </>
                )}

                {user.role === 'tailor' && (
                  <>
                    <button
                      onClick={() => router.push('/tailor/shop')}
                      className="text-gray-700 hover:text-primary-600"
                    >
                      My Shop
                    </button>
                    <button
                      onClick={() => router.push('/tailor/orders')}
                      className="text-gray-700 hover:text-primary-600"
                    >
                      Orders
                    </button>
                  </>
                )}

                {user.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Admin Panel
                  </button>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700 hidden sm:inline">
                  Welcome, {user.name || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>
                  Profile
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/auth/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => router.push('/auth/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
