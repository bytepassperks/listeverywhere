'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api, GigOrder, GigDeliverable, GigDefinition } from '@/lib/api';

export default function GigOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<GigOrder | null>(null);
  const [deliverables, setDeliverables] = useState<GigDeliverable[]>([]);
  const [gig, setGig] = useState<GigDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillSteps, setFulfillSteps] = useState<string[]>([]);
  const [previewDeliverable, setPreviewDeliverable] = useState<GigDeliverable | null>(null);

  useEffect(() => { loadData(); }, [orderId]);

  async function loadData() {
    try {
      const data = await api.getGigOrder(orderId);
      setOrder(data.order);
      setDeliverables(data.deliverables);
      try {
        const gigData = await api.getGig(data.order.gig_id);
        setGig(gigData.gig);
      } catch {
        // gig definition fetch is non-critical
      }
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFulfill() {
    if (!confirm('Start fulfillment? This will execute all automation steps.')) return;
    setFulfilling(true);
    setFulfillSteps([]);
    try {
      const result = await api.fulfillGigOrder(orderId);
      setFulfillSteps(result.steps);
      await loadData();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Fulfillment failed'}`);
    } finally {
      setFulfilling(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.updateGigOrderStatus(orderId, 'cancelled');
      await loadData();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  }

  function downloadDeliverable(d: GigDeliverable) {
    const blob = new Blob([d.content], {
      type: d.format === 'html' ? 'text/html' : d.format === 'csv' ? 'text/csv' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = d.title.replace(/[^a-zA-Z0-9.-]/g, '_') + (d.format === 'html' ? '.html' : d.format === 'csv' ? '.csv' : '.txt');
    a.click();
    URL.revokeObjectURL(url);
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
        <div style={{ color: 'var(--muted-foreground)' }}>Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <h2 style={{ color: 'var(--foreground)' }}>Order not found</h2>
        <button onClick={() => router.push('/dashboard/gigs')} style={{
          marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none',
          background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer',
        }}>
          Back to Gigs
        </button>
      </div>
    );
  }

  const tierConfig = gig?.tiers[order.tier as 'basic' | 'standard' | 'premium'];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/gigs')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
          color: 'var(--muted-foreground)', padding: 0,
        }}
      >
        &larr; Back to Gigs
      </button>

      {/* Order Header */}
      <div style={{
        background: 'var(--card)', borderRadius: 16, padding: 24, marginBottom: 20,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {gig && <span style={{ fontSize: 28 }}>{gig.icon}</span>}
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--foreground)' }}>
                {gig ? gig.shortTitle : order.gig_id}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: getTierColor(order.tier) + '20', color: getTierColor(order.tier),
                textTransform: 'uppercase',
              }}>
                {order.tier} — ${order.price}
              </span>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: getStatusColor(order.status) + '20', color: getStatusColor(order.status),
                textTransform: 'uppercase',
              }}>
                {order.status}
              </span>
              {order.fiverr_order_id && (
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: '#1dbf7320', color: '#1dbf73',
                }}>
                  Fiverr #{order.fiverr_order_id}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {order.status === 'pending' && (
              <>
                <button
                  onClick={handleFulfill}
                  disabled={fulfilling}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: '#28a745', color: '#fff', fontWeight: 700, fontSize: 14,
                    opacity: fulfilling ? 0.6 : 1,
                  }}
                >
                  {fulfilling ? 'Fulfilling...' : 'Fulfill Order'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: '1px solid #dc3545',
                    cursor: 'pointer', background: 'transparent', color: '#dc3545',
                    fontWeight: 600, fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              </>
            )}
            {order.status === 'failed' && (
              <button
                onClick={handleFulfill}
                disabled={fulfilling}
                style={{
                  padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#ffc107', color: '#000', fontWeight: 700, fontSize: 14,
                }}
              >
                Retry Fulfillment
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {(order.status === 'processing' || fulfilling) && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Progress</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{order.progress_pct}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${order.progress_pct}%`,
                background: 'linear-gradient(90deg, #007bff, #28a745)', borderRadius: 4,
                transition: 'width 0.5s',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Order Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Customer Info */}
        <div style={{
          background: 'var(--card)', borderRadius: 12, padding: 20,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>Customer</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Name: </span>
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{order.customer_name}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Email: </span>
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{order.customer_email}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Domain: </span>
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{order.target_domain}</span>
            </div>
            {order.target_url && (
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--muted-foreground)' }}>URL: </span>
                <a href={order.target_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  {order.target_url}
                </a>
              </div>
            )}
            {order.notes && (
              <div style={{ fontSize: 13, marginTop: 4 }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Notes: </span>
                <span style={{ color: 'var(--foreground)' }}>{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Package Info */}
        <div style={{
          background: 'var(--card)', borderRadius: 12, padding: 20,
          border: '1px solid var(--border)',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>Package</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Tier: </span>
              <span style={{ color: getTierColor(order.tier), fontWeight: 700, textTransform: 'uppercase' }}>{order.tier}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Price: </span>
              <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>${order.price}</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Delivery: </span>
              <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{order.delivery_days} days</span>
            </div>
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Created: </span>
              <span style={{ color: 'var(--foreground)' }}>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            {order.completed_at && (
              <div style={{ fontSize: 13 }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Completed: </span>
                <span style={{ color: '#28a745', fontWeight: 600 }}>{new Date(order.completed_at).toLocaleString()}</span>
              </div>
            )}
            {tierConfig && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>Features:</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                  {tierConfig.features.map((f, i) => (
                    <li key={i} style={{ color: 'var(--foreground)', padding: '1px 0' }}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fulfillment Steps */}
      {fulfillSteps.length > 0 && (
        <div style={{
          background: 'var(--card)', borderRadius: 12, padding: 20, marginBottom: 20,
          border: '2px solid #28a745',
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#28a745' }}>
            Fulfillment Steps
          </h3>
          <div style={{ background: 'var(--background)', borderRadius: 8, padding: 12 }}>
            {fulfillSteps.map((step, i) => (
              <div key={i} style={{
                fontSize: 13, color: 'var(--foreground)', padding: '4px 0',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ color: '#28a745', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div style={{
        background: 'var(--card)', borderRadius: 12, padding: 20,
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>
          Deliverables ({deliverables.length})
        </h3>
        {deliverables.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted-foreground)' }}>
            <p style={{ fontSize: 14 }}>No deliverables yet. Fulfill the order to generate reports and exports.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {deliverables.map(d => (
              <div key={d.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 8, background: 'var(--background)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>
                    {d.format === 'html' ? '📄' : d.format === 'csv' ? '📊' : d.type === 'disavow' ? '🛡' : '📝'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--foreground)' }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                      {d.format.toUpperCase()} | {new Date(d.created_at).toLocaleString()}
                      {d.content && ` | ${(d.content.length / 1024).toFixed(1)} KB`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {d.format === 'html' && (
                    <button
                      onClick={() => setPreviewDeliverable(d)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      Preview
                    </button>
                  )}
                  <button
                    onClick={() => downloadDeliverable(d)}
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: 'var(--primary)', color: 'var(--primary-foreground)',
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HTML Preview Modal */}
      {previewDeliverable && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '90%', maxWidth: 960,
            height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px', borderBottom: '1px solid #eee',
            }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a2e' }}>{previewDeliverable.title}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => downloadDeliverable(previewDeliverable)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none',
                    background: '#0f3460', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}
                >
                  Download
                </button>
                <button
                  onClick={() => setPreviewDeliverable(null)}
                  style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}
                >
                  &times;
                </button>
              </div>
            </div>
            <iframe
              srcDoc={previewDeliverable.content}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title="Deliverable Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}
    </div>
  );
}
