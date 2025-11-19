# Frontend Completion Guide

## What's Complete ✅

- ✅ Complete UI Component Library (Button, Input, Card, Modal, Select, Textarea, Badge, Loading, Alert, Rating, EmptyState)
- ✅ Authentication pages (Login, Signup)
- ✅ Landing page
- ✅ Header component with navigation
- ✅ API client with all endpoints
- ✅ Auth store (state management)
- ✅ Tailwind CSS configuration

## What Needs to Be Built 📋

### 1. Measurement Management Pages

#### `/measurements/page.tsx` - List Measurements
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { measurementApi } from '@/lib/api';
import { Card, Button, Badge, EmptyState, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState([]);
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Measurements</h1>
          <Button onClick={() => router.push('/measurements/new')}>
            Add New Measurement
          </Button>
        </div>

        {measurements.length === 0 ? (
          <EmptyState
            title="No measurements yet"
            description="Create your first measurement profile to get started"
            action={
              <Button onClick={() => router.push('/measurements/new')}>
                Create Measurement
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {measurements.map((measurement) => (
              <Card key={measurement.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/measurements/${measurement.id}`)}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{measurement.name}</h3>
                    <p className="text-sm text-gray-500">{measurement.templateType.replace('_', ' ')}</p>
                  </div>
                  {measurement.isDefault && <Badge variant="primary">Default</Badge>}
                </div>
                <div className="text-sm text-gray-600">
                  Last used: {measurement.lastUsedAt || 'Never'}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
```

#### `/measurements/new/page.tsx` - Create Measurement
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { measurementApi } from '@/lib/api';
import { Card, Button, Input, Select, Textarea } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

const measurementTemplates = [
  { value: 'mens_shirt', label: "Men's Shirt" },
  { value: 'mens_pants', label: "Men's Pants" },
  { value: 'womens_blouse', label: "Women's Blouse" },
  // Add more templates
];

const fieldsByTemplate = {
  mens_shirt: [
    { name: 'chest', label: 'Chest (cm)', type: 'number' },
    { name: 'waist', label: 'Waist (cm)', type: 'number' },
    { name: 'shoulder', label: 'Shoulder Width (cm)', type: 'number' },
    { name: 'sleeveLength', label: 'Sleeve Length (cm)', type: 'number' },
    { name: 'shirtLength', label: 'Shirt Length (cm)', type: 'number' },
    { name: 'neck', label: 'Neck (cm)', type: 'number' },
  ],
  // Define for other templates...
};

export default function NewMeasurementPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    templateType: 'mens_shirt',
    unit: 'cm',
    measurements: {},
    notes: '',
    isDefault: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await measurementApi.create(formData);
      toast.success('Measurement created!');
      router.push('/measurements');
    } catch (error) {
      toast.error('Failed to create measurement');
    }
  };

  const fields = fieldsByTemplate[formData.templateType] || [];

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Create Measurement Profile</h1>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Profile Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., My Formal Shirt Size"
            />

            <Select
              label="Garment Type"
              value={formData.templateType}
              onChange={(e) => setFormData({ ...formData, templateType: e.target.value })}
              options={measurementTemplates}
            />

            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => (
                <Input
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  value={formData.measurements[field.name] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      measurements: { ...formData.measurements, [field.name]: e.target.value },
                    })
                  }
                  required
                />
              ))}
            </div>

            <Textarea
              label="Additional Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="mr-2"
              />
              <label>Set as default measurement</label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">Save Measurement</Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
```

### 2. Shop Browsing Pages

#### `/shops/page.tsx` - Browse Shops
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shopApi } from '@/lib/api';
import { Card, Input, Select, RatingDisplay, Badge, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [filters, setFilters] = useState({ city: '', category: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadShops();
  }, [filters]);

  const loadShops = async () => {
    try {
      const response = await shopApi.getAll(filters);
      setShops(response.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Browse Tailors</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search by city..."
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
          <Select
            options={[
              { value: '', label: 'All Categories' },
              { value: 'mens_wear', label: "Men's Wear" },
              { value: 'womens_wear', label: "Women's Wear" },
            ]}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          />
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card
              key={shop.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/shops/${shop.id}`)}
            >
              <h3 className="text-xl font-semibold mb-2">{shop.name}</h3>
              <p className="text-gray-600 mb-2">{shop.city}, {shop.state}</p>
              <RatingDisplay value={shop.rating || 0} />
              <div className="flex flex-wrap gap-2 mt-4">
                {shop.categories?.map((cat) => (
                  <Badge key={cat} variant="primary">{cat}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
```

#### `/shops/[id]/page.tsx` - Shop Details
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { shopApi, productApi } from '@/lib/api';
import { Card, Button, RatingDisplay, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';

export default function ShopDetailsPage() {
  const params = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadShopData();
  }, [params.id]);

  const loadShopData = async () => {
    try {
      const [shopRes, productsRes] = await Promise.all([
        shopApi.getOne(params.id),
        productApi.getByShop(params.id),
      ]);
      setShop(shopRes.data);
      setProducts(productsRes.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Shop Header */}
        <Card className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
          <p className="text-gray-600 mb-4">{shop.description}</p>
          <RatingDisplay value={shop.rating || 0} />
          <p className="text-sm text-gray-600 mt-2">{shop.address}</p>
        </Card>

        {/* Products */}
        <h2 className="text-2xl font-bold mb-4">Products & Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-lg"
                  onClick={() => router.push(`/products/${product.id}`)}>
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>
              <p className="text-2xl font-bold text-primary-600">₹{product.basePrice}</p>
              <Button className="w-full mt-4">View Details</Button>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
```

### 3. Order Management Pages

#### `/orders/page.tsx` - Order History
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderApi } from '@/lib/api';
import { Card, Badge, LoadingPage, EmptyState } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { format } from 'date-fns';

const statusColors = {
  created: 'default',
  confirmed: 'info',
  in_production: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderApi.getMyOrders();
      setOrders(response.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Start browsing tailors to place your first order"
            action={
              <Button onClick={() => router.push('/shops')}>Browse Tailors</Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-lg"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{order.shop?.name}</h3>
                    <p className="text-sm text-gray-600">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(order.createdAt), 'PPP')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[order.status]}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                    <p className="text-lg font-bold mt-2">₹{order.totalAmount}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
```

### 4. Tailor Dashboard Pages

#### `/tailor/orders/page.tsx` - Tailor Orders
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderApi, shopApi } from '@/lib/api';
import { Card, Badge, Button, Tabs, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';

export default function TailorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const shopsRes = await shopApi.getMyShops();
      setShops(shopsRes.data);
      if (shopsRes.data.length > 0) {
        setSelectedShop(shopsRes.data[0].id);
        const ordersRes = await orderApi.getShopOrders(shopsRes.data[0].id);
        setOrders(ordersRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await orderApi.updateStatus(orderId, 'confirmed');
      toast.success('Order accepted!');
      loadData();
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  if (loading) return <LoadingPage />;

  const pendingOrders = orders.filter(o => o.status === 'pending_confirmation');
  const activeOrders = orders.filter(o => ['confirmed', 'in_production'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Order Management</h1>

        <Tabs
          tabs={[
            { label: `Pending (${pendingOrders.length})`, value: 'pending' },
            { label: `Active (${activeOrders.length})`, value: 'active' },
            { label: 'Completed', value: 'completed' },
          ]}
        >
          {/* Render orders based on tab */}
        </Tabs>
      </div>
    </>
  );
}
```

## Next Steps

1. **Create each page file** in the appropriate directory
2. **Test each flow** individually
3. **Add proper error handling** with try-catch and toast messages
4. **Implement real-time updates** using WebSocket for orders
5. **Add form validation** using react-hook-form
6. **Create shopping cart** state using Zustand
7. **Implement chat interface** using Socket.IO client

## File Upload Component

```typescript
// Create this reusable component for image uploads
import { useDropzone } from 'react-dropzone';

export const FileUpload = ({ onUpload, maxFiles = 5 }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles,
    onDrop: async (acceptedFiles) => {
      // Handle file upload
      const formData = new FormData();
      acceptedFiles.forEach(file => formData.append('files', file));

      // Call upload API
      const response = await uploadApi.upload(formData);
      onUpload(response.data.urls);
    },
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500">
      <input {...getInputProps()} />
      <p>Drag & drop images here, or click to select</p>
    </div>
  );
};
```

## Testing Strategy

Each page should have:
- Component unit tests
- Integration tests with API mocking
- E2E tests for critical flows

## Completion Checklist

- [ ] All measurement pages
- [ ] All shop pages
- [ ] All order pages
- [ ] Tailor dashboard (shop, products, orders)
- [ ] Admin dashboard
- [ ] Profile & settings pages
- [ ] Chat interface
- [ ] File upload integration
- [ ] Form validation
- [ ] Error handling
- [ ] Loading states
- [ ] Real-time updates
- [ ] Tests for all pages

The pattern is consistent across all pages - use the UI components, call the API, handle loading/error states, and display data. Follow the examples above for each remaining page.
