import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "./server.js";

test("idempotent payment returns replay on second request", async () => {
  const payload = {
    amount: 120,
    walletPart: 70,
    cardPart: 50,
    idempotencyKey: "test-idem-100",
    outOfPolicy: false,
  };

  const first = await request(app)
    .post("/api/payment")
    .set("X-Idempotency-Key", "test-idem-100")
    .send(payload);

  const second = await request(app)
    .post("/api/payment")
    .set("X-Idempotency-Key", "test-idem-100")
    .send(payload);

  assert.equal(first.status, 200);
  assert.equal(first.body.replay, false);
  assert.equal(second.status, 200);
  assert.equal(second.body.replay, true);
});

test("out-of-policy payment requires manager token", async () => {
  const denied = await request(app)
    .post("/api/payment")
    .send({
      amount: 100,
      walletPart: 20,
      cardPart: 80,
      idempotencyKey: "test-approval-1",
      outOfPolicy: true,
      approvalToken: "",
    });

  assert.equal(denied.status, 403);
});

test("search rejects malformed budget input", async () => {
  const response = await request(app)
    .post("/api/search")
    .send({
      prompt: "Find flights",
      search: {
        budget: -10,
      },
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "VALIDATION_ERROR");
  assert.ok(response.body.fields?.["search.budget"]);
});

test("booking lifecycle includes detail and refund request", async () => {
  const bookingId = `BK-${Date.now()}`;

  const created = await request(app)
    .post("/api/bookings")
    .send({
      id: bookingId,
      offerId: "OFFER-123",
      status: "CONFIRMED",
      total: 250,
      timeline: [],
    });

  assert.equal(created.status, 200);

  const detail = await request(app).get(`/api/bookings/${bookingId}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.id, bookingId);

  const refund = await request(app)
    .post(`/api/bookings/${bookingId}/refund-request`)
    .send({ reason: "customer_request" });

  assert.equal(refund.status, 200);
  assert.equal(refund.body.data.status, "REFUND_PROCESSING");

  const invalidTransition = await request(app)
    .patch(`/api/bookings/${bookingId}`)
    .send({ status: "CONFIRMED" });

  assert.equal(invalidTransition.status, 409);
  assert.equal(invalidTransition.body.code, "INVALID_BOOKING_STATE");
});

test("health reports readiness and counts", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.dataReady, true);
  assert.equal(typeof response.body.flightCount, "number");
  assert.equal(typeof response.body.bookingCount, "number");
  assert.equal(typeof response.body.eventCount, "number");
});

test("airport lookup returns known and missing codes", async () => {
  const response = await request(app).get("/api/airports?codes=DEL,NRT,ZZZ");

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.airports.DEL.code, "DEL");
  assert.equal(response.body.data.airports.NRT.code, "NRT");
  assert.deepEqual(response.body.data.missing, ["ZZZ"]);
});

test("route intelligence returns weather and alternates", async () => {
  const response = await request(app).get("/api/routes/intel?from=DEL&to=NRT");

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.from.code, "DEL");
  assert.equal(response.body.data.to.code, "NRT");
  assert.ok(Array.isArray(response.body.data.alternates));
  assert.ok(response.body.data.alternates.length >= 1);
  assert.equal(typeof response.body.data.delayRisk.score, "number");
});
