'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { measurementApi } from '@/lib/api';
import { Card, Button, Input, Select, Textarea } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { MEASUREMENT_TEMPLATES, TEMPLATE_OPTIONS } from '@/lib/measurement-templates';
import toast from 'react-hot-toast';

export default function NewMeasurementPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    templateType: 'mens_shirt',
    unit: 'cm',
    measurements: {} as Record<string, string>,
    notes: '',
    consentGiven: true,
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert measurements to numbers
      const measurements = Object.entries(formData.measurements).reduce((acc, [key, value]) => {
        acc[key] = parseFloat(value);
        return acc;
      }, {} as Record<string, number>);

      await measurementApi.create({
        ...formData,
        measurements,
      });

      toast.success('Measurement profile created!');
      router.push('/measurements');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create measurement');
    } finally {
      setLoading(false);
    }
  };

  const template = MEASUREMENT_TEMPLATES[formData.templateType as keyof typeof MEASUREMENT_TEMPLATES];
  const fields = template?.fields || [];

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Create Measurement Profile</h1>
          <p className="text-gray-600 mt-1">Add your measurements for easy ordering</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Name */}
            <Input
              label="Profile Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., My Formal Shirt Size"
              helperText="Give this measurement profile a memorable name"
            />

            {/* Template Type */}
            <Select
              label="Garment Type"
              value={formData.templateType}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  templateType: e.target.value,
                  measurements: {}, // Reset measurements when template changes
                });
              }}
              options={TEMPLATE_OPTIONS}
            />

            {/* Unit Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Measurement Unit
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cm"
                    checked={formData.unit === 'cm'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mr-2"
                  />
                  Centimeters (cm)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="inch"
                    checked={formData.unit === 'inch'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mr-2"
                  />
                  Inches (in)
                </label>
              </div>
            </div>

            {/* Measurements Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Measurements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <Input
                    key={field.name}
                    label={field.label}
                    type="number"
                    step="0.1"
                    value={formData.measurements[field.name] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        measurements: {
                          ...formData.measurements,
                          [field.name]: e.target.value,
                        },
                      })
                    }
                    required
                    helperText={field.helpText}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <Textarea
              label="Additional Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any special notes or preferences..."
            />

            {/* Consent */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.consentGiven}
                  onChange={(e) =>
                    setFormData({ ...formData, consentGiven: e.target.checked })
                  }
                  className="mt-1 mr-3"
                  required
                />
                <div className="text-sm">
                  <label className="font-medium text-gray-900">
                    Consent to share measurements
                  </label>
                  <p className="text-gray-600 mt-1">
                    I consent to share these measurements with tailors when placing orders.
                    Your measurements are encrypted and only shared with your chosen tailor.
                  </p>
                </div>
              </div>
            </div>

            {/* Default */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                Set as my default measurement profile
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={loading}>
                Save Measurement Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 bg-gray-50">
          <h3 className="font-semibold mb-2">How to measure yourself</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Use a flexible measuring tape</li>
            <li>• Wear fitted clothing or measure on bare skin</li>
            <li>• Stand naturally and don't hold your breath</li>
            <li>• Ask someone to help for more accurate measurements</li>
            <li>• Measure twice to ensure accuracy</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
