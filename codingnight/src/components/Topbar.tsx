'use client';
import { usePathname } from 'next/navigation';
import styles from './Topbar.module.css';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/resume': 'Resume Builder',
  '/study-path': 'Study Path',
  '/qa-generator': 'Practice Q&A',
  '/mock-interview': 'Mock Interview',
};

export default function Topbar() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname?.startsWith('/auth')) return null;

  const currentTitle = Object.entries(pageTitles).find(([path]) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  })?.[1] || 'AIPS';

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h2 className={styles.breadcrumb}>
          <span className={styles.brand}>AIPS Architect</span>
          <span className={styles.sep}>/</span>
          <span className={styles.current}>{currentTitle}</span>
        </h2>
      </div>
      
      <div className={styles.center}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="text" placeholder="Search resources..." className={styles.searchInput} />
        </div>
      </div>
      
      <div className={styles.right}>
        <button className={styles.iconBtn} title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
        </button>
        <button className={styles.iconBtn} title="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
