import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Navigate, NavLink, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const queryClient = new QueryClient();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1), rememberMe: z.boolean().optional() });
const registerSchema = loginSchema.extend({ name: z.string().min(1) });
type AuthForm = z.infer<typeof registerSchema>;
type Theme = 'dark' | 'light';

type NavItem = { label: string; path: string; icon: string; description: string };
const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '⌘', description: 'Command center' },
  { label: 'Strategy Builder', path: '/strategy-builder', icon: '▧', description: 'Create systematic ideas' },
  { label: 'Strategy Library', path: '/strategy-library', icon: '◫', description: 'Reusable playbooks' },
  { label: 'Backtests', path: '/backtests', icon: '↗', description: 'Historical validation' },
  { label: 'Replay', path: '/replay', icon: '▶', description: 'Market session replay' },
  { label: 'Market Data', path: '/market-data', icon: '◈', description: 'Symbols and feeds' },
  { label: 'Trading Journal', path: '/trading-journal', icon: '✎', description: 'Trade notes' },
  { label: 'AI Assistant', path: '/ai-assistant', icon: '✦', description: 'Research companion' },
  { label: 'Reports', path: '/reports', icon: '▤', description: 'Portfolio reporting' },
  { label: 'Settings', path: '/settings', icon: '⚙', description: 'Preferences' },
  { label: 'Help', path: '/help', icon: '?', description: 'Docs and support' },
];

const dashboardMetrics = [
  ['Total Strategies', '24', '+12% this month'],
  ['Total Backtests', '1,284', '+86 this week'],
  ['Win Rate', '61.8%', '+4.2 pts'],
  ['Net Profit', '$48,920', '+18.5%'],
  ['Profit Factor', '1.92', 'Healthy'],
  ['Active Projects', '7', '3 shared'],
];
const recentStrategies = ['Opening Range Breakout', 'SPY Mean Reversion', 'Momentum Rotation'];
const recentBacktests = ['NQ 15m Breakout · 2020-2026', 'BTC Trend Follow · Walk-forward', 'ES VWAP Pullback · Q2'];
const activity = ['A backtest completed for Opening Range Breakout', 'Profit factor improved on SPY Mean Reversion', 'Journal template updated for earnings plays'];
const notificationsSeed = ['Backtest run finished', 'Weekly report is ready', 'Workspace invite accepted'];

