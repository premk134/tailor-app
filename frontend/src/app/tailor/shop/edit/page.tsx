'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Select, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'mens_wear',
  'womens_wear',
  'kids_wear',
  'alterations',
  'embroidery',
  'tailoring_services',
  'custom_design',
  'wedding_wear',
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ShopEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [shopId, setShopId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    categories: [] as string[],
    acceptingOrders: true,
    paymentMethods: {
      cash: true,
      online: false,
      upi: false,
    },
    workingHours: {} as Record<string, { open: string; close: string; closed: boolean }>,
  });

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const response = await shopApi.getMyShop();
      const shop = response.data;
      setIsEditing(true);
      setShopId(shop.id);

      setFormData({
        name: shop.name || '',
        description: shop.description || '',
        phone: shop.phone || '',
        email: shop.email || '',
        address: shop.address || '',
        city: shop.city || '',
        state: shop.state || '',
        pincode: shop.pincode || '',
        categories: shop.categories || [],
        acceptingOrders: shop.acceptingOrders ?? true,
        paymentMethods: shop.paymentMethods || {
          cash: true,
          online: false,
          upi: false,
        },
        workingHours: shop.workingHours || initializeWorkingHours(),
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        // New shop - initialize working hours
        setFormData((prev) => ({
          ...prev,
          workingHours: initializeWorkingHours(),
        }));
      } else {
        toast.error('Failed to load shop');
      }
    } finally {
      setLoading(false);
    }
  };

  const initializeWorkingHours = () => {
    const hours: Record<string, { open: string; close: string; closed: boolean }> = {};
    DAYS.forEach((day) => {
      hours[day] = {
        open: '09:00',
        close: '18:00',
        closed: day === 'sunday',
      };
    });
    return hours;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Shop name is required');
      return;
    }

    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing) {
        await shopApi.update(shopId, formData);
        toast.success('Shop updated successfully!');
      } else {
        await shopApi.create(formData);
        toast.success('Shop created successfully! Waiting for admin approval.');
      }

      router.push('/tailor/shop');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save shop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  if (loading) return <LoadingPage message="Loading shop details..." />;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/tailor/shop')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Shop
            </button>

            <h1 className="text-3xl font-bold mb-2">
              {isEditing ? 'Edit Shop' : 'Create Your Shop'}
            </h1>
            <p className="text-gray-600">
              {isEditing
                ? 'Update your shop details and settings'
                : 'Fill in the details to create your shop'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card className="mb-6">
              <CardHeader
                title="Basic Information"
                subtitle="Provide your shop's basic details"
              />
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Shop Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your shop name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your shop and services..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="10-digit phone number"
                        maxLength={10}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Location */}
            <Card className="mb-6">
              <CardHeader
                title="Location"
                subtitle="Where is your shop located?"
              />
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street address, building name, etc."
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="State"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="6-digit pincode"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Categories */}
            <Card className="mb-6">
              <CardHeader
                title="Categories"
                subtitle="Select the services you offer"
              />
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`
                        p-3 border-2 rounded-lg text-left transition-all capitalize
                        ${formData.categories.includes(category)
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {category.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Payment Methods */}
            <Card className="mb-6">
              <CardHeader
                title="Payment Methods"
                subtitle="Select payment methods you accept"
              />
              <CardBody>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.cash}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethods: {
                            ...formData.paymentMethods,
                            cash: e.target.checked,
                          },
                        })
                      }
                      className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span>Cash on Delivery</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.upi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethods: {
                            ...formData.paymentMethods,
                            upi: e.target.checked,
                          },
                        })
                      }
                      className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span>UPI Payment</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.online}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethods: {
                            ...formData.paymentMethods,
                            online: e.target.checked,
                          },
                        })
                      }
                      className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span>Online Payment (Card/Net Banking)</span>
                  </label>
                </div>
              </CardBody>
            </Card>

            {/* Working Hours */}
            <Card className="mb-6">
              <CardHeader
                title="Working Hours"
                subtitle="Set your shop's operating hours"
              />
              <CardBody>
                <div className="space-y-3">
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center space-x-4">
                      <div className="w-32 capitalize font-medium">{day}</div>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.workingHours[day]?.closed || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              workingHours: {
                                ...formData.workingHours,
                                [day]: {
                                  ...formData.workingHours[day],
                                  closed: e.target.checked,
                                },
                              },
                            })
                          }
                          className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm">Closed</span>
                      </label>

                      {!formData.workingHours[day]?.closed && (
                        <>
                          <Input
                            type="time"
                            value={formData.workingHours[day]?.open || '09:00'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workingHours: {
                                  ...formData.workingHours,
                                  [day]: {
                                    ...formData.workingHours[day],
                                    open: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={formData.workingHours[day]?.close || '18:00'}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workingHours: {
                                  ...formData.workingHours,
                                  [day]: {
                                    ...formData.workingHours[day],
                                    close: e.target.value,
                                  },
                                },
                              })
                            }
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/tailor/shop')}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} disabled={submitting}>
                {isEditing ? 'Update Shop' : 'Create Shop'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
