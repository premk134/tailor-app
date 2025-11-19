'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api';
import { Card, Input, Select, RatingDisplay, Badge, LoadingPage, EmptyState, Button } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'mens_wear', label: "Men's Wear" },
  { value: 'womens_wear', label: "Women's Wear" },
  { value: 'kids_wear', label: "Kids' Wear" },
  { value: 'alterations', label: 'Alterations' },
  { value: 'custom_design', label: 'Custom Design' },
  { value: 'bridal_wear', label: 'Bridal Wear' },
];

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [filteredShops, setFilteredShops] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    city: '',
    category: '',
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, shops]);

  const loadShops = async () => {
    try {
      const response = await shopApi.getAll({ acceptingOrders: true });
      setShops(response.data);
      setFilteredShops(response.data);
    } catch (error) {
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...shops];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        shop =>
          shop.name.toLowerCase().includes(search) ||
          shop.description?.toLowerCase().includes(search) ||
          shop.city?.toLowerCase().includes(search)
      );
    }

    // City filter
    if (filters.city) {
      filtered = filtered.filter(
        shop => shop.city?.toLowerCase() === filters.city.toLowerCase()
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(shop =>
        shop.categories?.includes(filters.category)
      );
    }

    setFilteredShops(filtered);
  };

  // Get unique cities from shops
  const cities = Array.from(new Set(shops.map(shop => shop.city).filter(Boolean)));

  if (loading) return <LoadingPage message="Loading tailors..." />;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-2">Find Your Perfect Tailor</h1>
            <p className="text-xl text-primary-100">
              Browse professional tailors and get custom-fitted clothing
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by name or city..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Select
                options={[
                  { value: '', label: 'All Cities' },
                  ...cities.map(city => ({ value: city, label: city })),
                ]}
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
              <Select
                options={CATEGORY_OPTIONS}
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              />
              <Button
                variant="outline"
                onClick={() => setFilters({ city: '', category: '', search: '' })}
                fullWidth
              >
                Clear Filters
              </Button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredShops.length} of {shops.length} tailors
            </div>
          </Card>

          {/* Shop Grid */}
          {filteredShops.length === 0 ? (
            <EmptyState
              title="No tailors found"
              description="Try adjusting your filters to find more tailors"
              action={
                <Button onClick={() => setFilters({ city: '', category: '', search: '' })}>
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <Card
                  key={shop.id}
                  className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
                  onClick={() => router.push(`/shops/${shop.id}`)}
                >
                  {/* Shop Image */}
                  {shop.images && shop.images[0] ? (
                    <img
                      src={shop.images[0]}
                      alt={shop.name}
                      className="w-full h-48 object-cover rounded-t-lg -mt-4 -mx-4 mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg -mt-4 -mx-4 mb-4 flex items-center justify-center">
                      <svg className="h-20 w-20 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold mb-2">{shop.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {shop.description || 'Professional tailoring services'}
                    </p>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {shop.city}, {shop.state}
                    </div>

                    <div className="mb-3">
                      <RatingDisplay value={shop.rating || 0} />
                      {shop.totalReviews > 0 && (
                        <span className="text-sm text-gray-600 ml-1">
                          ({shop.totalReviews} reviews)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {shop.categories?.slice(0, 3).map((cat: string) => (
                        <Badge key={cat} variant="primary" size="sm">
                          {cat.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {shop.categories?.length > 3 && (
                        <Badge variant="default" size="sm">
                          +{shop.categories.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {shop.acceptingOrders && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-sm text-green-600">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Currently accepting orders
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