function token() { return localStorage.getItem('accessToken'); }
async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api${path}`, { ...options, headers: { 'content-type': 'application/json', ...(token() ? { authorization: `Bearer ${token()}` } : {}), ...options.headers } });
  if (!res.ok) throw new Error((await res.json()).message ?? 'Request failed');
  return res.json();
}
function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initial;
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
}
function Protected({ children }: { children: React.ReactNode }) { return token() ? children : <Navigate to="/login" />; }

function Button({ children, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button {...props} className={`btn ${variant} ${props.className ?? ''}`}>{children}</button>;
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="empty"><div className="empty-icon">◇</div><h3>{title}</h3><p>{description}</p><Button variant="secondary">Create from template</Button></div>; }
function SearchInput({ onFocus }: { onFocus?: () => void }) { return <button className="search-input" onClick={onFocus}><span>⌕</span><span>Search strategies, reports, journal, backtests…</span><kbd>⌘K</kbd></button>; }
function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) { return open ? <div className="overlay" role="dialog" aria-modal="true"><div className="modal"><div className="row"><h2>{title}</h2><Button variant="ghost" onClick={onClose}>Close</Button></div>{children}</div></div> : null; }
function Drawer({ open, children, onClose }: { open: boolean; children: React.ReactNode; onClose: () => void }) { return open ? <div className="overlay drawer-wrap" role="dialog" aria-modal="true"><aside className="drawer"><Button variant="ghost" onClick={onClose}>Close</Button>{children}</aside></div> : null; }
function Dropdown({ label, children }: { label: React.ReactNode; children: React.ReactNode }) { const [open, setOpen] = useState(false); return <div className="dropdown"><button onClick={() => setOpen(!open)}>{label}</button>{open && <div className="dropdown-menu">{children}</div>}</div>; }
function Tabs() { const [tab, setTab] = useState('Profile'); return <div><div className="tabs">{['Profile', 'Appearance', 'Notifications', 'Language'].map((item) => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</div><Card><h3>{tab}</h3><p>Manage {tab.toLowerCase()} preferences for this workspace.</p></Card></div>; }
function DataTable() { return <table className="table"><thead><tr><th>Name</th><th>Status</th><th>Updated</th></tr></thead><tbody>{recentBacktests.map((item) => <tr key={item}><td>{item}</td><td>Ready</td><td>Today</td></tr>)}</tbody></table>; }
function Toast({ message }: { message: string }) { return <div className="toast">{message}</div>; }
function LoadingSpinner() { return <span className="spinner" aria-label="Loading" />; }
function ConfirmationDialog() { const [open, setOpen] = useState(false); return <><Button variant="secondary" onClick={() => setOpen(true)}>Reset layout</Button><Modal open={open} title="Reset dashboard layout?" onClose={() => setOpen(false)}><p>This restores the default application shell preferences.</p><Button onClick={() => setOpen(false)}>Confirm reset</Button></Modal></>; }

function Sidebar({ mobile = false, close }: { mobile?: boolean; close?: () => void }) {
  return <nav className={mobile ? 'side mobile-side' : 'side'} aria-label="Primary"><Link className="brand" to="/dashboard"><span>BT</span><b>BackTest AI</b></Link>{navItems.map((item) => <NavLink onClick={close} key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><span>{item.icon}</span><div><b>{item.label}</b><small>{item.description}</small></div></NavLink>)}</nav>;
}
function AppShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = usePersistedState<Theme>('bt.theme', 'dark');
  const [collapsed, setCollapsed] = usePersistedState('bt.sidebar.collapsed', false);
  const [workspace, setWorkspace] = usePersistedState('bt.workspace', 'Alpha Research');
  const [rightOpen, setRightOpen] = usePersistedState('bt.rightPanel', true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notes, setNotes] = useState(notificationsSeed);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return <Protected><div className="app-shell"><aside className={collapsed ? 'desktop-only collapsed' : 'desktop-only'}><Sidebar /></aside><main className="main"><header className="topbar"><Button variant="ghost" className="hamb" onClick={() => setMobileOpen(true)}>☰</Button><Dropdown label={<span>{workspace} ▾</span>}><button onClick={() => setWorkspace('Alpha Research')}>Alpha Research</button><button onClick={() => setWorkspace('Personal')}>Personal</button></Dropdown><SearchInput onFocus={() => setSearchOpen(true)} /><Button variant="ghost" onClick={() => setCollapsed(!collapsed)}>Sidebar</Button><Button variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☾' : '☀'}</Button><Dropdown label={<span>🔔 {notes.length}</span>}><h4>Notifications</h4>{notes.map((note) => <p key={note}>{note}</p>)}{notes.length === 0 && <EmptyState title="All clear" description="No unread notifications." />}<Button variant="secondary" onClick={() => setNotes([])}>Clear All</Button></Dropdown><Dropdown label={<span className="avatar">AI</span>}><Link to="/profile">Profile</Link><Link to="/settings">Settings</Link><button onClick={() => api('/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); location.href = '/login'; })}>Logout</button></Dropdown></header><div className="content">{children}</div></main>{rightOpen && <aside className="right-panel"><div className="row"><h3>Workspace Pulse</h3><Button variant="ghost" onClick={() => setRightOpen(false)}>×</Button></div><p>Mock dashboard content for UI validation.</p><DataTable /><ConfirmationDialog /></aside>}<button className="right-toggle" onClick={() => setRightOpen(!rightOpen)}>Insights</button><nav className="bottom-nav">{navItems.slice(0, 5).map((item) => <NavLink key={item.path} to={item.path}>{item.icon}<span>{item.label.split(' ')[0]}</span></NavLink>)}</nav><Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}><Sidebar mobile close={() => setMobileOpen(false)} /></Drawer><Modal open={searchOpen} title="Global Search" onClose={() => setSearchOpen(false)}><SearchInput /><div className="search-results">{['Strategies', 'Reports', 'Journal', 'Backtests'].map((item) => <button key={item}>{item}<small>No backend results yet</small></button>)}</div></Modal><Toast message="Dashboard shell ready" /></div></Protected>;
}
function AuthShell({ children }: { children: React.ReactNode }) { return <main className="auth"><Link to="/dashboard" className="brand"><span>BT</span><b>BackTest AI</b></Link>{children}</main>; }
function AuthPage({ mode }: { mode: 'login' | 'register' }) { const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthForm>({ resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema) }); async function onSubmit(data: AuthForm) { const body = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(data) }); localStorage.setItem('accessToken', body.accessToken ?? ''); localStorage.setItem('refreshToken', body.refreshToken ?? ''); location.href = '/dashboard'; } return <AuthShell><Card className="auth-card"><h1>{mode === 'login' ? 'Login' : 'Create account'}</h1><p>Use the existing BackTest AI authentication system.</p><form onSubmit={handleSubmit(onSubmit)}>{mode === 'register' && <input className="input" placeholder="Name" {...register('name')} />}<input className="input" placeholder="Email" {...register('email')} /><input className="input" placeholder="Password" type="password" {...register('password')} />{mode === 'login' && <label><input type="checkbox" {...register('rememberMe')} /> Remember me</label>}<p className="error">{Object.values(errors)[0]?.message}</p><Button disabled={isSubmitting}>{isSubmitting ? <LoadingSpinner /> : 'Submit'}</Button></form><Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Register' : 'Login'}</Link><Link to="/forgot-password">Forgot password?</Link></Card></AuthShell>; }
function SimpleForm({ title, fields, endpoint }: { title: string; fields: string[]; endpoint: string }) { const { register, handleSubmit } = useForm<Record<string, string>>(); return <AuthShell><Card className="auth-card"><h1>{title}</h1><form onSubmit={handleSubmit((d) => api(endpoint, { method: 'POST', body: JSON.stringify(d) }).then(() => alert('Success')).catch((e) => alert(e.message)))}>{fields.map((f) => <input key={f} className="input" placeholder={f} type={f.toLowerCase().includes('password') ? 'password' : 'text'} {...register(f)} />)}<Button>Submit</Button></form></Card></AuthShell>; }
function Breadcrumb({ title }: { title: string }) { return <p className="crumb"><Link to="/dashboard">Dashboard</Link> / {title}</p>; }
function Page({ title, description }: { title: string; description: string }) { return <AppShell><Breadcrumb title={title} /><section className="hero"><h1>{title}</h1><p>{description}</p></section>{title === 'Settings' ? <Tabs /> : <EmptyState title={`${title} is ready for your workflow`} description="This application-shell page is intentionally empty until product business logic is implemented." />}</AppShell>; }
function Dashboard() { return <AppShell><Breadcrumb title="Overview" /><section className="hero"><h1>Dashboard</h1><p>Premium command center for strategy research, backtests, journal insights, and reports. Mock dashboard content is used for layout validation.</p></section><section className="metric-grid">{dashboardMetrics.map(([label, value, delta]) => <Card key={label}><small>{label}</small><strong>{value}</strong><p>{delta}</p></Card>)}</section><section className="dashboard-grid"><Card><h2>Quick Actions</h2><div className="quick-actions">{['New Strategy', 'Import Strategy', 'Run Backtest', 'Open Replay', 'Open Journal'].map((action) => <Button variant="secondary" key={action}>{action}</Button>)}</div></Card><Card><h2>Recent Activity</h2>{activity.map((item) => <p className="activity" key={item}>{item}</p>)}</Card><Card><h2>Recent Strategies</h2>{recentStrategies.map((item) => <p className="activity" key={item}>{item}</p>)}</Card><Card><h2>Recent Backtests</h2><DataTable /></Card><Card><h2>Pinned Strategies</h2><EmptyState title="No pinned strategies" description="Pin strategies to keep them one click away." /></Card></section></AppShell>; }
function Profile() { return <Page title="Profile" description="Manage your verified BackTest AI identity, avatar, and personal details." />; }
export function App() {
  const pages = useMemo(() => navItems.filter((item) => item.path !== '/dashboard').map((item) => <Route key={item.path} path={item.path} element={<Page title={item.label} description={item.description} />} />), []);
  return <QueryClientProvider client={queryClient}><Router><Routes><Route path="/" element={<Navigate to={token() ? '/dashboard' : '/login'} />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/forgot-password" element={<SimpleForm title="Forgot Password" fields={['email']} endpoint="/auth/forgot-password" />} /><Route path="/reset-password" element={<SimpleForm title="Reset Password" fields={['token', 'password']} endpoint="/auth/reset-password" />} /><Route path="/verify-email" element={<SimpleForm title="Verify Email" fields={['token']} endpoint="/auth/verify-email" />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/profile" element={<Profile />} />{pages}<Route path="/unauthorized" element={<AuthShell><h1>Unauthorized</h1></AuthShell>} /><Route path="*" element={<AuthShell><h1>404</h1></AuthShell>} /></Routes></Router></QueryClientProvider>;
}
