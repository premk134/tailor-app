'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderApi, chatApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, Badge, LoadingPage, Rating, Textarea, Modal, ModalBody, ModalFooter } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  created: { label: 'Created', variant: 'default' as const },
  pending_confirmation: { label: 'Pending Confirmation', variant: 'warning' as const },
  confirmed: { label: 'Confirmed', variant: 'info' as const },
  in_production: { label: 'In Production', variant: 'warning' as const },
  ready_for_pickup: { label: 'Ready for Pickup', variant: 'success' as const },
  out_for_delivery: { label: 'Out for Delivery', variant: 'info' as const },
  delivered: { label: 'Delivered', variant: 'success' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  cancelled: { label: 'Cancelled', variant: 'danger' as const },
  refunded: { label: 'Refunded', variant: 'danger' as const },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, review: '' });

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const response = await orderApi.getOne(params.id as string);
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to load order');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await orderApi.addReview(params.id as string, reviewData.rating, reviewData.review);
      toast.success('Review submitted!');
      setShowReviewModal(false);
      loadOrder();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  if (loading) return <LoadingPage message="Loading order details..." />;
  if (!order) return null;

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const canReview = order.status === 'completed' && !order.rating;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">Order Details</h1>
              <p className="text-gray-600 mt-1">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <Badge variant={statusConfig.variant} size="lg">
              {statusConfig.label}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card>
                <CardHeader title="Order Items" />
                <CardBody>
                  <div className="space-y-4">
                    {order.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-start pb-4 border-b last:border-0">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.productName}</h4>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            {item.selectedOptions && (
                              <>
                                {item.selectedOptions.fabric && (
                                  <div>Fabric: {item.selectedOptions.fabric}</div>
                                )}
                                {item.selectedOptions.color && (
                                  <div>Color: {item.selectedOptions.color}</div>
                                )}
                                {item.selectedOptions.addons && item.selectedOptions.addons.length > 0 && (
                                  <div>Add-ons: {item.selectedOptions.addons.join(', ')}</div>
                                )}
                              </>
                            )}
                            <div>Quantity: {item.quantity}</div>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold">₹{item.totalPrice}</div>
                          {item.priceAdjustments !== 0 && (
                            <div className="text-sm text-gray-600">
                              (Base: ₹{item.basePrice})
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-6 pt-6 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    {order.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span>₹{order.tax}</span>
                      </div>
                    )}
                    {order.deliveryCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Charge</span>
                        <span>₹{order.deliveryCharge}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-₹{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary-600">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Order Timeline */}
              <Card>
                <CardHeader title="Order Timeline" />
                <CardBody>
                  <div className="space-y-4">
                    {order.events?.map((event: any) => (
                      <div key={event.id} className="flex">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <svg className="h-4 w-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="font-medium capitalize">
                            {event.eventType.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(event.createdAt), 'PPp')}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {/* Customer Notes */}
              {order.customerNotes && (
                <Card>
                  <CardHeader title="Your Notes" />
                  <CardBody>
                    <p className="text-gray-700 whitespace-pre-wrap">{order.customerNotes}</p>
                  </CardBody>
                </Card>
              )}

              {/* Tailor Notes */}
              {order.tailorNotes && (
                <Card>
                  <CardHeader title="Tailor Notes" />
                  <CardBody>
                    <p className="text-gray-700 whitespace-pre-wrap">{order.tailorNotes}</p>
                  </CardBody>
                </Card>
              )}

              {/* Review */}
              {order.rating ? (
                <Card>
                  <CardHeader title="Your Review" />
                  <CardBody>
                    <Rating value={order.rating} readonly />
                    {order.review && (
                      <p className="text-gray-700 mt-3">{order.review}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Reviewed on {format(new Date(order.reviewedAt), 'PPP')}
                    </p>
                  </CardBody>
                </Card>
              ) : canReview && (
                <Card>
                  <CardBody>
                    <div className="text-center py-4">
                      <p className="text-gray-700 mb-4">How was your experience?</p>
                      <Button onClick={() => setShowReviewModal(true)}>
                        Write a Review
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Shop Info */}
              <Card>
                <CardHeader title="Shop Information" />
                <CardBody>
                  <h3 className="font-semibold text-lg mb-2">{order.shop?.name}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {order.shop?.phone && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {order.shop.phone}
                      </div>
                    )}
                    {order.shop?.email && (
                      <div className="flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {order.shop.email}
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => router.push(`/orders/${order.id}/chat`)}
                  >
                    Chat with Tailor
                  </Button>
                </CardBody>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader title="Delivery Information" />
                <CardBody>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-600">Type</div>
                      <div className="font-medium capitalize">
                        {order.deliveryType?.replace('_', ' ')}
                      </div>
                    </div>
                    {order.deliveryAddress && (
                      <div>
                        <div className="text-gray-600 mb-1">Address</div>
                        <div className="font-medium">
                          {order.deliveryAddress.fullName}<br />
                          {order.deliveryAddress.addressLine1}<br />
                          {order.deliveryAddress.addressLine2 && (
                            <>{order.deliveryAddress.addressLine2}<br /></>
                          )}
                          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.pincode}
                        </div>
                      </div>
                    )}
                    {order.scheduledFor && (
                      <div>
                        <div className="text-gray-600">Scheduled For</div>
                        <div className="font-medium">
                          {format(new Date(order.scheduledFor), 'PPP')}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader title="Payment" />
                <CardBody>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <Badge
                        variant={
                          order.paymentStatus === 'paid'
                            ? 'success'
                            : order.paymentStatus === 'failed'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Actions */}
              {order.status === 'pending_confirmation' && (
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this order?')) {
                      // Handle cancel
                      toast.info('Cancel order functionality');
                    }
                  }}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Write a Review"
        size="md"
      >
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <Rating
                value={reviewData.rating}
                onChange={(value) => setReviewData({ ...reviewData, rating: value })}
                size="lg"
              />
            </div>
            <Textarea
              label="Your Review"
              value={reviewData.review}
              onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
              rows={4}
              placeholder="Share your experience with this tailor..."
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowReviewModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReview}>Submit Review</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
