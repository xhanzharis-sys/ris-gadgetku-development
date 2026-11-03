'use client'

import { useState } from 'react'
import {
  BarChart3,
  Bell,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Smartphone,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Katalog Produk', icon: ShoppingBag, key: 'catalog' },
  { label: 'Pesanan Saya', icon: ClipboardList, key: 'orders' },
]

const adminItems = [
  { label: 'Ringkasan', icon: LayoutDashboard, key: 'dashboard' },
  { label: 'Kelola Produk', icon: Package, key: 'products' },
  { label: 'Perlu Restock', icon: Bell, key: 'restock' },
  { label: 'Pengguna', icon: Users, key: 'users' },
]

function EmptyState({ title = 'Belum ada data', description = 'Data akan tampil setelah terhubung dengan database.' }: { title?: string; description?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Package size={25} strokeWidth={1.6} /></div>
      <p className="empty-title">{title}</p>
      <p className="empty-description">{description}</p>
    </div>
  )
}

function Sidebar({ active, setActive, role, onClose }: { active: string; setActive: (key: string) => void; role: 'admin' | 'user'; onClose?: () => void }) {
  const items = role === 'admin' ? adminItems : navItems
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark"><Smartphone size={19} /></div>
        <span>Ris GadgetKu</span>
        {onClose && <button className="icon-button mobile-close" onClick={onClose} aria-label="Tutup menu"><X size={20} /></button>}
      </div>
      <div className="store-chip"><Store size={16} /><span>Toko Utama</span><ChevronDown size={14} /></div>
      <nav className="side-nav" aria-label="Navigasi utama">
        <p className="nav-label">MENU UTAMA</p>
        {items.map((item) => {
          const Icon = item.icon
          return <button key={item.key} className={`nav-item ${active === item.key ? 'active' : ''}`} onClick={() => { setActive(item.key); onClose?.() }}><Icon size={18} /><span>{item.label}</span>{item.key === 'restock' && <span className="nav-count">0</span>}</button>
        })}
        {role === 'admin' && <p className="nav-label admin-label">TOKO</p>}
        {role === 'admin' && <button className="nav-item" onClick={() => { setActive('settings'); onClose?.() }}><Settings size={18} /><span>Pengaturan</span></button>}
      </nav>
      <div className="sidebar-bottom">
        <div className="profile-mini"><div className="avatar">AR</div><div><strong>Admin Ris</strong><span>Administrator</span></div><ChevronDown size={16} /></div>
        <button className="logout-button"><LogOut size={17} /> Keluar</button>
      </div>
    </aside>
  )
}

function Topbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  return <header className="topbar"><button className="icon-button menu-button" onClick={onMenu} aria-label="Buka menu"><Menu size={22} /></button><div><p className="eyebrow">RIS GADGETKU</p><h1>{title}</h1></div><div className="top-actions"><button className="notification" aria-label="Notifikasi"><Bell size={19} /><span /></button><div className="top-avatar">AR</div></div></header>
}

function Catalog({ setActive }: { setActive: (key: string) => void }) {
  const [query, setQuery] = useState('')
  return <div className="page-content">
    <div className="welcome-row"><div><p className="eyebrow blue">KATALOG TOKO</p><h2>Temukan perangkat pilihanmu</h2><p className="subtext">Kelola dan pantau stok gadget dengan lebih mudah.</p></div><button className="primary-button" onClick={() => setActive('orders')}><ClipboardList size={17} /> Pesanan saya</button></div>
    <div className="filter-bar"><div className="search-field"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama produk..." aria-label="Cari nama produk" /></div><select aria-label="Filter merek"><option>Semua merek</option></select><select aria-label="Filter harga"><option>Semua harga</option></select><button className="filter-button" aria-label="Filter lanjutan"><SlidersHorizontal size={18} /></button></div>
    <div className="section-heading"><div><h3>Semua produk</h3><span className="muted-label">0 produk tersedia</span></div></div>
    <EmptyState title={query ? `Produk “${query}” tidak ditemukan` : 'Belum ada produk'} description="Produk yang sudah ditambahkan akan muncul di sini." />
  </div>
}

function Orders() {
  return <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">AKTIVITAS</p><h2>Pesanan saya</h2><p className="subtext">Pantau status pesanan yang kamu buat.</p></div><button className="primary-button"><Plus size={17} /> Buat pesanan</button></div><div className="tabs"><button className="tab active">Semua</button><button className="tab">Menunggu</button><button className="tab">Selesai</button></div><EmptyState title="Belum ada pesanan" description="Pesanan baru akan tercatat di halaman ini." /></div>
}

