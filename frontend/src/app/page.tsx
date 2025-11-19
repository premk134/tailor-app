'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function Home() {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const response = await shopApi.getAll({ acceptingOrders: true });
      setShops(response.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">Tailor App</h1>
            <div className="space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => router.push('/orders')}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    My Orders
                  </button>
                  <button
                    onClick={() => router.push('/measurements')}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Measurements
                  </button>
                  <span className="text-gray-700">Welcome, {user.name}</span>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => router.push('/auth/signup')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Custom Tailoring Made Easy
          </h2>
          <p className="text-xl mb-8">
            Find the best tailors near you and order custom-fitted clothing
          </p>
          <button
            onClick={() => router.push('/shops')}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100"
          >
            Browse Tailors
          </button>
        </div>
      </section>

      {/* Featured Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold mb-8">Featured Tailors</h3>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop: any) => (
              <div
                key={shop.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/shops/${shop.id}`)}
              >
                <h4 className="text-xl font-semibold mb-2">{shop.name}</h4>
                <p className="text-gray-600 mb-2">{shop.city}, {shop.state}</p>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1">{shop.rating || 'New'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {shop.categories?.slice(0, 3).map((cat: string) => (
                    <span
                      key={cat}
                      className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                    >
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Save Measurements</h4>
              <p className="text-gray-600">
                Create and save your measurement profiles securely
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Browse & Order</h4>
              <p className="text-gray-600">
                Find tailors, select products, and place your order
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Track & Receive</h4>
              <p className="text-gray-600">
                Track your order in real-time and get perfectly fitted clothes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Tailor App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
