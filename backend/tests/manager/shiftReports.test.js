// Tests for Manager Feature M9: Shift Reports

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { ShiftReport, AuditLog } = require('../../src/db/models');
const { makeToken } = require('../helpers/managerAuth');

jest.setTimeout(60000);

describe('Manager Feature M9: Shift Reports', () => {
  const BASE = '/api/v1/manager/shift-reports';
  const auth = (token) => ({ Authorization: `Bearer ${token}` });
  const newId = () => new mongoose.Types.ObjectId();

  let mgr;
  let mgrToken;

  beforeEach(async () => {
    const m = await makeToken('manager');
    mgr = m.staff;
    mgrToken = m.token;
  });

  // Money is in EGP (this is how the code stores and returns it)
  const makeReport = (overrides = {}) =>
    ShiftReport.create({
      shift_id: newId(),
      shift_date: '2030-01-01',
      shift_type: 'morning',
      staff_id: newId(),
      staff_name: 'Ahmed Hassan',
      handled_rooms: 14,
      tasks_cleaning: 8,
      maintenance_requests: 1,
      pending_items: 2,
      cash_total: 4200,
      instapay_total: 3500,
      vodafone_cash_total: 1550,
      gross_revenue: 9250,
      refunds_total: 700,
      cancellation_retained_total: 300,
      net_revenue: 8550,
      review_status: 'PENDING_REVIEW',
      ...overrides,
    });

  describe('access control', () => {
    it('rejects a request without a token (401)', async () => {
      const res = await request(app).get(BASE);
      expect(res.status).toBe(401);
    });

    it('rejects a receptionist token (403)', async () => {
      const { token } = await makeToken('receptionist');
      const res = await request(app).get(BASE).set(auth(token));
      expect(res.status).toBe(403);
    });
  });

  describe('list', () => {
    it('returns the list item fields', async () => {
      const report = await makeReport({ shift_date: '2030-02-01' });
      const res = await request(app)
        .get(`${BASE}?business_date=2030-02-01`)
        .set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        report_id: String(report._id),
        shift_id: String(report.shift_id),
        business_date: '2030-02-01',
        shift_type: 'morning',
        staff_name: 'Ahmed Hassan',
        review_status: 'PENDING_REVIEW',
        gross_revenue: 9250,
        refunds_total: 700,
        net_revenue: 8550,
      });
      expect(res.body.data[0].created_at).toBeDefined();
    });

    it('returns meta with total_pages', async () => {
      await makeReport({ shift_date: '2030-03-01' });
      await makeReport({ shift_date: '2030-03-01' });
      await makeReport({ shift_date: '2030-03-01' });
      const res = await request(app)
        .get(`${BASE}?business_date=2030-03-01&limit=2`)
        .set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, total_pages: 2 });
    });

    it('filters by review_status', async () => {
      await makeReport({ shift_date: '2030-04-01', review_status: 'APPROVED' });
      await makeReport({ shift_date: '2030-04-01', review_status: 'PENDING_REVIEW' });
      const res = await request(app)
        .get(`${BASE}?business_date=2030-04-01&review_status=APPROVED`)
        .set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].review_status).toBe('APPROVED');
    });

    it('filters by shift_id', async () => {
      const report = await makeReport({ shift_date: '2030-05-01' });
      await makeReport({ shift_date: '2030-05-01' });
      const res = await request(app)
        .get(`${BASE}?shift_id=${report.shift_id}`)
        .set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].report_id).toBe(String(report._id));
    });

    it('rejects an invalid review_status with VALIDATION_ERROR (400)', async () => {
      const res = await request(app)
        .get(`${BASE}?review_status=WRONG`)
        .set(auth(mgrToken));
      expect(res.status).toBe(400);
      expect(res.text).toContain('VALIDATION_ERROR');
    });
  });

  describe('details', () => {
    it('returns the report detail in the guide shape', async () => {
      const report = await makeReport({ shift_date: '2030-06-01' });
      const res = await request(app).get(`${BASE}/${report._id}`).set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        report_id: String(report._id),
        business_date: '2030-06-01',
        rooms_handled: 14,
        cleaning_tasks: 8,
        maintenance_requests: 1,
        pending_items: 2,
        cash_total: 4200,
        instapay_total: 3500,
        vodafone_cash_total: 1550,
        gross_revenue: 9250,
        refunds_total: 700,
        cancellation_retained_total: 300,
        net_revenue: 8550,
        review_status: 'PENDING_REVIEW',
        pdf_url: `/api/v1/manager/shift-reports/${report._id}/pdf`,
      });
      expect(res.body.data.pdf).toBeUndefined();
      expect(res.body.data.pdf_data).toBeUndefined();
    });

    it('returns 404 for an unknown or invalid id', async () => {
      const a = await request(app).get(`${BASE}/${newId()}`).set(auth(mgrToken));
      expect(a.status).toBe(404);
      const b = await request(app).get(`${BASE}/not-an-id`).set(auth(mgrToken));
      expect(b.status).toBe(404);
    });
  });

  describe('review', () => {
    const review = (id, body, token = mgrToken) =>
      request(app).patch(`${BASE}/${id}/review`).set(auth(token)).send(body);

    it('requires a comment with NEEDS_REVIEW (400)', async () => {
      const report = await makeReport();
      const res = await review(report._id, { review_status: 'NEEDS_REVIEW' });
      expect(res.status).toBe(400);
      expect(res.text).toContain('VALIDATION_ERROR');
    });

    it('marks a report NEEDS_REVIEW and records the reviewer', async () => {
      const report = await makeReport();
      const res = await review(report._id, {
        review_status: 'NEEDS_REVIEW',
        manager_comment: 'Cash does not match',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.review_status).toBe('NEEDS_REVIEW');
      expect(String(res.body.data.reviewed_by_staff_id)).toBe(String(mgr._id));
      expect(res.body.data.manager_comment).toBe('Cash does not match');
    });

    it('approves a pending report, and APPROVED is final (422)', async () => {
      const report = await makeReport();
      const ok = await review(report._id, { review_status: 'APPROVED' });
      expect(ok.status).toBe(200);
      expect(ok.body.data.review_status).toBe('APPROVED');

      const again = await review(report._id, {
        review_status: 'NEEDS_REVIEW',
        manager_comment: 'Changed my mind',
      });
      expect(again.status).toBe(422);
      expect(again.text).toContain('INVALID_STATUS_TRANSITION');
    });

    it('allows NEEDS_REVIEW then APPROVED', async () => {
      const report = await makeReport();
      await review(report._id, { review_status: 'NEEDS_REVIEW', manager_comment: 'Check cash' });
      const res = await review(report._id, { review_status: 'APPROVED' });
      expect(res.status).toBe(200);
      expect(res.body.data.review_status).toBe('APPROVED');
    });

    it('writes an audit record REVIEWED_SHIFT_REPORT', async () => {
      const report = await makeReport();
      await review(report._id, { review_status: 'APPROVED' });
      const log = await AuditLog.findOne({
        action: 'REVIEWED_SHIFT_REPORT',
        entity_id: String(report._id),
      }).lean();
      expect(log).not.toBeNull();
    });

    it('returns 404 for an unknown report', async () => {
      const res = await review(newId(), { review_status: 'APPROVED' });
      expect(res.status).toBe(404);
    });

    it('rejects a receptionist token (403)', async () => {
      const report = await makeReport();
      const { token } = await makeToken('receptionist');
      const res = await review(report._id, { review_status: 'APPROVED' }, token);
      expect(res.status).toBe(403);
    });
  });

  describe('pdf', () => {
    it('serves a PDF inline even when none is stored yet', async () => {
      const report = await makeReport({ shift_date: '2030-07-01' });
      const res = await request(app).get(`${BASE}/${report._id}/pdf`).set(auth(mgrToken));
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.headers['content-disposition']).toContain('inline');
    });
  });
});