'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productApi } from '@/lib/api';
import { Card, CardBody, Button, Badge, LoadingPage, EmptyState } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

export default function TailorProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productApi.getMyProducts();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      await productApi.update(productId, { isActive: !currentStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isActive: !currentStatus } : p))
      );
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update product status');
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      await productApi.delete(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) return <LoadingPage message="Loading products..." />;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Products</h1>
              <p className="text-gray-600">Manage your products and services</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => router.push('/tailor/shop')}>
                Back to Shop
              </Button>
              <Button onClick={() => router.push('/tailor/products/new')}>
                Add New Product
              </Button>
            </div>
          </div>

          {/* Products List */}
          {products.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              }
              title="No products yet"
              description="Add your first product to start receiving orders"
              action={
                <Button onClick={() => router.push('/tailor/products/new')}>
                  Add Product
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardBody>
                    {/* Product Image */}
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg -mt-4 -mx-4 mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg -mt-4 -mx-4 mb-4 flex items-center justify-center">
                        <svg
                          className="h-16 w-16 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg flex-1">{product.name}</h3>
                        <Badge variant={product.isActive ? 'success' : 'danger'} size="sm">
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm text-gray-500">Base Price</div>
                          <div className="text-xl font-bold text-primary-600">
                            ₹{product.basePrice}
                          </div>
                        </div>
                        {product.estimatedDays && (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Est. Days</div>
                            <div className="font-semibold">{product.estimatedDays}</div>
                          </div>
                        )}
                      </div>

                      {product.category && (
                        <Badge variant="primary" size="sm">
                          {product.category.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/tailor/products/${product.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={product.isActive ? 'danger' : 'primary'}
                        onClick={() => handleToggleActive(product.id, product.isActive)}
                      >
                        {product.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      fullWidth
                      onClick={() => handleDelete(product.id, product.name)}
                      className="mt-2 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
