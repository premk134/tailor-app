'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { measurementApi } from '@/lib/api';
import { Card, CardHeader, CardBody, CardFooter, Button, Badge, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { MEASUREMENT_TEMPLATES } from '@/lib/measurement-templates';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function MeasurementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [measurement, setMeasurement] = useState<any>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [showAccessLogs, setShowAccessLogs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeasurement();
  }, [params.id]);

  const loadMeasurement = async () => {
    try {
      const response = await measurementApi.getOne(params.id as string);
      setMeasurement(response.data);

      // Load access logs
      const logsResponse = await measurementApi.getAccessLogs(params.id as string);
      setAccessLogs(logsResponse.data);
    } catch (error: any) {
      toast.error('Failed to load measurement');
      router.push('/measurements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this measurement?')) return;

    try {
      await measurementApi.delete(params.id as string);
      toast.success('Measurement deleted');
      router.push('/measurements');
    } catch (error) {
      toast.error('Failed to delete measurement');
    }
  };

  if (loading) return <LoadingPage message="Loading measurement..." />;
  if (!measurement) return null;

  const template = MEASUREMENT_TEMPLATES[measurement.templateType as keyof typeof MEASUREMENT_TEMPLATES];

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{measurement.name}</h1>
            <p className="text-gray-600 mt-1 capitalize">
              {measurement.templateType.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/measurements/${params.id}/edit`)}
            >
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex space-x-2 mb-6">
          {measurement.isDefault && (
            <Badge variant="primary">Default Profile</Badge>
          )}
          {measurement.consentGiven && (
            <Badge variant="success">Sharing Enabled</Badge>
          )}
          <Badge variant="info">{measurement.unit.toUpperCase()}</Badge>
        </div>

        {/* Measurements */}
        <Card className="mb-6">
          <CardHeader title="Measurements" />
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(measurement.measurements).map(([key, value]) => {
                const field = template.fields.find(f => f.name === key);
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">
                      {field?.label || key}
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      {value} {measurement.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Notes */}
        {measurement.notes && (
          <Card className="mb-6">
            <CardHeader title="Additional Notes" />
            <CardBody>
              <p className="text-gray-700 whitespace-pre-wrap">{measurement.notes}</p>
            </CardBody>
          </Card>
        )}

        {/* Photos */}
        {measurement.photos && measurement.photos.length > 0 && (
          <Card className="mb-6">
            <CardHeader title="Reference Photos" />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {measurement.photos.map((photo: string, index: number) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Reference ${index + 1}`}
                    className="rounded-lg object-cover h-48 w-full"
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Metadata */}
        <Card className="mb-6">
          <CardHeader title="Information" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Created</div>
                <div className="font-medium">
                  {format(new Date(measurement.createdAt), 'PPP')}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Last Updated</div>
                <div className="font-medium">
                  {format(new Date(measurement.updatedAt), 'PPP')}
                </div>
              </div>
              {measurement.lastUsedAt && (
                <div>
                  <div className="text-gray-600">Last Used</div>
                  <div className="font-medium">
                    {format(new Date(measurement.lastUsedAt), 'PPP')}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Access Logs */}
        <Card>
          <CardHeader
            title="Access History"
            subtitle="See who has viewed your measurements"
            actions={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAccessLogs(!showAccessLogs)}
              >
                {showAccessLogs ? 'Hide' : 'Show'}
              </Button>
            }
          />
          {showAccessLogs && (
            <CardBody>
              {accessLogs.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No one has accessed this measurement yet
                </p>
              ) : (
                <div className="space-y-3">
                  {accessLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{log.viewedBy}</div>
                        <div className="text-sm text-gray-600">
                          {log.details?.shopName || 'Unknown shop'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(log.viewedAt), 'PPp')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          )}
        </Card>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Your measurements are secure</p>
              <p>
                All measurements are encrypted and only shared with tailors when you place an order.
                You can track who accesses your measurements in the access history above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
