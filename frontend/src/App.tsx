import { Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { Navbar } from '@/components/Navbar';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Editor from '@/pages/Editor';
import Article from '@/pages/Article';

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
        <Route path="/article/:slug" element={<Article />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
        <Route path="*" element={<Stub name="404" />} />
      </Routes>
    </AuthProvider>
  );
}
