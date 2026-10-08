import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { validateLogin } from '../schemas/login.schema';

export function LoginPage() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = { email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') };
    validateLogin(input);
  }

  return <form className="auth-form" onSubmit={handleSubmit}><h1>تسجيل الدخول</h1><Input name="email" type="email" placeholder="البريد الإلكتروني" required /><Input name="password" type="password" placeholder="كلمة المرور" required /><Button type="submit">تسجيل الدخول</Button></form>;
}
