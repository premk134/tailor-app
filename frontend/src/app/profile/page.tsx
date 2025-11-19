'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardHeader, CardBody, Button, Input, Badge, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(response.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  if (loading) return <LoadingPage message="Loading profile..." />;
  if (!user) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader
                  title="Personal Information"
                  actions={
                    !editing ? (
                      <Button size="sm" onClick={() => setEditing(true)}>
                        Edit
                      </Button>
                    ) : null
                  }
                />
                <CardBody>
                  {editing ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
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
                          placeholder="your@email.com"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Phone Number
                        </label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="10-digit phone number"
                          maxLength={10}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <Button type="submit" isLoading={submitting} disabled={submitting}>
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditing(false);
                            setFormData({
                              name: user.name || '',
                              email: user.email || '',
                              phone: user.phone || '',
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Name</div>
                        <div className="font-medium">{user.name || 'Not set'}</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Email</div>
                        <div className="font-medium">{user.email}</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Phone</div>
                        <div className="font-medium">{user.phone || 'Not set'}</div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 mb-1">Role</div>
                        <Badge variant="primary" className="capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Account Settings */}
              <Card>
                <CardHeader title="Account Settings" />
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-sm text-gray-600">
                          Receive updates about your orders
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium">SMS Notifications</div>
                        <div className="text-sm text-gray-600">
                          Get text messages about order status
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Links */}
              <Card>
                <CardHeader title="Quick Links" />
                <CardBody>
                  <div className="space-y-2">
                    {user.role === 'customer' && (
                      <>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => router.push('/measurements')}
                        >
                          My Measurements
                        </Button>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => router.push('/orders')}
                        >
                          My Orders
                        </Button>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => router.push('/shops')}
                        >
                          Browse Tailors
                        </Button>
                      </>
                    )}

                    {user.role === 'tailor' && (
                      <>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => router.push('/tailor/shop')}
                        >
                          My Shop
                        </Button>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => router.push('/tailor/products')}
                        >
                          My Products
                        </Button>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => router.push('/tailor/orders')}
                        >
                          Orders
                        </Button>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => router.push('/admin')}
                      >
                        Admin Dashboard
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Danger Zone */}
              <Card className="border-2 border-red-200">
                <CardHeader title="Danger Zone" />
                <CardBody>
                  <div className="space-y-3">
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          toast.error('Account deletion is not yet implemented');
                        }
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader title="Account Info" />
                <CardBody>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-600">Member since</div>
                      <div className="font-medium">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Account ID</div>
                      <div className="font-mono text-xs break-all">
                        {user.id.slice(0, 16)}...
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
