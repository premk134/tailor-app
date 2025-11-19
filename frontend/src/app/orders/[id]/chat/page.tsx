'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { orderApi } from '@/lib/api';
import { Card, CardHeader, CardBody, Button, Input, LoadingPage } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'tailor';
  message: string;
  createdAt: string;
  read: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function OrderChatPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    loadOrderAndMessages();
    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadOrderAndMessages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Decode token to get user ID (simplified - in production use proper JWT decode)
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub);

      const [orderRes, messagesRes] = await Promise.all([
        orderApi.getOne(params.id as string),
        orderApi.getMessages(params.id as string),
      ]);

      setOrder(orderRes.data);
      setMessages(messagesRes.data || []);
    } catch (error) {
      toast.error('Failed to load chat');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Connect to WebSocket server
    socketRef.current = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    // Join order room
    socketRef.current.emit('join-order-room', { orderId: params.id });

    // Listen for new messages
    socketRef.current.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicator
    socketRef.current.on('user-typing', (data: { userId: string; userName: string }) => {
      // Could show typing indicator here
      console.log(`${data.userName} is typing...`);
    });

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);

    try {
      const response = await orderApi.sendMessage(params.id as string, newMessage.trim());

      // Message will be added via WebSocket event
      // But add it immediately for better UX
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');

      // Emit via WebSocket as well
      if (socketRef.current) {
        socketRef.current.emit('send-message', {
          orderId: params.id,
          message: newMessage.trim(),
        });
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { orderId: params.id });
    }
  };

  if (loading) return <LoadingPage message="Loading chat..." />;
  if (!order) return null;

  const isCustomer = order.customerId === currentUserId;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/orders/${params.id}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Order
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Chat with {isCustomer ? order.shop?.name : order.customer?.name}
                </h1>
                <p className="text-gray-600 text-sm">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Container */}
          <Card className="flex flex-col" style={{ height: 'calc(100vh - 250px)' }}>
            {/* Messages */}
            <CardBody className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <svg className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm">Start a conversation about your order</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isMine = message.senderId === currentUserId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                          {!isMine && (
                            <div className="text-xs text-gray-600 mb-1 px-3">
                              {message.senderName}
                            </div>
                          )}
                          <div
                            className={`
                              rounded-2xl px-4 py-2 shadow-sm
                              ${isMine
                                ? 'bg-primary-600 text-white rounded-br-none'
                                : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                              }
                            `}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message}
                            </p>
                          </div>
                          <div
                            className={`
                              text-xs text-gray-500 mt-1 px-3
                              ${isMine ? 'text-right' : 'text-left'}
                            `}
                          >
                            {format(new Date(message.createdAt), 'p')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardBody>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type your message..."
                    className="
                      w-full px-4 py-2 border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      resize-none
                    "
                    rows={2}
                    disabled={sending}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  isLoading={sending}
                  className="mb-6"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </form>
            </div>
          </Card>

          {/* Order Quick Info */}
          <Card className="mt-4">
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium capitalize">{order.status?.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-gray-500">Total</div>
                  <div className="font-medium text-primary-600">₹{order.totalAmount}</div>
                </div>
                <div>
                  <div className="text-gray-500">Items</div>
                  <div className="font-medium">{order.items?.length || 0}</div>
                </div>
                <div>
                  <div className="text-gray-500">Date</div>
                  <div className="font-medium">
                    {format(new Date(order.createdAt), 'PP')}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
