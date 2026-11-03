'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, ClipboardList, LayoutDashboard, LogOut, Package, Plus, Search, ShoppingBag, Smartphone, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; nama: string; kategori: string; deskripsi: string; harga: number; stok: number; gambar_url: string | null }
type Profile = { id: string; nama: string; role: 'admin' | 'user' }

function EmptyState({ title, description }: { title: string; description: string }) { return <div className="empty-state"><div className="empty-icon"><Package size={25} /></div><p className="empty-title">{title}</p><p className="empty-description">{description}</p></div> }

export default function Page() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [active, setActive] = useState<'catalog' | 'orders' | 'dashboard'>('catalog')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { window.location.href = '/auth'; return }
    setUser(currentUser)
    const [{ data: profileData }, { data: productData }] = await Promise.all([
      supabase.from('profiles').select('id,nama,role').eq('id', currentUser.id).single(),
      supabase.from('produk').select('id,nama,kategori,deskripsi,harga,stok,gambar_url').eq('aktif', true).order('created_at', { ascending: false }),
    ])
    setProfile(profileData)
    setProducts(productData ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  async function logout() { await supabase.auth.signOut(); window.location.href = '/auth' }
  async function order(product: Product) {
    if (!user || product.stok < 1) return
    const { error } = await supabase.from('pesanan').insert({ profile_id: user.id, produk_id: product.id, jumlah: 1, harga_satuan: product.harga })
    setMessage(error ? 'Pesanan gagal dibuat. Silakan coba lagi.' : 'Pesanan berhasil dibuat dan stok diperbarui.')
    if (!error) load()
  }
  const filtered = products.filter(p => `${p.nama} ${p.kategori}`.toLowerCase().includes(query.toLowerCase()))
  if (loading) return <main className="auth-page"><div className="auth-card"><p className="eyebrow blue">RIS GADGETKU</p><h1>Memuat data...</h1></div></main>
  const isAdmin = profile?.role === 'admin'
  return <div className="app-shell"><aside className="sidebar"><div className="brand-row"><div className="brand-mark"><Smartphone size={19} /></div><span>Ris GadgetKu</span></div><div className="store-chip"><Store size={16} /><span>Toko Utama</span></div><nav className="side-nav"><p className="nav-label">MENU UTAMA</p>{isAdmin && <button className={`nav-item ${active === 'dashboard' ? 'active' : ''}`} onClick={() => setActive('dashboard')}><LayoutDashboard size={18} /> Ringkasan</button>}<button className={`nav-item ${active === 'catalog' ? 'active' : ''}`} onClick={() => setActive('catalog')}><ShoppingBag size={18} /> Katalog Produk</button><button className={`nav-item ${active === 'orders' ? 'active' : ''}`} onClick={() => setActive('orders')}><ClipboardList size={18} /> Pesanan Saya</button>{isAdmin && <a className="nav-item" href="/admin"><Package size={18} /> Kelola Produk</a>}</nav><div className="sidebar-bottom"><div className="profile-mini"><div className="avatar">{(profile?.nama || 'U').slice(0, 2).toUpperCase()}</div><div><strong>{profile?.nama || user?.email}</strong><span>{isAdmin ? 'Administrator' : 'Pengguna'}</span></div></div><button className="logout-button" onClick={logout}><LogOut size={17} /> Keluar</button></div></aside><main className="main-area"><header className="topbar"><div><p className="eyebrow">RIS GADGETKU</p><h1>{active === 'dashboard' ? 'Ringkasan' : active === 'orders' ? 'Pesanan Saya' : 'Katalog Produk'}</h1></div><div className="top-actions"><button className="notification" aria-label="Notifikasi"><Bell size={19} /></button><div className="top-avatar">{(profile?.nama || 'U').slice(0, 2).toUpperCase()}</div></div></header>{active === 'dashboard' ? <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">RINGKASAN TOKO</p><h2>Selamat datang, {profile?.nama || 'Admin'}</h2><p className="subtext">Data ringkasan diambil langsung dari Supabase.</p></div></div><div className="stats-grid"><div className="stat-card"><div className="stat-icon"><Package size={20} /></div><div><span>Total produk</span><strong>{products.length}</strong></div></div><div className="stat-card"><div className="stat-icon"><ShoppingBag size={20} /></div><div><span>Stok tersedia</span><strong>{products.reduce((sum, p) => sum + p.stok, 0)}</strong></div></div></div></div> : active === 'orders' ? <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">AKTIVITAS</p><h2>Pesanan saya</h2><p className="subtext">Pesanan kamu tersimpan aman di database.</p></div></div><EmptyState title="Pesanan dimuat berdasarkan akunmu" description="Buka katalog untuk membuat pesanan baru." /></div> : <div className="page-content"><div className="welcome-row"><div><p className="eyebrow blue">KATALOG TOKO</p><h2>Temukan perangkat pilihanmu</h2><p className="subtext">Produk aktif dan stok terbaru dari database.</p></div><button className="primary-button" onClick={() => setActive('orders')}><ClipboardList size={17} /> Pesanan saya</button></div><div className="filter-bar"><div className="search-field"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama produk..." aria-label="Cari nama produk" /></div></div>{message && <p className="form-message">{message}</p>}<div className="product-grid">{filtered.map(product => <article className="product-card" key={product.id}>{product.gambar_url ? <img src={product.gambar_url} alt={product.nama} /> : <div className="product-placeholder"><Smartphone size={28} /></div>}<div className="product-card-body"><span className="product-category">{product.kategori}</span><h3>{product.nama}</h3><p>{product.deskripsi}</p><div className="product-card-footer"><strong>Rp{Number(product.harga).toLocaleString('id-ID')}</strong><button className="primary-button" disabled={product.stok < 1} onClick={() => order(product)}><Plus size={16} /> Pesan</button></div><small>{product.stok} stok tersedia</small></div></article>)}{filtered.length === 0 && <EmptyState title="Belum ada produk" description="Admin dapat menambahkan produk melalui halaman admin." />}</div></div>}</main></div>
}
