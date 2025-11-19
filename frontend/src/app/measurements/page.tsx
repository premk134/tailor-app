'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { measurementApi } from '@/lib/api';
import { Card, Button, Badge, EmptyState, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    try {
      const response = await measurementApi.getAll();
      setMeasurements(response.data);
    } catch (error) {
      toast.error('Failed to load measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this measurement?')) return;

    try {
      await measurementApi.delete(id);
      toast.success('Measurement deleted');
      loadMeasurements();
    } catch (error) {
      toast.error('Failed to delete measurement');
    }
  };

  if (loading) return <LoadingPage message="Loading measurements..." />;

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Measurements</h1>
            <p className="text-gray-600 mt-1">Manage your measurement profiles</p>
          </div>
          <Button onClick={() => router.push('/measurements/new')}>
            Add New Measurement
          </Button>
        </div>

        {measurements.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
            title="No measurements yet"
            description="Create your first measurement profile to make ordering easier"
            action={
              <Button onClick={() => router.push('/measurements/new')}>
                Create Measurement Profile
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {measurements.map((measurement) => (
              <Card
                key={measurement.id}
                className="cursor-pointer hover:shadow-lg transition-shadow relative"
                onClick={() => router.push(`/measurements/${measurement.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{measurement.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {measurement.templateType.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {measurement.isDefault && (
                    <Badge variant="primary" size="sm">Default</Badge>
                  )}
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Created: {format(new Date(measurement.createdAt), 'PP')}
                  </div>
                  {measurement.lastUsedAt && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last used: {format(new Date(measurement.lastUsedAt), 'PP')}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/measurements/${measurement.id}/edit`);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={(e) => handleDelete(measurement.id, e)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
