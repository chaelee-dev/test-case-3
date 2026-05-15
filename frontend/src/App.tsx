import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Editor from '@/pages/Editor';

function Home() {
  const { user } = useAuth();
  return (
    <main>
      <header className="bg-primary px-lg py-xl text-center text-white shadow">
        <h1 className="font-logo text-5xl drop-shadow">conduit</h1>
        <p className="text-lg">A place to share your knowledge.</p>
      </header>
      <section className="mx-auto max-w-container px-md py-lg">
        {user ? (
          <p>Welcome back, <strong>{user.username}</strong>. Feed and editor land in subsequent issues.</p>
        ) : (
          <p className="text-secondary">
            <Link to="/login" className="text-info">Sign in</Link> or{' '}
            <Link to="/register" className="text-info">create an account</Link> to get started.
          </p>
        )}
      </section>
    </main>
  );
}

function Stub({ name }: { name: string }) {
  return (
    <main className="mx-auto max-w-container px-md py-lg">
      <Link to="/" className="text-info">← Home</Link>
      <h2 className="mt-md text-2xl">{name} (placeholder)</h2>
      <p className="text-muted">Implemented in a later issue per WBS §2.</p>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:slug" element={<Editor />} />
        <Route path="/article/:slug" element={<Stub name="Article" />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
        <Route path="*" element={<Stub name="404" />} />
      </Routes>
    </AuthProvider>
  );
}
