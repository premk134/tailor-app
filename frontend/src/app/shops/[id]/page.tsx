'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { shopApi, productApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, RatingDisplay, Badge, LoadingPage, EmptyState } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

export default function ShopDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  useEffect(() => {
    loadShopData();
  }, [params.id]);

  const loadShopData = async () => {
    try {
      const [shopRes, productsRes] = await Promise.all([
        shopApi.getOne(params.id as string),
        productApi.getByShop(params.id as string),
      ]);
      setShop(shopRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to load shop details');
      router.push('/shops');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPage message="Loading shop details..." />;
  if (!shop) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Shop Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Shop Info */}
              <div className="md:col-span-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {shop.address}
                    </div>
                    <div className="mb-4">
                      <RatingDisplay value={shop.rating || 0} />
                      {shop.totalReviews > 0 && (
                        <span className="text-sm text-gray-600 ml-2">
                          ({shop.totalReviews} reviews)
                        </span>
                      )}
                    </div>
                  </div>

                  {shop.acceptingOrders ? (
                    <Badge variant="success" size="lg">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Accepting Orders
                    </Badge>
                  ) : (
                    <Badge variant="danger" size="lg">Not Accepting Orders</Badge>
                  )}
                </div>

                <p className="text-gray-700 mb-4">{shop.description}</p>

                <div className="flex flex-wrap gap-2">
                  {shop.categories?.map((category: string) => (
                    <Badge key={category} variant="primary">
                      {category.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Card */}
              <div>
                <Card>
                  <CardHeader title="Contact Information" />
                  <CardBody>
                    <div className="space-y-3">
                      {shop.phone && (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm">{shop.phone}</span>
                        </div>
                      )}
                      {shop.email && (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm">{shop.email}</span>
                        </div>
                      )}
                      <div className="flex items-start">
                        <svg className="h-5 w-5 mr-2 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">
                          {shop.city}, {shop.state}<br />
                          {shop.pincode}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {shop.workingHours && (
                  <Card className="mt-4">
                    <CardHeader title="Working Hours" />
                    <CardBody>
                      <div className="space-y-2 text-sm">
                        {Object.entries(shop.workingHours).map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex justify-between">
                            <span className="capitalize font-medium">{day}</span>
                            <span className="text-gray-600">
                              {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {['products', 'about', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm capitalize
                      ${
                        activeTab === tab
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'products' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Products & Services</h2>
              {products.length === 0 ? (
                <EmptyState
                  title="No products available"
                  description="This shop hasn't added any products yet"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg -mt-4 -mx-4 mb-4"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg -mt-4 -mx-4 mb-4 flex items-center justify-center">
                          <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500">Starting from</div>
                          <div className="text-2xl font-bold text-primary-600">
                            ₹{product.basePrice}
                          </div>
                        </div>
                        <Button size="sm">View Details</Button>
                      </div>

                      {product.estimatedDays && (
                        <div className="mt-4 text-sm text-gray-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {product.estimatedDays} days completion
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">About {shop.name}</h2>
              <Card>
                <CardBody>
                  <p className="text-gray-700 mb-4">{shop.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h3 className="font-semibold mb-2">Specializations</h3>
                      <div className="flex flex-wrap gap-2">
                        {shop.categories?.map((cat: string) => (
                          <Badge key={cat} variant="primary">{cat.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Payment Methods</h3>
                      <div className="space-y-2">
                        {shop.paymentMethods?.cash && (
                          <div className="flex items-center text-sm">
                            <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Cash on Delivery
                          </div>
                        )}
                        {shop.paymentMethods?.online && (
                          <div className="flex items-center text-sm">
                            <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Online Payment
                          </div>
                        )}
                        {shop.paymentMethods?.upi && (
                          <div className="flex items-center text-sm">
                            <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            UPI Payment
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
              <Card>
                <CardBody>
                  <EmptyState
                    title="No reviews yet"
                    description="Be the first to order and leave a review!"
                  />
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
