'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, ClipboardList, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, Smartphone, Store, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; nama: string; merek: string; kategori: string; deskripsi: string; harga: number; stok: number; gambar_url: string | null }
type Profile = { id: string; nama: string; role: 'admin' | 'user' }
type Order = { id: string; jumlah: number; harga_satuan: number; total: number; status: string; created_at: string; nama_produk: string | null; merek: string | null; gambar_url: string | null; produk: { nama: string; merek: string; gambar_url: string | null } | null }

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-icon"><Package size={25} /></div><p className="empty-title">{title}</p><p className="empty-description">{description}</p></div>
}

export default function Page() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [active, setActive] = useState<'catalog' | 'orders' | 'dashboard'>('catalog')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderError, setOrderError] = useState('')

  async function load() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) { window.location.href = '/auth'; return }
    setUser(currentUser)
    const [{ data: profileData }, { data: productData }, { data: orderData }] = await Promise.all([
      supabase.from('profiles').select('id,nama,role').eq('id', currentUser.id).single(),
      supabase.from('produk').select('id,nama,merek,kategori,deskripsi,harga,stok,gambar_url').eq('aktif', true).order('created_at', { ascending: false }),
      supabase.from('pesanan').select('id,jumlah,harga_satuan,total,status,created_at,nama_produk,merek,gambar_url,produk:produk_id(nama,gambar_url,merek)').eq('profile_id', currentUser.id).order('created_at', { ascending: false }),
    ])
    setProfile(profileData)
    setProducts(productData ?? [])
    setOrders(((orderData as unknown as Array<Omit<Order, 'produk'> & { produk: Array<{ nama: string; merek: string; gambar_url: string | null }> }>) ?? []).map(order => ({ ...order, produk: order.produk?.[0] ?? null })))
    setLoading(false)
  }
  useEffect(() => {
    if (window.location.hash === '#access-denied') {
      setMessage('Akses ditolak: halaman ini khusus admin')
      window.history.replaceState(null, '', window.location.pathname)
    }
    load()
  }, [])
  async function logout() { await supabase.auth.signOut(); window.location.href = '/auth' }
  function openOrderDialog(product: Product) {
    setSelectedProduct(product)
    setOrderQuantity(1)
    setOrderError('')
    setOrderDialogOpen(true)
  }

  async function confirmOrder() {
    if (!selectedProduct) return
    setOrderError('')
    const { error } = await supabase.rpc('create_order', { p_product_id: selectedProduct.id, p_quantity: orderQuantity })
    if (error) {
      setOrderError(error.message.includes('Stok produk tidak mencukupi') ? 'Stok tidak mencukupi untuk jumlah tersebut.' : error.message)
      return
    }
    setMessage('Pesanan berhasil dibuat dan stok diperbarui.')
    setSelectedProduct(null)
    setOrderDialogOpen(false)
    await load()
  }

  async function cancelOrder(orderId: string) {
    if (!window.confirm('Batalkan pesanan ini? Stok akan dikembalikan.')) return
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
    if (error) setMessage(error.message.includes('Hanya pesanan pending') ? 'Pesanan ini sudah tidak dapat dibatalkan.' : error.message)
    else { setMessage('Pesanan dibatalkan dan stok dikembalikan.'); await load() }
  }
  const isAdmin = profile?.role === 'admin'
  const filtered = products.filter(p => `${p.nama} ${p.kategori}`.toLowerCase().includes(query.toLowerCase()))
  const notificationItems = isAdmin ? [
    ...products.filter(product => product.stok <= 0).map(product => `Stok habis: ${product.nama}`),
    ...orders.filter(order => order.status === 'pending').map(order => `Pesanan baru #${order.id.slice(0, 8)}`),
  ] : orders.filter(order => order.status === 'pending').map(order => `Pesanan ${order.nama_produk || order.produk?.nama || ''} sedang diproses`)
  if (loading) return <main className="auth-page"><div className="auth-card"><p className="eyebrow blue">RIS GADGETKU</p><h1>Memuat data...</h1></div></main>
  return <div className="app-shell"><aside className={`sidebar ${menuOpen ? 'mobile-open' : ''}`}><button className="mobile-close" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}><X size={20} /></button><div className="brand-row"><div className="brand-mark"><Smartphone size={19} /></div><span>Ris GadgetKu</span></div><div className="store-chip"><Store size={16} /><span>Toko Utama</span></div><nav className="side-nav"><p className="nav-label">MENU UTAMA</p>{isAdmin && <button className={`nav-item ${active === 'dashboard' ? 'active' : ''}`} onClick={() => { setActive('dashboard'); setMenuOpen(false) }}><LayoutDashboard size={18} /> Ringkasan</button>}<button className={`nav-item ${active === 'catalog' ? 'active' : ''}`} onClick={() => { setActive('catalog'); setMenuOpen(false) }}><ShoppingBag size={18} /> Katalog Produk</button><button className={`nav-item ${active === 'orders' ? 'active' : ''}`} onClick={() => { setActive('orders'); setMenuOpen(false) }}><ClipboardList size={18} /> Pesanan Saya</button>{isAdmin && <a className="nav-item" href="/admin"><Package size={18} /> Admin Console</a>}</nav><div className="sidebar-bottom"><button className="logout-button" onClick={logout}><LogOut size={17} /> Keluar</button><div className="profile-mini"><div className="avatar">{(profile?.nama || 'U').slice(0, 2).toUpperCase()}</div><div><strong>{profile?.nama || user?.email}</strong><span>{isAdmin ? 'Administrator' : 'Pengguna'}</span></div></div></div></aside>{menuOpen && <button className="drawer-scrim" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}<main className="main-area"><header className="topbar"><button className="menu-button" aria-label="Buka menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div><p className="eyebrow">RIS GADGETKU</p><h1>{active === 'dashboard' ? 'Ringkasan' : active === 'orders' ? 'Pesanan Saya' : 'Katalog Produk'}</h1></div><div className="top-actions"><div className="notification-wrap"><button className="notification" aria-label="Notifikasi" onClick={() => setNotificationsOpen(open => !open)}><Bell size={19} />{notificationItems.length > 0 && <span className="notification-badge">{notificationItems.length}</span>}</button>{notificationsOpen && <div className="notification-popover"><strong>Notifikasi</strong>{notificationItems.length ? notificationItems.slice(0, 5).map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>Tidak ada notifikasi baru.</p>}</div>}</div><button className="header-logout" onClick={logout}><LogOut size={16} /><span>Keluar</span></button><div className="top-avatar">{(profile?.nama || 'U').slice(0, 2).toUpperCase()}</div></div></header><section className="page-content">{active === 'catalog' && <><div className="catalog-toolbar"><div><p className="eyebrow blue">KATALOG</p><h2>Temukan gadget pilihanmu</h2><p>Pilih produk terbaik untuk kebutuhan harianmu.</p></div><div className="search-field"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari produk..." /></div></div>{message && <div className="notice-banner">{message}</div>}{filtered.length === 0 ? <EmptyState title="Produk tidak ditemukan" description="Coba kata kunci lain atau kembali lagi nanti." /> : <div className="catalog-grid">{filtered.map(product => <button className="catalog-card" key={product.id} onClick={() => { window.location.href = `/produk/${product.id}` }}><div className="catalog-image">{product.gambar_url ? <img src={product.gambar_url} alt={product.nama} /> : <Package size={34} />}</div><div className="catalog-card-body"><span className="category-label">{product.kategori}</span><h3>{product.nama}</h3><p>{formatRupiah(product.harga)}</p><small>{product.stok > 0 ? `${product.stok} tersedia` : 'Stok habis'}</small></div></button>)}</div>}</>}{active === 'orders' && <div className="content-panel"><p className="eyebrow blue">AKTIVITAS</p><h2>Pesanan Saya</h2>{orders.length === 0 ? <EmptyState title="Belum ada pesanan" description="Pesanan yang kamu buat akan tampil di sini." /> : <div className="order-history-list w-full max-w-full" style={{ overflowX: 'hidden' }}>{orders.map(order => <article className="order-history-card flex flex-col w-full max-w-full" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }} key={order.id}><div className="order-history-product-row flex w-full max-w-full" style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}><div className="order-history-image" style={{ flex: '0 0 52px' }}>{order.gambar_url || order.produk?.gambar_url ? <img src={order.gambar_url || order.produk?.gambar_url || ''} alt={order.nama_produk || order.produk?.nama || 'Produk'} /> : <Package size={20} />}</div><div className="order-history-copy min-w-0" style={{ minWidth: 0, flex: '1 1 auto' }}><strong className="text-slate-900" style={{ color: '#0f172a', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.nama_produk || order.produk?.nama || 'Produk'}</strong><span className="text-slate-600" style={{ color: '#475569' }}>{order.merek || order.produk?.merek || 'Tanpa merek'}</span></div></div><div className="order-history-meta-row flex w-full max-w-full text-slate-600" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', color: '#475569' }}><span>Jumlah: {order.jumlah}</span><span>Harga satuan: {formatRupiah(order.harga_satuan)}</span><span>Total: {formatRupiah(order.total)}</span><span>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(order.created_at))}</span></div><div className="order-history-status-row w-full max-w-full" style={{ width: '100%' }}><span className={`status-pill ${order.status}`}>{order.status}</span></div>{order.status === 'pending' && <button className="cancel-order-button w-full max-w-full" style={{ width: '100%' }} onClick={() => cancelOrder(order.id)}>Batalkan Pesanan</button>}</article>)}</div>}</div>}{active === 'dashboard' && <div className="content-panel"><p className="eyebrow blue">ADMIN</p><h2>Ringkasan</h2><p>Gunakan Admin Console untuk mengelola produk, pesanan, dan pelanggan.</p><a className="primary-button inline-button" href="/admin">Buka Admin Console</a></div>}</section></main>{orderDialogOpen && selectedProduct && <div className="product-detail-backdrop" role="presentation"><div className="quantity-dialog" role="dialog" aria-modal="true" aria-labelledby="quantity-title"><button className="detail-close" onClick={() => setOrderDialogOpen(false)} aria-label="Tutup"><X size={20} /></button><p className="eyebrow blue">KONFIRMASI PESANAN</p><h2 id="quantity-title">{selectedProduct.nama}</h2><p className="quantity-price">{formatRupiah(selectedProduct.harga)} / item</p><div className="quantity-control"><button onClick={() => setOrderQuantity(value => Math.max(1, value - 1))} aria-label="Kurangi jumlah">−</button><input type="number" min="1" max={selectedProduct.stok} value={orderQuantity} onChange={event => setOrderQuantity(Math.min(selectedProduct.stok, Math.max(1, Number(event.target.value) || 1)))} aria-label="Jumlah pesanan" /><button onClick={() => setOrderQuantity(value => Math.min(selectedProduct.stok, value + 1))} aria-label="Tambah jumlah">+</button></div><p className="stock-hint">Maksimal {selectedProduct.stok} item tersedia.</p><div className="quantity-total"><span>Total</span><strong>{formatRupiah(selectedProduct.harga * orderQuantity)}</strong></div>{orderError && <p className="order-error">{orderError}</p>}<button className="primary-button detail-order" onClick={confirmOrder}>Konfirmasi Pesanan</button></div></div>}{selectedProduct && <div className="product-detail-backdrop" role="presentation"><div className="product-detail-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-product-title"><button className="detail-close" onClick={() => setSelectedProduct(null)} aria-label="Tutup detail"><X size={20} /></button><div className="detail-image">{selectedProduct.gambar_url ? <img src={selectedProduct.gambar_url} alt={selectedProduct.nama} /> : <Package size={58} />}</div><div className="detail-copy"><span className="category-label">{selectedProduct.kategori}</span><h2 id="catalog-product-title">{selectedProduct.nama}</h2><strong>{formatRupiah(selectedProduct.harga)}</strong><p>{selectedProduct.deskripsi || 'Produk gadget pilihan untuk kebutuhanmu.'}</p><span className={selectedProduct.stok > 0 ? 'stock-ok' : 'stock-empty'}>{selectedProduct.stok > 0 ? `${selectedProduct.stok} stok tersedia` : 'Stok habis'}</span><button className="primary-button detail-order" disabled={selectedProduct.stok < 1} onClick={() => { setOrderDialogOpen(false); openOrderDialog(selectedProduct) }}>Pesan</button></div></div></div>}</div>
}
