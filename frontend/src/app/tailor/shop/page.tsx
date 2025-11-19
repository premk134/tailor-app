'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, Badge, LoadingPage, EmptyState, RatingDisplay } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

export default function TailorShopPage() {
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const response = await shopApi.getMyShop();
      setShop(response.data);
      setHasShop(true);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setHasShop(false);
      } else {
        toast.error('Failed to load shop');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAcceptingOrders = async () => {
    try {
      await shopApi.update(shop.id, {
        acceptingOrders: !shop.acceptingOrders,
      });
      setShop({ ...shop, acceptingOrders: !shop.acceptingOrders });
      toast.success(
        shop.acceptingOrders
          ? 'Your shop is now closed for new orders'
          : 'Your shop is now accepting orders'
      );
    } catch (error) {
      toast.error('Failed to update shop status');
    }
  };

  if (loading) return <LoadingPage message="Loading shop..." />;

  // No shop yet - show create shop flow
  if (!hasShop) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <EmptyState
            icon={
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            title="No shop found"
            description="Create your shop to start receiving orders from customers"
            action={
              <Button onClick={() => router.push('/tailor/shop/edit')}>
                Create Your Shop
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Shop</h1>
              <p className="text-gray-600">Manage your shop details and settings</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => router.push('/tailor/products')}
              >
                Manage Products
              </Button>
              <Button onClick={() => router.push('/tailor/shop/edit')}>
                Edit Shop
              </Button>
            </div>
          </div>

          {/* Shop Status Card */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Shop Status</h3>
                  <p className="text-sm text-gray-600">
                    {shop.acceptingOrders
                      ? 'Your shop is currently accepting new orders'
                      : 'Your shop is closed for new orders'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant={shop.acceptingOrders ? 'success' : 'danger'} size="lg">
                    {shop.acceptingOrders ? 'Open' : 'Closed'}
                  </Badge>
                  <Button
                    variant={shop.acceptingOrders ? 'danger' : 'primary'}
                    onClick={handleToggleAcceptingOrders}
                  >
                    {shop.acceptingOrders ? 'Close Shop' : 'Open Shop'}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Approval Status */}
          {shop.status !== 'approved' && (
            <Card className="mb-6 border-2 border-yellow-300 bg-yellow-50">
              <CardBody>
                <div className="flex items-start">
                  <svg className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">
                      {shop.status === 'pending' && 'Pending Approval'}
                      {shop.status === 'rejected' && 'Shop Rejected'}
                    </h3>
                    <p className="text-sm text-yellow-800">
                      {shop.status === 'pending' &&
                        'Your shop is under review. You will be notified once it is approved by our admin team.'}
                      {shop.status === 'rejected' &&
                        'Your shop application was rejected. Please contact support for more information.'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shop Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader title="Shop Information" />
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{shop.name}</h3>
                      <p className="text-gray-700">{shop.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {shop.categories?.map((category: string) => (
                        <Badge key={category} variant="primary">
                          {category.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Rating</div>
                          <RatingDisplay value={shop.rating || 0} />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Total Reviews</div>
                          <div className="font-semibold">{shop.totalReviews || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Contact & Location */}
              <Card>
                <CardHeader title="Contact & Location" />
                <CardBody>
                  <div className="space-y-3">
                    {shop.phone && (
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{shop.phone}</span>
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{shop.email}</span>
                      </div>
                    )}
                    <div className="flex items-start">
                      <svg className="h-5 w-5 mr-3 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <div>
                        <div>{shop.address}</div>
                        <div className="text-gray-600">
                          {shop.city}, {shop.state} - {shop.pincode}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Working Hours */}
              {shop.workingHours && (
                <Card>
                  <CardHeader title="Working Hours" />
                  <CardBody>
                    <div className="space-y-2">
                      {Object.entries(shop.workingHours).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between items-center">
                          <span className="capitalize font-medium">{day}</span>
                          <span className={hours.closed ? 'text-red-600' : 'text-gray-700'}>
                            {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Payment Methods */}
              {shop.paymentMethods && (
                <Card>
                  <CardHeader title="Accepted Payment Methods" />
                  <CardBody>
                    <div className="space-y-2">
                      {shop.paymentMethods.cash && (
                        <div className="flex items-center text-sm">
                          <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Cash on Delivery
                        </div>
                      )}
                      {shop.paymentMethods.online && (
                        <div className="flex items-center text-sm">
                          <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Online Payment
                        </div>
                      )}
                      {shop.paymentMethods.upi && (
                        <div className="flex items-center text-sm">
                          <svg className="h-4 w-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          UPI Payment
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader title="Quick Stats" />
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Orders</span>
                      <span className="text-2xl font-bold text-primary-600">
                        {shop.stats?.totalOrders || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Orders</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {shop.stats?.activeOrders || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{shop.stats?.totalRevenue || 0}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader title="Quick Actions" />
                <CardBody>
                  <div className="space-y-2">
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => router.push('/tailor/orders')}
                    >
                      View Orders
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => router.push('/tailor/products')}
                    >
                      Manage Products
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => router.push(`/shops/${shop.id}`)}
                    >
                      View Public Profile
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
