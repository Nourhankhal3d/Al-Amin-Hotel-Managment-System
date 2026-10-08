export type LoginInput = {
  email: string;
  password: string;
};

export function validateLogin(input: LoginInput): string | null {
  if (!input.email || !input.password) return 'email and password are required';
  return null;
}
