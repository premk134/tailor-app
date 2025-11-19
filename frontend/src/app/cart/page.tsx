'use client';

import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { Card, CardHeader, CardBody, Button, EmptyState, Badge } from '@/components/ui';
import { Header } from '@/components/layout/Header';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, getItemsByShop, clearCart } = useCartStore();

  const itemsByShop = getItemsByShop();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <EmptyState
            icon={
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            }
            title="Your cart is empty"
            description="Browse our tailors and add products to your cart"
            action={
              <Button onClick={() => router.push('/shops')}>
                Browse Tailors
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
              <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
              <p className="text-gray-600">
                {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                }
              }}
            >
              Clear Cart
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {Array.from(itemsByShop.entries()).map(([shopId, shopItems]) => (
                <Card key={shopId}>
                  <CardHeader
                    title={shopItems[0].shopName}
                    subtitle={`${shopItems.length} ${shopItems.length === 1 ? 'item' : 'items'}`}
                  />
                  <CardBody>
                    <div className="space-y-4">
                      {shopItems.map((item, index) => (
                        <div
                          key={`${item.productId}-${index}`}
                          className="flex items-start space-x-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0"
                        >
                          {/* Product Image */}
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.productName}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}

                          {/* Product Details */}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{item.productName}</h3>

                            {/* Customization Options */}
                            {item.customizationOptions && Object.keys(item.customizationOptions).length > 0 && (
                              <div className="mb-2">
                                {Object.entries(item.customizationOptions).map(([key, value]) => (
                                  <div key={key} className="text-sm text-gray-600">
                                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>: {value}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Measurement ID */}
                            {item.measurementId && (
                              <div className="text-sm text-gray-600 mb-2">
                                Using saved measurements
                              </div>
                            )}

                            {/* Custom Notes */}
                            {item.customNotes && (
                              <div className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Notes:</span> {item.customNotes}
                              </div>
                            )}

                            {/* Estimated Days */}
                            {item.estimatedDays && (
                              <div className="flex items-center text-sm text-gray-600 mb-3">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {item.estimatedDays} days
                              </div>
                            )}

                            {/* Price and Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <span className="text-lg font-semibold w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>

                              <div className="text-right">
                                <div className="text-xl font-bold text-primary-600">
                                  ₹{item.totalPrice.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ₹{(item.totalPrice / item.quantity).toFixed(2)} each
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => {
                              if (confirm('Remove this item from cart?')) {
                                removeItem(item.productId);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader title="Order Summary" />
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span>Tax (included)</span>
                      <span>₹0.00</span>
                    </div>

                    <div className="flex justify-between text-gray-700">
                      <span>Delivery Fee</span>
                      <span className="text-green-600">Calculated at checkout</span>
                    </div>

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-2xl font-bold text-primary-600">
                          ₹{total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <Button
                      fullWidth
                      size="lg"
                      onClick={() => router.push('/checkout')}
                      className="mt-4"
                    >
                      Proceed to Checkout
                    </Button>

                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => router.push('/shops')}
                    >
                      Continue Shopping
                    </Button>
                  </div>

                  {/* Multiple Shops Warning */}
                  {itemsByShop.size > 1 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">
                            Multiple shops in cart
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            You have items from {itemsByShop.size} different shops. Each shop will require a separate order.
                          </p>
                        </div>
                      </div>
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
