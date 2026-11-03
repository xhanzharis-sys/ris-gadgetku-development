'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, ClipboardList, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, Smartphone, Store, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; nama: string; kategori: string; deskripsi: string; harga: number; stok: number; gambar_url: string | null }
type Profile = { id: string; nama: string; role: 'admin' | 'user' }

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-icon"><Package size={25} /></div><p className="empty-title">{title}</p><p className="empty-description">{description}</p></div>
}

export default function Page() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [active, setActive] = useState<'catalog' | 'orders' | 'dashboard'>('catalog')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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
    setSelectedProduct(null)
    if (!error) load()
  }
  const filtered = products.filter(p => `${p.nama} ${p.kategori}`.toLowerCase().includes(query.toLowerCase()))
  if (loading) return <main className="auth-page"><div className="auth-card"><p className="eyebrow blue">RIS GADGETKU</p><h1>Memuat data...</h1></div></main>
  const isAdmin = profile?.role === 'admin'
  return <div className="app-shell"><aside className={`sidebar ${menuOpen ? 'mobile-open' : ''}`}><button className="mobile-close" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}><X size={20} /></button><div className="brand-row"><div className="brand-mark"><Smartphone size={19} /></div><span>Ris GadgetKu</span></div><div className="store-chip"><Store size={16} /><span>Toko Utama</span></div><nav className="side-nav"><p className="nav-label">MENU UTAMA</p>{isAdmin && <button className={`nav-item ${active === 'dashboard' ? 'active' : ''}`} onClick={() => { setActive('dashboard'); setMenuOpen(false) }}><LayoutDashboard size={18} /> Ringkasan</button>}<button className={`nav-item ${active === 'catalog' ? 'active' : ''}`} onClick={() => { setActive('catalog'); setMenuOpen(false) }}><ShoppingBag size={18} /> Katalog Produk</button><button className={`nav-item ${active === 'orders' ? 'active' : ''}`} onClick={() => { setActive('orders'); setMenuOpen(false) }}><ClipboardList size={18} /> Pesanan Saya</button>{isAdmin && <a className="nav-item" href="/admin"><Package size={18} /> Admin Console</a>}</nav><div className="sidebar-bottom"><button className="logout-button" onClick={logout}><LogOut size={17} /> Keluar</button><div className="profile-mini"><div className="avatar">{(profile?.nama || 'U').slice(0, 2).toUpperCase()}</div><div><strong>{profile?.nama || user?.email}</strong><span>{isAdmin ? 'Administrator' : 'Pengguna'}</span></div></div></div></aside>{menuOpen && <button className="drawer-scrim" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}<main className="main-area"><header className="topbar"><button className="menu-button" aria-label="Buka menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div><p className="eyebrow">RIS GADGETKU</p><h1>{active === 'dashboard' ? 'Ringkasan' : active === 'orders' ? 'Pesanan Saya' : 'Katalog Produk'}</h1></div><div className="top-actions"><button className="notification" aria-label="Notifikasi"><Bell size={19} /></button><button className="header-logout" onClick={logout}><LogOut size={16} /><span>Keluar</span></button><div className="top-avatar">{(profile?.nama || 'U').slice(0, 2).toUpperCase()}</div></div></header><section className="page-content">{active === 'catalog' && <><div className="catalog-toolbar"><div><p className="eyebrow blue">KATALOG</p><h2>Temukan gadget pilihanmu</h2><p>Pilih produk terbaik untuk kebutuhan harianmu.</p></div><div className="search-field"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari produk..." /></div></div>{message && <div className="notice-banner">{message}</div>}{filtered.length === 0 ? <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci lain atau kembali lagi nanti." /> : <div className="catalog-grid">{filtered.map(product => <button className="catalog-card" key={product.id} onClick={() => setSelectedProduct(product)}><div className="catalog-image">{product.gambar_url ? <img src={product.gambar_url} alt={product.nama} /> : <Package size={34} />}</div><div className="catalog-card-body"><span className="category-label">{product.kategori}</span><h3>{product.nama}</h3><p>{formatRupiah(product.harga)}</p><small>{product.stok > 0 ? `${product.stok} tersedia` : 'Stok habis'}</small></div></button>)}</div>}</>}{active === 'orders' && <div className="content-panel"><p className="eyebrow blue">AKTIVITAS</p><h2>Pesanan Saya</h2><EmptyState title="Belum ada pesanan" description="Pesanan yang kamu buat akan tampil di sini." /></div>}{active === 'dashboard' && <div className="content-panel"><p className="eyebrow blue">ADMIN</p><h2>Ringkasan</h2><p>Gunakan Admin Console untuk mengelola produk, pesanan, dan pelanggan.</p><a className="primary-button inline-button" href="/admin">Buka Admin Console</a></div>}</section></main>{selectedProduct && <div className="product-detail-backdrop" role="presentation"><div className="product-detail-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-product-title"><button className="detail-close" onClick={() => setSelectedProduct(null)} aria-label="Tutup detail"><X size={20} /></button><div className="detail-image">{selectedProduct.gambar_url ? <img src={selectedProduct.gambar_url} alt={selectedProduct.nama} /> : <Package size={58} />}</div><div className="detail-copy"><span className="category-label">{selectedProduct.kategori}</span><h2 id="catalog-product-title">{selectedProduct.nama}</h2><strong>{formatRupiah(selectedProduct.harga)}</strong><p>{selectedProduct.deskripsi || 'Produk gadget pilihan untuk kebutuhanmu.'}</p><span className={selectedProduct.stok > 0 ? 'stock-ok' : 'stock-empty'}>{selectedProduct.stok > 0 ? `${selectedProduct.stok} stok tersedia` : 'Stok habis'}</span><button className="primary-button detail-order" disabled={selectedProduct.stok < 1} onClick={() => order(selectedProduct)}>Pesan</button></div></div></div>}</div>
}
