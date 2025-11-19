'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderApi } from '@/lib/api';
import { Card, Badge, LoadingPage, EmptyState, Button } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  created: { label: 'Created', variant: 'default' as const, color: 'bg-gray-100' },
  pending_confirmation: { label: 'Pending', variant: 'warning' as const, color: 'bg-yellow-100' },
  confirmed: { label: 'Confirmed', variant: 'info' as const, color: 'bg-blue-100' },
  in_production: { label: 'In Production', variant: 'warning' as const, color: 'bg-yellow-100' },
  ready_for_pickup: { label: 'Ready', variant: 'success' as const, color: 'bg-green-100' },
  out_for_delivery: { label: 'Out for Delivery', variant: 'info' as const, color: 'bg-blue-100' },
  delivered: { label: 'Delivered', variant: 'success' as const, color: 'bg-green-100' },
  completed: { label: 'Completed', variant: 'success' as const, color: 'bg-green-100' },
  cancelled: { label: 'Cancelled', variant: 'danger' as const, color: 'bg-red-100' },
  refunded: { label: 'Refunded', variant: 'danger' as const, color: 'bg-red-100' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderApi.getMyOrders();
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return !['completed', 'cancelled', 'refunded', 'delivered'].includes(order.status);
    }
    if (filter === 'completed') {
      return ['completed', 'delivered'].includes(order.status);
    }
    return true;
  });

  if (loading) return <LoadingPage message="Loading orders..." />;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your tailoring orders</p>
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-6">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm transition-colors
                  ${
                    filter === tab.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {tab.label}
                {tab.key === 'all' && ` (${orders.length})`}
                {tab.key === 'active' &&
                  ` (${orders.filter((o) => !['completed', 'cancelled', 'refunded', 'delivered'].includes(o.status)).length})`}
                {tab.key === 'completed' &&
                  ` (${orders.filter((o) => ['completed', 'delivered'].includes(o.status)).length})`}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              title={filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
              description="Start browsing tailors to place your first order"
              action={
                <Button onClick={() => router.push('/shops')}>Browse Tailors</Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.created;

                return (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{order.shop?.name}</h3>
                            <p className="text-sm text-gray-600">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <div className="text-gray-500">Date</div>
                            <div className="font-medium">
                              {format(new Date(order.createdAt), 'PP')}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Items</div>
                            <div className="font-medium">{order.items?.length || 0} items</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Delivery</div>
                            <div className="font-medium capitalize">
                              {order.deliveryType?.replace('_', ' ')}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500">Total</div>
                            <div className="font-bold text-lg text-primary-600">
                              ₹{order.totalAmount}
                            </div>
                          </div>
                        </div>

                        {order.scheduledFor && (
                          <div className="mt-3 text-sm text-gray-600 flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Scheduled for: {format(new Date(order.scheduledFor), 'PPP')}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 md:mt-0 md:ml-6 flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                        <Button
                          size="sm"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}`);
                          }}
                        >
                          View Details
                        </Button>
                        {order.status === 'pending_confirmation' && (
                          <Button
                            size="sm"
                            variant="outline"
                            fullWidth
                            onClick={(e) => {
                              e.stopPropagation();
                              // Cancel order
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Order Timeline Preview */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2 overflow-x-auto">
                        {['created', 'confirmed', 'in_production', 'delivered'].map((step, index) => {
                          const stepConfig = STATUS_CONFIG[step as keyof typeof STATUS_CONFIG];
                          const isCompleted = order.status === step ||
                            ['delivered', 'completed'].includes(order.status);
                          const isPast =
                            ['created', 'confirmed', 'in_production'].indexOf(order.status) >
                            ['created', 'confirmed', 'in_production'].indexOf(step);

                          return (
                            <div key={step} className="flex items-center">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`
                                    h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium
                                    ${isCompleted || isPast ? stepConfig.color + ' text-gray-700' : 'bg-gray-200 text-gray-500'}
                                  `}
                                >
                                  {isCompleted || isPast ? '✓' : index + 1}
                                </div>
                                <div className="text-xs mt-1 whitespace-nowrap">
                                  {stepConfig.label}
                                </div>
                              </div>
                              {index < 3 && (
                                <div
                                  className={`
                                    h-0.5 w-8 mx-1
                                    ${isPast ? 'bg-primary-600' : 'bg-gray-200'}
                                  `}
                                />
                              )}
                            </div>
                          );
                        })}
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
