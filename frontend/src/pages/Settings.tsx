import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { authApi } from '@/api/auth';
import { ErrorList } from '@/components/ErrorList';
import { isApiError } from '@/api/client';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [image, setImage] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setImage(user.image ?? '');
    setUsername(user.username);
    setBio(user.bio ?? '');
    setEmail(user.email);
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors(null);
    setBusy(true);
    try {
      const payload: Parameters<typeof authApi.update>[0] = {};
      if (image !== (user?.image ?? '')) payload.image = image || null;
      if (username !== user?.username) payload.username = username;
      if (bio !== (user?.bio ?? '')) payload.bio = bio || null;
      if (email !== user?.email) payload.email = email;
      if (password) payload.password = password;
      if (Object.keys(payload).length === 0) return;
      const r = await authApi.update(payload);
      updateUser(r.user);
      navigate(`/profile/${r.user.username}`);
    } catch (e) {
      setErrors(isApiError(e) ? e.errors : { server: ['unknown error'] });
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    logout();
    navigate('/');
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-md px-md py-xl">
      <h1 className="mb-md text-center text-3xl">Your Settings</h1>
      <ErrorList errors={errors} />
      <form onSubmit={onSubmit} className="space-y-md">
        <input
          type="url"
          placeholder="URL of profile picture"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full rounded border border-muted px-md py-md"
        />
        <input
          type="text"
          placeholder="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full rounded border border-muted px-md py-md text-lg"
        />
        <textarea
          rows={8}
          placeholder="Short bio about you"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded border border-muted px-md py-md"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border border-muted px-md py-md text-lg"
        />
        <input
          type="password"
          placeholder="New Password (leave blank to keep)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded border border-muted px-md py-md text-lg"
        />
        <button
          type="submit"
          disabled={busy}
          className="ml-auto block rounded bg-primary px-lg py-md text-white shadow disabled:opacity-50"
        >
          {busy ? 'Updating…' : 'Update Settings'}
        </button>
      </form>
      <hr className="my-lg border-muted" />
      <button
        onClick={onLogout}
        className="rounded border border-danger px-md py-sm text-danger hover:bg-danger hover:text-white"
      >
        Or click here to logout.
      </button>
    </main>
  );
}
