import { NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

function navClass({ isActive }: { isActive: boolean }) {
  return `transition-colors ${isActive ? 'text-primary' : 'text-secondary hover:text-primary'}`;
}

export function Navbar() {
  const { user, loading } = useAuth();
  return (
    <header className="border-b border-muted bg-white">
      <nav className="mx-auto flex max-w-container items-center justify-between px-md py-md">
        <NavLink to="/" className="font-logo text-2xl text-primary">
          conduit
        </NavLink>
        <ul className="flex items-center gap-md text-sm">
          <li>
            <NavLink to="/" className={navClass} end>
              Home
            </NavLink>
          </li>
          {loading ? null : user ? (
            <>
              <li>
                <NavLink to="/editor" className={navClass}>
                  <span aria-hidden="true">＋ </span>New Article
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={navClass}>
                  Settings
                </NavLink>
              </li>
              <li>
                <NavLink to={`/profile/${user.username}`} className={navClass}>
                  {user.image ? (
                    <img src={user.image} alt="" className="mr-xs inline h-6 w-6 rounded-full" />
                  ) : null}
                  {user.username}
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={navClass}>
                  Sign in
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={navClass}>
                  Sign up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
