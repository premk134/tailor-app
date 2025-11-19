'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { orderApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, Input, Select, Textarea, Badge } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

type CheckoutStep = 'delivery' | 'payment' | 'review';

interface DeliveryDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getItemsByShop, clearCart } = useCartStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | 'upi'>('cash');
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });
  const [scheduledDate, setScheduledDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsByShop = getItemsByShop();
  const subtotal = getTotal();
  const deliveryFee = deliveryType === 'delivery' ? 50 : 0; // ₹50 flat delivery fee
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items, router]);

  const validateDeliveryDetails = () => {
    if (deliveryType === 'delivery') {
      const required = ['fullName', 'phone', 'address', 'city', 'state', 'pincode'];
      for (const field of required) {
        if (!deliveryDetails[field as keyof DeliveryDetails]) {
          toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }

      // Validate phone number
      if (!/^\d{10}$/.test(deliveryDetails.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return false;
      }

      // Validate pincode
      if (!/^\d{6}$/.test(deliveryDetails.pincode)) {
        toast.error('Please enter a valid 6-digit pincode');
        return false;
      }
    }

    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 'delivery') {
      if (!validateDeliveryDetails()) return;
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'payment') {
      setCurrentStep('delivery');
    } else if (currentStep === 'review') {
      setCurrentStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    try {
      // Create separate orders for each shop
      const orderPromises = Array.from(itemsByShop.entries()).map(async ([shopId, shopItems]) => {
        const orderData = {
          shopId,
          items: shopItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            measurementId: item.measurementId,
            customizationOptions: item.customizationOptions,
            customNotes: item.customNotes,
          })),
          deliveryType,
          deliveryAddress: deliveryType === 'delivery' ? deliveryDetails : undefined,
          scheduledFor: scheduledDate || undefined,
          paymentMethod,
          notes: orderNotes || undefined,
        };

        return orderApi.create(orderData);
      });

      const orders = await Promise.all(orderPromises);

      // Clear cart
      clearCart();

      // Show success message
      toast.success(`${orders.length} order(s) placed successfully!`);

      // Redirect to orders page
      router.push('/orders');
    } catch (error: any) {
      console.error('Order placement error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 'delivery', label: 'Delivery' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review' },
  ];

  if (items.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        h-10 w-10 rounded-full flex items-center justify-center font-semibold
                        ${
                          currentStep === step.id
                            ? 'bg-primary-600 text-white'
                            : steps.findIndex((s) => s.id === currentStep) > index
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }
                      `}
                    >
                      {steps.findIndex((s) => s.id === currentStep) > index ? (
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="text-sm mt-2 font-medium">{step.label}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        h-0.5 w-24 mx-4 mb-6
                        ${steps.findIndex((s) => s.id === currentStep) > index ? 'bg-green-600' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Delivery Step */}
              {currentStep === 'delivery' && (
                <Card>
                  <CardHeader title="Delivery Details" />
                  <CardBody>
                    {/* Delivery Type Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-3">Delivery Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setDeliveryType('pickup')}
                          className={`
                            p-4 border-2 rounded-lg text-left transition-all
                            ${deliveryType === 'pickup' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
                          `}
                        >
                          <div className="flex items-center mb-2">
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-semibold">Pickup</span>
                          </div>
                          <p className="text-sm text-gray-600">Collect from shop</p>
                        </button>

                        <button
                          onClick={() => setDeliveryType('delivery')}
                          className={`
                            p-4 border-2 rounded-lg text-left transition-all
                            ${deliveryType === 'delivery' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
                          `}
                        >
                          <div className="flex items-center mb-2">
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span className="font-semibold">Home Delivery</span>
                          </div>
                          <p className="text-sm text-gray-600">Delivered to your address</p>
                        </button>
                      </div>
                    </div>

                    {/* Delivery Address Form */}
                    {deliveryType === 'delivery' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={deliveryDetails.fullName}
                              onChange={(e) => setDeliveryDetails({ ...deliveryDetails, fullName: e.target.value })}
                              placeholder="Enter your full name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={deliveryDetails.phone}
                              onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                              placeholder="10-digit phone number"
                              maxLength={10}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Address <span className="text-red-500">*</span>
                          </label>
                          <Textarea
                            value={deliveryDetails.address}
                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                            placeholder="House/Flat No., Street Name"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Landmark (Optional)</label>
                          <Input
                            value={deliveryDetails.landmark}
                            onChange={(e) => setDeliveryDetails({ ...deliveryDetails, landmark: e.target.value })}
                            placeholder="Near landmark"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              City <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={deliveryDetails.city}
                              onChange={(e) => setDeliveryDetails({ ...deliveryDetails, city: e.target.value })}
                              placeholder="City"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              State <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={deliveryDetails.state}
                              onChange={(e) => setDeliveryDetails({ ...deliveryDetails, state: e.target.value })}
                              placeholder="State"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Pincode <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={deliveryDetails.pincode}
                              onChange={(e) => setDeliveryDetails({ ...deliveryDetails, pincode: e.target.value })}
                              placeholder="6-digit pincode"
                              maxLength={6}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scheduled Date */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium mb-1">
                        Preferred Completion Date (Optional)
                      </label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is your preferred date. Actual completion may vary based on shop availability.
                      </p>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Payment Step */}
              {currentStep === 'payment' && (
                <Card>
                  <CardHeader title="Payment Method" />
                  <CardBody>
                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`
                          w-full p-4 border-2 rounded-lg text-left transition-all flex items-center
                          ${paymentMethod === 'cash' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
                        `}
                      >
                        <div className="flex-1">
                          <div className="font-semibold mb-1">Cash on Delivery</div>
                          <p className="text-sm text-gray-600">Pay when you receive your order</p>
                        </div>
                        {paymentMethod === 'cash' && (
                          <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={() => setPaymentMethod('upi')}
                        className={`
                          w-full p-4 border-2 rounded-lg text-left transition-all flex items-center
                          ${paymentMethod === 'upi' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
                        `}
                      >
                        <div className="flex-1">
                          <div className="font-semibold mb-1">UPI Payment</div>
                          <p className="text-sm text-gray-600">Pay using Google Pay, PhonePe, Paytm, etc.</p>
                        </div>
                        {paymentMethod === 'upi' && (
                          <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>

                      <button
                        onClick={() => setPaymentMethod('online')}
                        className={`
                          w-full p-4 border-2 rounded-lg text-left transition-all flex items-center
                          ${paymentMethod === 'online' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}
                        `}
                      >
                        <div className="flex-1">
                          <div className="font-semibold mb-1">Online Payment</div>
                          <p className="text-sm text-gray-600">Credit/Debit Card, Net Banking</p>
                        </div>
                        {paymentMethod === 'online' && (
                          <svg className="h-6 w-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Order Notes */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium mb-1">
                        Order Notes (Optional)
                      </label>
                      <Textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Any special instructions or requests..."
                        rows={3}
                      />
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <div className="space-y-4">
                  {/* Order Items */}
                  {Array.from(itemsByShop.entries()).map(([shopId, shopItems]) => (
                    <Card key={shopId}>
                      <CardHeader
                        title={`Order from ${shopItems[0].shopName}`}
                        subtitle={`${shopItems.length} ${shopItems.length === 1 ? 'item' : 'items'}`}
                      />
                      <CardBody>
                        <div className="space-y-3">
                          {shopItems.map((item, index) => (
                            <div key={`${item.productId}-${index}`} className="flex items-start justify-between pb-3 border-b border-gray-200 last:border-0">
                              <div className="flex-1">
                                <div className="font-semibold">{item.productName}</div>
                                <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                                {item.customizationOptions && Object.keys(item.customizationOptions).length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    {Object.entries(item.customizationOptions).map(([key, value]) => (
                                      <div key={key}>
                                        {key}: {value}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="font-bold text-primary-600">₹{item.totalPrice.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  ))}

                  {/* Delivery Details */}
                  <Card>
                    <CardHeader title="Delivery Details" />
                    <CardBody>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <span className="font-semibold w-32">Delivery Type:</span>
                          <span className="capitalize">{deliveryType}</span>
                        </div>
                        {deliveryType === 'delivery' && (
                          <>
                            <div className="flex items-start">
                              <span className="font-semibold w-32">Address:</span>
                              <span>
                                {deliveryDetails.fullName}, {deliveryDetails.phone}
                                <br />
                                {deliveryDetails.address}
                                {deliveryDetails.landmark && `, ${deliveryDetails.landmark}`}
                                <br />
                                {deliveryDetails.city}, {deliveryDetails.state} - {deliveryDetails.pincode}
                              </span>
                            </div>
                          </>
                        )}
                        {scheduledDate && (
                          <div className="flex items-center">
                            <span className="font-semibold w-32">Preferred Date:</span>
                            <span>{new Date(scheduledDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="font-semibold w-32">Payment:</span>
                          <span className="capitalize">{paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 'delivery'}
                >
                  Previous
                </Button>

                {currentStep !== 'review' ? (
                  <Button onClick={handleNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handlePlaceOrder}
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Place Order
                  </Button>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardHeader title="Order Summary" />
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal ({items.length} items)</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Fee</span>
                      <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-2xl font-bold text-primary-600">
                          ₹{total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {itemsByShop.size > 1 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> You have items from {itemsByShop.size} shops. Separate orders will be created for each shop.
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
