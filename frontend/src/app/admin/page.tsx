'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardBody, Button, Badge, LoadingPage, EmptyState } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingShops, setPendingShops] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, shopsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/shops/pending`, { headers }),
        axios.get(`${API_URL}/admin/orders`, { headers }),
      ]);

      setStats(statsRes.data);
      setPendingShops(shopsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 10)); // Latest 10 orders
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin only.');
        router.push('/');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveShop = async (shopId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_URL}/admin/shops/${shopId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Shop approved!');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to approve shop');
    }
  };

  const handleRejectShop = async (shopId: string) => {
    if (!confirm('Are you sure you want to reject this shop?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(
        `${API_URL}/admin/shops/${shopId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Shop rejected');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to reject shop');
    }
  };

  if (loading) return <LoadingPage message="Loading admin dashboard..." />;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Platform overview and management</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Users</div>
                    <div className="text-3xl font-bold text-primary-600">
                      {stats?.totalUsers || 0}
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Shops</div>
                    <div className="text-3xl font-bold text-green-600">
                      {stats?.totalShops || 0}
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats?.totalOrders || 0}
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Pending Shop Approvals */}
          <Card className="mb-8">
            <CardHeader
              title="Pending Shop Approvals"
              subtitle={`${pendingShops.length} shops waiting for approval`}
            />
            <CardBody>
              {pendingShops.length === 0 ? (
                <EmptyState
                  title="No pending approvals"
                  description="All shops have been reviewed"
                />
              ) : (
                <div className="space-y-4">
                  {pendingShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{shop.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{shop.description}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {shop.city}, {shop.state}
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {shop.owner?.name || shop.owner?.email}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {shop.categories?.map((cat: string) => (
                            <Badge key={cat} variant="primary" size="sm">
                              {cat.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 md:ml-6 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveShop(shop.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectShop(shop.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader
              title="Recent Orders"
              subtitle="Latest orders across all shops"
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/admin/orders')}
                >
                  View All
                </Button>
              }
            />
            <CardBody>
              {recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders yet"
                  description="Orders will appear here once customers start placing them"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Shop
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {order.customer?.name || order.customer?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {order.shop?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                            ₹{order.totalAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="info" size="sm">
                              {order.status?.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(order.createdAt), 'PP')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
