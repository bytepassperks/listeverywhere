import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getGigDefinitions, getGigById, createGigOrder, getGigOrders,
  getGigOrder, getGigOrderDeliverables, fulfillGigOrder, getGigStats,
  updateOrderStatus, GigOrderInput,
} from '../services/gigsService';

export async function gigRoutes(app: FastifyInstance) {
  // ==========================================
  // GIG DEFINITIONS (public-ish, but auth required)
  // ==========================================

  app.get('/api/gigs', { preHandler: [app.authenticate] }, async () => {
    const gigs = getGigDefinitions();
    return { gigs };
  });

  app.get('/api/gigs/:gigId', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { gigId } = request.params as { gigId: string };
    const gig = getGigById(gigId);
    if (!gig) return reply.status(404).send({ error: 'Gig not found' });
    return { gig };
  });

  // ==========================================
  // GIG STATS
  // ==========================================

  app.get('/api/gigs/stats/overview', { preHandler: [app.authenticate] }, async (request: FastifyRequest) => {
    const userId = request.userId as string;
    const stats = await getGigStats(userId);
    return stats;
  });

  // ==========================================
  // GIG ORDERS
  // ==========================================

  app.get('/api/gigs/orders', { preHandler: [app.authenticate] }, async (request: FastifyRequest) => {
    const userId = request.userId as string;
    const { gig_id } = request.query as { gig_id?: string };
    const orders = await getGigOrders(userId, gig_id);
    return { orders };
  });

  app.get('/api/gigs/orders/:orderId', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId as string;
    const { orderId } = request.params as { orderId: string };
    try {
      const order = await getGigOrder(orderId, userId);
      const deliverables = await getGigOrderDeliverables(orderId);
      return { order, deliverables };
    } catch {
      return reply.status(404).send({ error: 'Order not found' });
    }
  });

  app.post('/api/gigs/orders', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId as string;
    const body = request.body as GigOrderInput;

    if (!body.gigId || !body.tier || !body.customerName || !body.customerEmail || !body.targetDomain) {
      return reply.status(400).send({ error: 'Missing required fields: gigId, tier, customerName, customerEmail, targetDomain' });
    }

    if (!['basic', 'standard', 'premium'].includes(body.tier)) {
      return reply.status(400).send({ error: 'Invalid tier. Must be basic, standard, or premium' });
    }

    const gig = getGigById(body.gigId);
    if (!gig) {
      return reply.status(400).send({ error: 'Invalid gig ID' });
    }

    try {
      const order = await createGigOrder(userId, body);
      return { order, message: 'Order created successfully' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create order';
      return reply.status(400).send({ error: msg });
    }
  });

  // ==========================================
  // FULFILLMENT — 1-Click Execute
  // ==========================================

  app.post('/api/gigs/orders/:orderId/fulfill', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId as string;
    const { orderId } = request.params as { orderId: string };

    try {
      const result = await fulfillGigOrder(orderId, userId);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fulfillment failed';
      return reply.status(500).send({ error: msg });
    }
  });

  // ==========================================
  // ORDER MANAGEMENT
  // ==========================================

  app.patch('/api/gigs/orders/:orderId/status', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId as string;
    const { orderId } = request.params as { orderId: string };
    const { status } = request.body as { status: string };

    if (!['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return reply.status(400).send({ error: 'Invalid status' });
    }

    try {
      await getGigOrder(orderId, userId);
      await updateOrderStatus(orderId, status);
      return { message: 'Status updated' };
    } catch {
      return reply.status(404).send({ error: 'Order not found' });
    }
  });

  // ==========================================
  // DELIVERABLES
  // ==========================================

  app.get('/api/gigs/orders/:orderId/deliverables', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userId as string;
    const { orderId } = request.params as { orderId: string };
    try {
      await getGigOrder(orderId, userId);
      const deliverables = await getGigOrderDeliverables(orderId);
      return { deliverables };
    } catch {
      return reply.status(404).send({ error: 'Order not found' });
    }
  });
}
