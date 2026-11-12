import { http, HttpResponse } from 'msw';

const API = '/api/v1';

export const subManagerAuthHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    try {
      const cloned = request.clone();
      const body = (await cloned.json()) as { username?: string; password?: string };

      if (body.username === 'submanager') {
        return HttpResponse.json({
          access_token: 'mock-submanager-access-token',
          expires_in: 900,
          staff: {
            staff_id: 101,
            name: 'المدير الفرعي',
            // Provisionally 'sub_manager' (TODO: confirm with backend role enum)
            role: 'sub_manager',
            default_shift_type: null,
            email: 'manager@alaminhotel.com',
            phone: '+201000000000',
          },
          shift: null,
          read_only: false,
        });
      }
    } catch {
      // Fall through to next handler if JSON parse fails
    }

    return undefined;
  }),

  http.post(`${API}/auth/password-reset-requests`, async ({ request }) => {
    try {
      const cloned = request.clone();
      const body = (await cloned.json()) as { username?: string; employee_number?: string };

      if (!body.username?.trim()) {
        return HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Username is required' } },
          { status: 400 },
        );
      }

      return HttpResponse.json({
        data: {
          message: 'Password reset request submitted successfully',
          username: body.username,
        },
      });
    } catch {
      return HttpResponse.json({
        data: { message: 'Password reset request submitted successfully' },
      });
    }
  }),
];