function Dashboard() {
  const stats = [{ label: 'Total produk', value: '0', icon: Package }, { label: 'Total terjual', value: '0', icon: ShoppingBag }, { label: 'Pendapatan', value: 'Rp0', icon: BarChart3 }]
  return <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">RINGKASAN TOKO</p><h2>Selamat pagi, Admin Ris</h2><p className="subtext">Berikut ringkasan aktivitas tokomu hari ini.</p></div><button className="date-button">7 hari terakhir <ChevronDown size={15} /></button></div><div className="stats-grid">{stats.map(({ label, value, icon: Icon }) => <div className="stat-card" key={label}><div className="stat-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong></div></div>)}</div><div className="dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h3>Penjualan</h3><span className="muted-label">Ringkasan penjualan 7 hari</span></div><BarChart3 size={19} className="panel-heading-icon" /></div><EmptyState title="Belum ada penjualan" description="Grafik akan muncul setelah ada pesanan selesai." /></div><div className="panel"><div className="panel-heading"><div><h3>Perlu restock</h3><span className="muted-label">0 produk di bawah batas</span></div><button className="text-button">Lihat semua</button></div><EmptyState title="Stok aman" description="Tidak ada produk yang perlu direstock." /></div></div></div>
}

function ProductManagement() {
  return <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">INVENTARIS</p><h2>Kelola produk</h2><p className="subtext">Tambah dan atur katalog produk tokomu.</p></div><button className="primary-button"><Plus size={17} /> Tambah produk</button></div><div className="filter-bar"><div className="search-field"><Search size={18} /><input placeholder="Cari produk..." aria-label="Cari produk" /></div><button className="secondary-button"><SlidersHorizontal size={17} /> Filter</button></div><div className="panel table-panel"><div className="panel-heading"><div><h3>Daftar produk</h3><span className="muted-label">0 produk terdaftar</span></div></div><EmptyState title="Belum ada produk" description="Tambahkan produk pertama untuk mulai mengelola inventaris." /></div></div>
}

function Restock() { return <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">INVENTARIS</p><h2>Perlu restock</h2><p className="subtext">Daftar produk dengan stok di bawah batas minimal.</p></div><div className="restock-badge"><Bell size={16} /> 0 perlu perhatian</div></div><div className="panel"><EmptyState title="Stok aman" description="Belum ada produk yang perlu direstock." /></div></div> }
function UsersPage() { return <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">MANAJEMEN AKUN</p><h2>Pengguna</h2><p className="subtext">Kelola akses admin dan pengguna toko.</p></div><button className="primary-button"><Plus size={17} /> Tambah pengguna</button></div><div className="panel"><div className="panel-heading"><div><h3>Daftar pengguna</h3><span className="muted-label">0 akun terdaftar</span></div></div><EmptyState title="Belum ada pengguna" description="Akun yang terdaftar akan muncul di sini." /></div></div> }

export default function Page() {
  const [role, setRole] = useState<'admin' | 'user'>('admin')
  const [active, setActive] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const titles: Record<string, string> = { dashboard: 'Ringkasan', products: 'Kelola Produk', restock: 'Perlu Restock', users: 'Pengguna', catalog: 'Katalog Produk', orders: 'Pesanan Saya', settings: 'Pengaturan' }
  const view = role === 'admin' ? (active === 'dashboard' ? <Dashboard /> : active === 'products' ? <ProductManagement /> : active === 'restock' ? <Restock /> : active === 'users' ? <UsersPage /> : <Catalog setActive={setActive} />) : active === 'orders' ? <Orders /> : <Catalog setActive={setActive} />
  return <div className="app-shell"><div className="role-switch"><span>Mode tampilan:</span><button className={role === 'admin' ? 'selected' : ''} onClick={() => { setRole('admin'); setActive('dashboard') }}>Admin</button><button className={role === 'user' ? 'selected' : ''} onClick={() => { setRole('user'); setActive('catalog') }}>User</button></div><div className={`sidebar-wrap ${mobileOpen ? 'open' : ''}`}><Sidebar active={active} setActive={setActive} role={role} onClose={() => setMobileOpen(false)} /></div>{mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" /> }<main className="main-area"><Topbar title={titles[active] || 'Ris GadgetKu'} onMenu={() => setMobileOpen(true)} />{view}</main></div>
}
