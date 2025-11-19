'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { productApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Select } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'mens_shirt',
  'mens_pants',
  'womens_blouse',
  'womens_saree',
  'kids_wear',
  'wedding_wear',
  'formal_wear',
  'casual_wear',
  'traditional_wear',
  'alterations',
  'embroidery',
  'custom_design',
];

interface CustomizationOption {
  name: string;
  type: 'select' | 'color' | 'text';
  required: boolean;
  values: any[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    basePrice: '',
    estimatedDays: '',
    requiresMeasurement: true,
    isActive: true,
    additionalInfo: '',
  });

  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOption[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    const basePrice = parseFloat(formData.basePrice);
    if (isNaN(basePrice) || basePrice <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        ...formData,
        basePrice,
        estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : undefined,
        customizationOptions: customizationOptions.length > 0 ? customizationOptions : undefined,
      };

      await productApi.create(productData);
      toast.success('Product created successfully!');
      router.push('/tailor/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const addCustomizationOption = () => {
    setCustomizationOptions([
      ...customizationOptions,
      {
        name: '',
        type: 'select',
        required: false,
        values: [],
      },
    ]);
  };

  const updateCustomizationOption = (index: number, field: string, value: any) => {
    const updated = [...customizationOptions];
    updated[index] = { ...updated[index], [field]: value };
    setCustomizationOptions(updated);
  };

  const removeCustomizationOption = (index: number) => {
    setCustomizationOptions(customizationOptions.filter((_, i) => i !== index));
  };

  const addOptionValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return;

    const updated = [...customizationOptions];
    updated[optionIndex].values.push(value.trim());
    setCustomizationOptions(updated);
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const updated = [...customizationOptions];
    updated[optionIndex].values = updated[optionIndex].values.filter((_, i) => i !== valueIndex);
    setCustomizationOptions(updated);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/tailor/products')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Products
            </button>

            <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
            <p className="text-gray-600">Create a new product or service offering</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Card className="mb-6">
              <CardHeader title="Basic Information" />
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Custom Tailored Shirt"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your product..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Base Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Estimated Days
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.estimatedDays}
                        onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                        placeholder="e.g., 7"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requiresMeasurement}
                        onChange={(e) =>
                          setFormData({ ...formData, requiresMeasurement: e.target.checked })
                        }
                        className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium">Requires customer measurements</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium">Active (visible to customers)</span>
                    </label>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Customization Options */}
            <Card className="mb-6">
              <CardHeader
                title="Customization Options"
                subtitle="Add options for customers to customize this product"
                actions={
                  <Button type="button" size="sm" onClick={addCustomizationOption}>
                    Add Option
                  </Button>
                }
              />
              <CardBody>
                {customizationOptions.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">
                    No customization options added yet
                  </p>
                ) : (
                  <div className="space-y-6">
                    {customizationOptions.map((option, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="font-semibold">Option #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeCustomizationOption(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Option Name</label>
                              <Input
                                value={option.name}
                                onChange={(e) =>
                                  updateCustomizationOption(index, 'name', e.target.value)
                                }
                                placeholder="e.g., Fabric Type, Color, Collar Style"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Type</label>
                              <Select
                                value={option.type}
                                onChange={(e) =>
                                  updateCustomizationOption(index, 'type', e.target.value)
                                }
                              >
                                <option value="select">Dropdown</option>
                                <option value="color">Color Picker</option>
                                <option value="text">Text Input</option>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={option.required}
                                onChange={(e) =>
                                  updateCustomizationOption(index, 'required', e.target.checked)
                                }
                                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <span className="text-sm">Required field</span>
                            </label>
                          </div>

                          {(option.type === 'select' || option.type === 'color') && (
                            <div>
                              <label className="block text-sm font-medium mb-1">Values</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {option.values.map((value, valueIndex) => (
                                  <span
                                    key={valueIndex}
                                    className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                                  >
                                    {value}
                                    <button
                                      type="button"
                                      onClick={() => removeOptionValue(index, valueIndex)}
                                      className="ml-2 text-primary-600 hover:text-primary-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Add a value"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addOptionValue(index, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    addOptionValue(index, input.value);
                                    input.value = '';
                                  }}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Additional Information */}
            <Card className="mb-6">
              <CardHeader title="Additional Information" />
              <CardBody>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Additional Info (Optional)
                  </label>
                  <Textarea
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    placeholder="Any additional details, care instructions, etc..."
                    rows={3}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/tailor/products')}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} disabled={submitting}>
                Create Product
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
