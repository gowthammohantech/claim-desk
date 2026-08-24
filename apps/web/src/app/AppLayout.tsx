import { NavLink, Outlet } from 'react-router';

import { NAV } from '@/lib/nav';
import { useSession } from '@/lib/session';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { can } = useSession();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-line bg-paper-raised px-4 py-6">
        <div className="mb-8 px-2">
          <p className="text-title font-extrabold tracking-[-0.02em] text-ink">ClaimDesk</p>
          <p className="text-caption text-ink-40">Finance &amp; Admin</p>
        </div>

        <nav className="space-y-6">
          {NAV.map((group) => {
            // Permission-gated: a Finance user never sees admin config, and an
            // auditor sees only what they may read.
            const visible = group.items.filter((item) => can(item.permission));
            if (visible.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="mb-2 px-2 text-caption font-semibold uppercase tracking-[0.07em] text-ink-40">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {visible.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/finance'}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-input px-3 py-2 text-body-s transition-colors',
                            isActive
                              ? 'bg-accent-tint font-semibold text-accent-deep'
                              : 'text-ink-70 hover:bg-paper-sunken',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
