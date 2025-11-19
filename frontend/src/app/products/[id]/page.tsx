'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productApi, measurementApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, Badge, LoadingPage, EmptyState, RatingDisplay, Select, Input, Textarea } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { useCartStore } from '@/stores/cart';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const addToCart = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Customization state
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    loadProductData();
  }, [params.id]);

  const loadProductData = async () => {
    try {
      const [productRes, measurementsRes] = await Promise.all([
        productApi.getOne(params.id as string),
        measurementApi.getAll(),
      ]);

      setProduct(productRes.data);
      setMeasurements(measurementsRes.data);

      // Initialize selected options with defaults
      if (productRes.data.customizationOptions) {
        const defaults: Record<string, string> = {};
        productRes.data.customizationOptions.forEach((option: any) => {
          if (option.values && option.values.length > 0) {
            defaults[option.name] = option.values[0];
          }
        });
        setSelectedOptions(defaults);
      }
    } catch (error) {
      toast.error('Failed to load product details');
      router.push('/shops');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    let total = product.basePrice * quantity;

    // Add prices from selected options
    if (product.customizationOptions) {
      product.customizationOptions.forEach((option: any) => {
        const selectedValue = selectedOptions[option.name];
        const valueConfig = option.values?.find((v: any) =>
          typeof v === 'object' ? v.value === selectedValue : v === selectedValue
        );

        if (valueConfig && typeof valueConfig === 'object' && valueConfig.additionalPrice) {
          total += valueConfig.additionalPrice * quantity;
        }
      });
    }

    return total;
  };

  const handleAddToCart = () => {
    if (!selectedMeasurement && product.requiresMeasurement) {
      toast.error('Please select a measurement');
      return;
    }

    const cartItem = {
      productId: product.id,
      productName: product.name,
      shopId: product.shop.id,
      shopName: product.shop.name,
      quantity,
      basePrice: product.basePrice,
      totalPrice: calculateTotalPrice(),
      measurementId: selectedMeasurement || undefined,
      customizationOptions: selectedOptions,
      customNotes: customNotes || undefined,
      estimatedDays: product.estimatedDays,
      image: product.images?.[0],
    };

    addToCart(cartItem);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  if (loading) return <LoadingPage message="Loading product details..." />;
  if (!product) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center text-sm text-gray-600">
            <button onClick={() => router.push('/shops')} className="hover:text-primary-600">
              Shops
            </button>
            <span className="mx-2">/</span>
            <button onClick={() => router.push(`/shops/${product.shop.id}`)} className="hover:text-primary-600">
              {product.shop.name}
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div>
              <Card>
                <CardBody>
                  {product.images && product.images.length > 0 ? (
                    <>
                      <img
                        src={product.images[selectedImage]}
                        alt={product.name}
                        className="w-full h-96 object-cover rounded-lg mb-4"
                      />
                      {product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {product.images.map((img: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImage(idx)}
                              className={`
                                border-2 rounded-lg overflow-hidden transition-all
                                ${selectedImage === idx ? 'border-primary-600' : 'border-gray-200 hover:border-gray-300'}
                              `}
                            >
                              <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-20 object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Shop Info */}
              <Card className="mt-4">
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{product.shop.name}</h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {product.shop.city}, {product.shop.state}
                      </div>
                      <div className="mt-2">
                        <RatingDisplay value={product.shop.rating || 0} />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/shops/${product.shop.id}`)}
                    >
                      Visit Shop
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Product Details */}
            <div>
              <Card>
                <CardBody>
                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

                  <div className="flex items-center mb-4">
                    <Badge variant="primary" className="mr-2">
                      {product.category?.replace(/_/g, ' ')}
                    </Badge>
                    {product.isActive ? (
                      <Badge variant="success">Available</Badge>
                    ) : (
                      <Badge variant="danger">Unavailable</Badge>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="text-3xl font-bold text-primary-600 mb-1">
                      ₹{calculateTotalPrice().toFixed(2)}
                    </div>
                    {product.basePrice !== calculateTotalPrice() && (
                      <div className="text-sm text-gray-600">
                        Base price: ₹{product.basePrice} × {quantity}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{product.description}</p>
                  </div>

                  {product.estimatedDays && (
                    <div className="mb-6 p-3 bg-blue-50 rounded-lg flex items-center">
                      <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-900">
                        Estimated completion: <strong>{product.estimatedDays} days</strong>
                      </span>
                    </div>
                  )}

                  {/* Measurement Selection */}
                  {product.requiresMeasurement && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold mb-2">
                        Select Measurement <span className="text-red-500">*</span>
                      </label>
                      {measurements.length === 0 ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 mb-2">
                            You need to add your measurements first
                          </p>
                          <Button
                            size="sm"
                            onClick={() => router.push('/measurements/new')}
                          >
                            Add Measurements
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={selectedMeasurement}
                          onChange={(e) => setSelectedMeasurement(e.target.value)}
                        >
                          <option value="">Select a measurement profile</option>
                          {measurements.map((measurement) => (
                            <option key={measurement.id} value={measurement.id}>
                              {measurement.name} ({measurement.templateType?.replace(/_/g, ' ')})
                              {measurement.isDefault && ' - Default'}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Customization Options */}
                  {product.customizationOptions && product.customizationOptions.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Customization Options</h3>
                      <div className="space-y-4">
                        {product.customizationOptions.map((option: any) => (
                          <div key={option.name}>
                            <label className="block text-sm font-medium mb-2 capitalize">
                              {option.name.replace(/_/g, ' ')}
                              {option.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {option.type === 'select' && (
                              <Select
                                value={selectedOptions[option.name] || ''}
                                onChange={(e) => setSelectedOptions({
                                  ...selectedOptions,
                                  [option.name]: e.target.value,
                                })}
                              >
                                {option.values?.map((value: any) => {
                                  const displayValue = typeof value === 'object' ? value.value : value;
                                  const price = typeof value === 'object' ? value.additionalPrice : 0;

                                  return (
                                    <option key={displayValue} value={displayValue}>
                                      {displayValue}
                                      {price > 0 && ` (+₹${price})`}
                                    </option>
                                  );
                                })}
                              </Select>
                            )}

                            {option.type === 'color' && (
                              <div className="flex flex-wrap gap-2">
                                {option.values?.map((color: string) => (
                                  <button
                                    key={color}
                                    onClick={() => setSelectedOptions({
                                      ...selectedOptions,
                                      [option.name]: color,
                                    })}
                                    className={`
                                      px-4 py-2 rounded-lg border-2 transition-all capitalize
                                      ${selectedOptions[option.name] === color
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                      }
                                    `}
                                  >
                                    {color}
                                  </button>
                                ))}
                              </div>
                            )}

                            {option.type === 'text' && (
                              <Input
                                value={selectedOptions[option.name] || ''}
                                onChange={(e) => setSelectedOptions({
                                  ...selectedOptions,
                                  [option.name]: e.target.value,
                                })}
                                placeholder={option.placeholder || `Enter ${option.name}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Notes */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">
                      Special Instructions (Optional)
                    </label>
                    <Textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Add any special requests or notes for the tailor..."
                      rows={3}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">Quantity</label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button
                      fullWidth
                      onClick={handleAddToCart}
                      disabled={!product.isActive || (product.requiresMeasurement && !selectedMeasurement)}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={handleBuyNow}
                      disabled={!product.isActive || (product.requiresMeasurement && !selectedMeasurement)}
                    >
                      Buy Now
                    </Button>
                  </div>

                  {!product.isActive && (
                    <p className="text-sm text-red-600 mt-3">
                      This product is currently unavailable
                    </p>
                  )}
                </CardBody>
              </Card>

              {/* Additional Info */}
              {product.additionalInfo && (
                <Card className="mt-4">
                  <CardHeader title="Additional Information" />
                  <CardBody>
                    <div className="text-sm text-gray-700 whitespace-pre-line">
                      {product.additionalInfo}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <Card className="mt-8">
            <CardHeader title="Customer Reviews" />
            <CardBody>
              {product.reviews && product.reviews.length > 0 ? (
                <div className="space-y-4">
                  {product.reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">{review.customer?.name || 'Anonymous'}</div>
                          <RatingDisplay value={review.rating} />
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(review.createdAt), 'PP')}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.review}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No reviews yet"
                  description="Be the first to order and leave a review!"
                />
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
