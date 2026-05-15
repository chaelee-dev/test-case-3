import { Routes, Route, Link } from 'react-router-dom';

function Home() {
  return (
    <main className="mx-auto max-w-container px-md py-lg">
      <header className="mb-lg rounded bg-primary px-lg py-xl text-center text-white shadow">
        <h1 className="font-logo text-5xl drop-shadow">conduit</h1>
        <p className="text-lg">A place to share your knowledge.</p>
      </header>
      <p className="text-secondary">
        Scaffold ready. Routes are stubs until subsequent issues land them.
      </p>
      <nav className="mt-md flex gap-md text-info">
        <Link to="/login">Sign in</Link>
        <Link to="/register">Sign up</Link>
      </nav>
    </main>
  );
}

function Stub({ name }: { name: string }) {
  return (
    <main className="mx-auto max-w-container px-md py-lg">
      <Link to="/" className="text-info">
        ← Home
      </Link>
      <h2 className="mt-md text-2xl">{name} (placeholder)</h2>
      <p className="text-muted">Implemented in a later issue per WBS §2.</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Stub name="Sign in" />} />
      <Route path="/register" element={<Stub name="Sign up" />} />
      <Route path="/settings" element={<Stub name="Settings" />} />
      <Route path="/editor" element={<Stub name="Editor" />} />
      <Route path="/editor/:slug" element={<Stub name="Editor (edit)" />} />
      <Route path="/article/:slug" element={<Stub name="Article" />} />
      <Route path="/profile/:username" element={<Stub name="Profile" />} />
      <Route path="/profile/:username/favorites" element={<Stub name="Profile favorites" />} />
      <Route path="*" element={<Stub name="404" />} />
    </Routes>
  );
}
