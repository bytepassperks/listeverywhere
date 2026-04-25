'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, GigDefinition, GigOrder, GigStatsOverview } from '@/lib/api';

type ActiveTab = 'gigs' | 'orders';
type SelectedTier = 'basic' | 'standard' | 'premium';

export default function GigsPage() {
  const router = useRouter();
  const [gigs, setGigs] = useState<GigDefinition[]>([]);
  const [orders, setOrders] = useState<GigOrder[]>([]);
  const [stats, setStats] = useState<GigStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('gigs');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedGig, setSelectedGig] = useState<GigDefinition | null>(null);
  const [selectedTier, setSelectedTier] = useState<SelectedTier>('basic');
  const [formData, setFormData] = useState({
    customerName: '', customerEmail: '', targetDomain: '',
    targetUrl: '', notes: '', fiverrOrderId: '',
  });
  const [creating, setCreating] = useState(false);
  const [fulfilling, setFulfilling] = useState<string | null>(null);
  const [fulfillResult, setFulfillResult] = useState<{ orderId: string; message: string; steps: string[] } | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [gigsData, ordersData, statsData] = await Promise.all([
        api.getGigs(),
        api.getGigOrders(),
        api.getGigStats(),
      ]);
      setGigs(gigsData.gigs);
      setOrders(ordersData.orders);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load gigs data:', err);
    } finally {
      setLoading(false);
    }
  }

  function openOrderForm(gig: GigDefinition, tier: SelectedTier) {
    setSelectedGig(gig);
    setSelectedTier(tier);
    setShowOrderForm(true);
    setFormData({ customerName: '', customerEmail: '', targetDomain: '', targetUrl: '', notes: '', fiverrOrderId: '' });
  }

  async function handleCreateOrder() {
    if (!selectedGig || !formData.customerName || !formData.customerEmail || !formData.targetDomain) return;
    setCreating(true);
    try {
      await api.createGigOrder({
        gigId: selectedGig.id,
        tier: selectedTier,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        targetDomain: formData.targetDomain,
        targetUrl: formData.targetUrl || undefined,
        notes: formData.notes || undefined,
        fiverrOrderId: formData.fiverrOrderId || undefined,
      });
      setShowOrderForm(false);
      await loadData();
      setActiveTab('orders');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to create order'}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleFulfill(orderId: string) {
    if (!confirm('Start fulfillment? This will execute all automation steps for this order.')) return;
    setFulfilling(orderId);
    setFulfillResult(null);
    try {
      const result = await api.fulfillGigOrder(orderId);
      setFulfillResult({ orderId, ...result });
      await loadData();
    } catch (err) {
      alert(`Fulfillment error: ${err instanceof Error ? err.message : 'Failed'}`);
    } finally {
      setFulfilling(null);
    }
  }

  function getGigTitle(gigId: string): string {
    const gig = gigs.find(g => g.id === gigId);
    return gig ? gig.shortTitle : gigId;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#28a745';
      case 'processing': return '#007bff';
      case 'pending': return '#ffc107';
      case 'failed': return '#dc3545';
      case 'cancelled': return '#6c757d';
      default: return '#6c757d';
    }
  }

  function getTierColor(tier: string): string {
    switch (tier) {
      case 'basic': return '#28a745';
      case 'standard': return '#007bff';
      case 'premium': return '#9333ea';
      default: return '#6c757d';
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--muted-foreground)' }}>Loading Gigs...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            Fiverr Gig Fulfillment
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
            Manage all 8 gigs. Create orders and fulfill with 1-2 clicks. Auto-generate deliverables.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Orders', value: stats.totalOrders, color: 'var(--foreground)' },
            { label: 'Completed', value: stats.completed, color: '#28a745' },
            { label: 'Processing', value: stats.processing, color: '#007bff' },
            { label: 'Pending', value: stats.pending, color: '#ffc107' },
            { label: 'Failed', value: stats.failed, color: '#dc3545' },
            { label: 'Revenue', value: `$${stats.totalRevenue}`, color: '#9333ea' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--card)', borderRadius: 12, padding: 16, textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
        {(['gigs', 'orders'] as ActiveTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              borderRadius: '8px 8px 0 0', transition: 'all 0.2s',
            }}
          >
            {tab === 'gigs' ? `All Gigs (${gigs.length})` : `Orders (${orders.length})`}
          </button>
        ))}
      </div>

      {/* Gigs Tab */}
      {activeTab === 'gigs' && (
        <div style={{ display: 'grid', gap: 24 }}>
          {gigs.map(gig => (
            <div key={gig.id} style={{
              background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)',
              overflow: 'hidden',
            }}>
              {/* Gig Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{gig.icon}</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>{gig.shortTitle}</h2>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted-foreground)' }}>{gig.description}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: gig.status === 'active' ? '#d4edda' : '#fff3cd',
                    color: gig.status === 'active' ? '#155724' : '#856404',
                  }}>
                    {gig.status === 'active' ? 'LIVE' : 'COMING SOON'}
                  </span>
                  {gig.fiverrUrl && (
                    <a href={gig.fiverrUrl} target="_blank" rel="noopener noreferrer" style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: '#1dbf73', color: '#fff', textDecoration: 'none',
                    }}>
                      Fiverr
                    </a>
                  )}
                </div>
              </div>

              {/* Tier Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
                {(['basic', 'standard', 'premium'] as SelectedTier[]).map((tierKey, idx) => {
                  const tier = gig.tiers[tierKey];
                  const isPopular = tierKey === 'standard';
                  return (
                    <div key={tierKey} style={{
                      padding: '20px 20px 16px', position: 'relative',
                      borderRight: idx < 2 ? '1px solid var(--border)' : 'none',
                      background: isPopular ? 'rgba(0, 123, 255, 0.03)' : 'transparent',
                    }}>
                      {isPopular && (
                        <div style={{
                          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                          background: '#007bff', color: '#fff', fontSize: 10, fontWeight: 700,
                          padding: '2px 12px', borderRadius: '0 0 8px 8px', textTransform: 'uppercase',
                        }}>
                          Most Popular
                        </div>
                      )}
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          color: getTierColor(tierKey), marginBottom: 4,
                        }}>
                          {tier.label}
                        </div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--foreground)' }}>
                          ${tier.price}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                          {tier.deliveryDays}-day delivery
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12, minHeight: 36 }}>
                        {tier.description}
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', fontSize: 12 }}>
                        {tier.features.map((f, i) => (
                          <li key={i} style={{ padding: '3px 0', color: 'var(--foreground)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ color: getTierColor(tierKey), fontSize: 14, lineHeight: '16px' }}>+</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => openOrderForm(gig, tierKey)}
                        style={{
                          width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                          cursor: 'pointer', fontSize: 13, fontWeight: 700,
                          background: getTierColor(tierKey), color: '#fff',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        Create Order — ${tier.price}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60, color: 'var(--muted-foreground)',
              background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💼</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>No orders yet</p>
              <p style={{ fontSize: 13 }}>Create an order from the Gigs tab to get started.</p>
              <button
                onClick={() => setActiveTab('gigs')}
                style={{
                  marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none',
                  background: 'var(--primary)', color: 'var(--primary-foreground)',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                View Gigs
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => (
                <div key={order.id} style={{
                  background: 'var(--card)', borderRadius: 12, padding: 20,
                  border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--foreground)' }}>
                        {getGigTitle(order.gig_id)}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                        background: getTierColor(order.tier) + '20',
                        color: getTierColor(order.tier),
                        textTransform: 'uppercase',
                      }}>
                        {order.tier}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                        background: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status),
                        textTransform: 'uppercase',
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                      {order.customer_name} ({order.customer_email}) — {order.target_domain}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      ${order.price} | Created {new Date(order.created_at).toLocaleDateString()}
                      {order.fiverr_order_id && ` | Fiverr #${order.fiverr_order_id}`}
                    </div>
                    {/* Progress bar */}
                    {order.status === 'processing' && (
                      <div style={{ marginTop: 8, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${order.progress_pct}%`,
                          background: '#007bff', borderRadius: 3, transition: 'width 0.5s',
                        }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleFulfill(order.id)}
                        disabled={fulfilling === order.id}
                        style={{
                          padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#28a745', color: '#fff', fontWeight: 700, fontSize: 13,
                          opacity: fulfilling === order.id ? 0.6 : 1,
                        }}
                      >
                        {fulfilling === order.id ? 'Fulfilling...' : 'Fulfill Now'}
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/gigs/orders/${order.id}`)}
                      style={{
                        padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                        cursor: 'pointer', background: 'var(--card)', color: 'var(--foreground)',
                        fontWeight: 600, fontSize: 13,
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fulfillment Result */}
          {fulfillResult && (
            <div style={{
              marginTop: 20, background: 'var(--card)', borderRadius: 12, padding: 20,
              border: '2px solid #28a745',
            }}>
              <h3 style={{ margin: '0 0 12px', color: '#28a745', fontSize: 16 }}>
                Fulfillment Complete
              </h3>
              <p style={{ margin: '0 0 8px', color: 'var(--foreground)', fontWeight: 600 }}>{fulfillResult.message}</p>
              <div style={{ background: 'var(--background)', borderRadius: 8, padding: 12 }}>
                {fulfillResult.steps.map((step, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--muted-foreground)', padding: '3px 0', display: 'flex', gap: 8 }}>
                    <span style={{ color: '#28a745', fontWeight: 700 }}>Step {i + 1}:</span>
                    {step}
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push(`/dashboard/gigs/orders/${fulfillResult.orderId}`)}
                style={{
                  marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--primary)', color: 'var(--primary-foreground)',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13,
                }}
              >
                View Order & Deliverables
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Creation Modal */}
      {showOrderForm && selectedGig && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 32, maxWidth: 520,
            width: '90%', maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: 'var(--foreground)' }}>New Order</h2>
              <button onClick={() => setShowOrderForm(false)} style={{
                background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--muted-foreground)',
              }}>
                &times;
              </button>
            </div>

            {/* Gig + Tier summary */}
            <div style={{
              background: 'var(--background)', borderRadius: 12, padding: 16, marginBottom: 20,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 24 }}>{selectedGig.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{selectedGig.shortTitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {selectedGig.tiers[selectedTier].label} — ${selectedGig.tiers[selectedTier].price} — {selectedGig.tiers[selectedTier].deliveryDays} days
                  </div>
                </div>
              </div>

              {/* Tier selector */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {(['basic', 'standard', 'premium'] as SelectedTier[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTier(t)}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 6, border: '2px solid',
                      borderColor: selectedTier === t ? getTierColor(t) : 'var(--border)',
                      background: selectedTier === t ? getTierColor(t) + '15' : 'transparent',
                      color: selectedTier === t ? getTierColor(t) : 'var(--muted-foreground)',
                      cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                    }}
                  >
                    {t} — ${selectedGig.tiers[t].price}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'customerName', label: 'Customer Name *', placeholder: 'John Doe', type: 'text' },
                { key: 'customerEmail', label: 'Customer Email *', placeholder: 'john@example.com', type: 'email' },
                { key: 'targetDomain', label: 'Target Domain *', placeholder: 'example.com', type: 'text' },
                { key: 'targetUrl', label: 'Target URL (optional)', placeholder: 'https://example.com/page', type: 'text' },
                { key: 'fiverrOrderId', label: 'Fiverr Order ID (optional)', placeholder: 'FO123456789', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4, display: 'block' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: '1px solid var(--border)', background: 'var(--background)',
                      color: 'var(--foreground)', fontSize: 14, boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4, display: 'block' }}>
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special instructions..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--background)',
                    color: 'var(--foreground)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => setShowOrderForm(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
                  fontWeight: 600, fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={creating || !formData.customerName || !formData.customerEmail || !formData.targetDomain}
                style={{
                  flex: 2, padding: '12px 0', borderRadius: 8, border: 'none',
                  background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14,
                  opacity: creating || !formData.customerName || !formData.customerEmail || !formData.targetDomain ? 0.5 : 1,
                }}
              >
                {creating ? 'Creating...' : `Create Order — $${selectedGig.tiers[selectedTier].price}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
