'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import styles from './Sidebar.module.css';

const navIcons: Record<string, string> = {
  Dashboard: '📊',
  'Resume Builder': '📝',
  'Study Path': '📚',
  'Practice Q&A': '💬',
  'Mock Interview': '🎙️',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Resume Builder', path: '/resume' },
    { name: 'Study Path', path: '/study-path' },
    { name: 'Practice Q&A', path: '/qa-generator' },
    { name: 'Mock Interview', path: '/mock-interview' },
  ];

  const handleSignOut = () => {
    logout();
    router.push('/auth/login');
  };

  // Hide sidebar on auth pages
  if (pathname?.startsWith('/auth')) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>CA</div>
        <div>
          <h1 className={styles.logoText}>Cognitive Architect</h1>
          <p className={styles.logoSubtext}>INTERVIEW SUITE</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>{navIcons[item.name]}</span>
              <span>{item.name}</span>
              {isActive && <div className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        {isAuthenticated && user && (
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div className={styles.userName}>
              <span className={styles.userNameText}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
        )}
        <div className={styles.footerLinks}>
          <button className={styles.footerLink}>
            <span>❓</span> Support
          </button>
          {isAuthenticated ? (
            <button className={styles.footerLink} onClick={handleSignOut}>
              <span>🚪</span> Sign Out
            </button>
          ) : (
            <Link href="/auth/login" className={styles.footerLink}>
              <span>🔑</span> Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
