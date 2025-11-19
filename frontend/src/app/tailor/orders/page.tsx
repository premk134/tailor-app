'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderApi, shopApi } from '@/lib/api';
import { Card, Badge, Button, LoadingPage, EmptyState, Select } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending_confirmation: { label: 'Pending', variant: 'warning' as const, color: 'bg-yellow-50 border-yellow-200' },
  confirmed: { label: 'Confirmed', variant: 'info' as const, color: 'bg-blue-50 border-blue-200' },
  in_production: { label: 'In Production', variant: 'warning' as const, color: 'bg-orange-50 border-orange-200' },
  ready_for_pickup: { label: 'Ready', variant: 'success' as const, color: 'bg-green-50 border-green-200' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'info' as const, color: 'bg-blue-50 border-blue-200' },
  delivered: { label: 'Delivered', variant: 'success' as const, color: 'bg-green-50 border-green-200' },
  completed: { label: 'Completed', variant: 'success' as const, color: 'bg-green-50 border-green-200' },
};

export default function TailorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const router = useRouter();

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      loadOrders();
    }
  }, [selectedShop]);

  const loadShops = async () => {
    try {
      const response = await shopApi.getMyShops();
      setShops(response.data);
      if (response.data.length > 0) {
        setSelectedShop(response.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await orderApi.getShopOrders(selectedShop);
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await orderApi.updateStatus(orderId, 'confirmed');
      toast.success('Order accepted!');
      loadOrders();
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.updateStatus(orderId, status);
      toast.success('Status updated!');
      loadOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <LoadingPage message="Loading orders..." />;

  if (shops.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <EmptyState
            title="No shop found"
            description="Create a shop to start receiving orders"
            action={
              <Button onClick={() => router.push('/tailor/shop/new')}>
                Create Shop
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const pendingOrders = orders.filter(o => o.status === 'pending_confirmation');
  const activeOrders = orders.filter(o => ['confirmed', 'in_production', 'ready_for_pickup', 'out_for_delivery'].includes(o.status));
  const completedOrders = orders.filter(o => ['delivered', 'completed'].includes(o.status));

  const currentOrders = activeTab === 'pending' ? pendingOrders : activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">Order Management</h1>
              <p className="text-gray-600 mt-1">Manage incoming orders and update status</p>
            </div>
            {shops.length > 1 && (
              <div className="w-64">
                <Select
                  options={shops.map(shop => ({ value: shop.id, label: shop.name }))}
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{pendingOrders.length}</div>
                <div className="text-sm text-gray-600 mt-1">Pending Confirmation</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{activeOrders.length}</div>
                <div className="text-sm text-gray-600 mt-1">Active Orders</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{completedOrders.length}</div>
                <div className="text-sm text-gray-600 mt-1">Completed</div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6">
            {[
              { key: 'pending', label: 'Pending', count: pendingOrders.length },
              { key: 'active', label: 'Active', count: activeOrders.length },
              { key: 'completed', label: 'Completed', count: completedOrders.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${
                    activeTab === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Orders List */}
          {currentOrders.length === 0 ? (
            <EmptyState
              title={`No ${activeTab} orders`}
              description={`You don't have any ${activeTab} orders at the moment`}
            />
          ) : (
            <div className="space-y-4">
              {currentOrders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];

                return (
                  <Card key={order.id} className={`border-2 ${statusConfig?.color || ''}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Customer: {order.customer?.name || order.customer?.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              Placed: {format(new Date(order.createdAt), 'PPp')}
                            </p>
                          </div>
                          <Badge variant={statusConfig?.variant || 'default'}>
                            {statusConfig?.label || order.status}
                          </Badge>
                        </div>

                        {/* Order Items Summary */}
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-2">Items:</div>
                          <div className="space-y-1">
                            {order.items?.map((item: any, index: number) => (
                              <div key={index} className="text-sm text-gray-700">
                                • {item.productName} x{item.quantity}
                                {item.selectedOptions?.fabric && ` - ${item.selectedOptions.fabric}`}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500">Delivery</div>
                            <div className="font-medium capitalize">
                              {order.deliveryType?.replace('_', ' ')}
                            </div>
                          </div>
                          {order.scheduledFor && (
                            <div>
                              <div className="text-gray-500">Scheduled</div>
                              <div className="font-medium">
                                {format(new Date(order.scheduledFor), 'PP')}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-gray-500">Amount</div>
                            <div className="font-bold text-primary-600">₹{order.totalAmount}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Payment</div>
                            <Badge
                              variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                              size="sm"
                            >
                              {order.paymentStatus}
                            </Badge>
                          </div>
                        </div>

                        {order.customerNotes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <div className="text-sm font-medium text-blue-900 mb-1">
                              Customer Notes:
                            </div>
                            <p className="text-sm text-blue-800">{order.customerNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 lg:mt-0 lg:ml-6 flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          fullWidth
                          onClick={() => router.push(`/tailor/orders/${order.id}`)}
                        >
                          View Details
                        </Button>

                        {order.status === 'pending_confirmation' && (
                          <>
                            <Button
                              size="sm"
                              fullWidth
                              onClick={() => handleAcceptOrder(order.id)}
                            >
                              Accept Order
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              fullWidth
                              onClick={() => {
                                if (confirm('Reject this order?')) {
                                  // Handle reject
                                  toast.info('Reject functionality');
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {order.status === 'confirmed' && (
                          <Button
                            size="sm"
                            fullWidth
                            onClick={() => handleUpdateStatus(order.id, 'in_production')}
                          >
                            Start Production
                          </Button>
                        )}

                        {order.status === 'in_production' && (
                          <Button
                            size="sm"
                            fullWidth
                            onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                          >
                            Mark as Ready
                          </Button>
                        )}

                        {order.status === 'ready_for_pickup' && order.deliveryType === 'delivery' && (
                          <Button
                            size="sm"
                            fullWidth
                            onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                          >
                            Out for Delivery
                          </Button>
                        )}

                        {(['ready_for_pickup', 'out_for_delivery'].includes(order.status)) && (
                          <Button
                            size="sm"
                            variant="outline"
                            fullWidth
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          >
                            Mark Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
