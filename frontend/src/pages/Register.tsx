import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ErrorList } from '@/components/ErrorList';
import { isApiError } from '@/api/client';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors(null);
    setBusy(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (e) {
      setErrors(isApiError(e) ? e.errors : { server: ['unknown error'] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-md py-xl">
      <h1 className="mb-md text-center text-3xl">Sign up</h1>
      <p className="mb-md text-center">
        <Link to="/login" className="text-info">
          Have an account?
        </Link>
      </p>
      <ErrorList errors={errors} />
      <form onSubmit={onSubmit} className="space-y-md">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          className="w-full rounded border border-muted px-md py-md text-lg"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded border border-muted px-md py-md text-lg"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full rounded border border-muted px-md py-md text-lg"
        />
        <button
          type="submit"
          disabled={busy}
          className="ml-auto block rounded bg-primary px-lg py-md text-white shadow disabled:opacity-50"
        >
          {busy ? 'Signing up…' : 'Sign up'}
        </button>
      </form>
    </main>
  );
}
