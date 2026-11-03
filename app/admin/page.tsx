'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Bell, Box, Check, Edit3, ImagePlus, LayoutDashboard, LogOut, Menu, Package, Plus, Search, ShoppingBag, Trash2, Upload, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = { id: string; nama: string; merek: string; kategori: string; deskripsi: string; harga: number; stok: number; stok_minimal: number; gambar_url: string | null; aktif: boolean }
type Order = { id: string; jumlah: number; total: number; status: string; created_at: string; produk: { nama: string } | null; profiles: { id: string; nama: string } | null }
type Customer = { id: string; nama: string; email: string | null; role: string; created_at: string }
type FormState = Omit<Product, 'id' | 'gambar_url' | 'harga' | 'stok' | 'stok_minimal'> & { gambar_url: string; harga: string; stok: string; stok_minimal: string }

const emptyForm: FormState = { nama: '', merek: '', kategori: 'Aksesoris', deskripsi: '', harga: '', stok: '', stok_minimal: '', gambar_url: '', aktif: true }
const onlyDigits = (value: string) => value.replace(/\D/g, '')
const formatThousands = (value: string) => { const digits = onlyDigits(value); return digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '' }
const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

export default function AdminPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: productRows, error: productError }, { data: orderRows, error: orderError }, { data: customerRows, error: customerError }] = await Promise.all([
      supabase.from('produk').select('id,nama,merek,kategori,deskripsi,harga,stok,stok_minimal,gambar_url,aktif').order('created_at', { ascending: false }),
      supabase.from('pesanan').select('id,jumlah,total,status,created_at,produk(nama),profiles(id,nama)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,nama,email,role,created_at').eq('role', 'user').order('created_at', { ascending: false }),
    ])
    if (productError || orderError || customerError) setError(productError?.message ?? orderError?.message ?? customerError?.message ?? 'Gagal memuat data.')
    setProducts((productRows as Product[]) ?? [])
    setCustomers((customerRows as Customer[]) ?? [])
    setOrders(((orderRows as unknown as Array<Order & { produk: Array<{ nama: string }>; profiles: Array<{ id: string; nama: string }> }>) ?? []).map(order => ({ ...order, produk: order.produk?.[0] ?? null, profiles: order.profiles?.[0] ?? null })))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') { router.replace('/'); return }
      if (mounted) loadData()
    })
    return () => { mounted = false }
  }, [loadData, router, supabase])

  const lowStock = products.filter(product => product.stok <= product.stok_minimal)
  const filteredProducts = useMemo(() => products.filter(product => `${product.nama} ${product.merek} ${product.kategori}`.toLowerCase().includes(search.toLowerCase())), [products, search])
  const filteredCustomers = useMemo(() => customers.filter(customer => `${customer.nama} ${customer.email ?? ''}`.toLowerCase().includes(search.toLowerCase())), [customers, search])
  const notificationItems = [...lowStock.map(product => `Stok menipis: ${product.nama}`), ...orders.filter(order => order.status === 'pending').map(order => `Pesanan baru #${order.id.slice(0, 8)}`)]
  const updateForm = (key: keyof FormState, value: string | boolean) => setForm(current => ({ ...current, [key]: value }))
  const updateNumericField = (key: 'harga' | 'stok' | 'stok_minimal', value: string) => updateForm(key, key === 'harga' ? formatThousands(value) : onlyDigits(value))

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    const harga = onlyDigits(form.harga); const stok = onlyDigits(form.stok); const stokMinimal = onlyDigits(form.stok_minimal)
    if (!harga || Number(harga) <= 0) { setError('Harga harus diisi dan lebih dari Rp 0.'); return }
    if (!stok) { setError('Stok wajib diisi.'); return }
    if (!stokMinimal) { setError('Stok minimal wajib diisi.'); return }
    setSaving(true)
    const payload = { ...form, harga: Number(harga), stok: Number(stok), stok_minimal: Number(stokMinimal), gambar_url: form.gambar_url || null }
    const result = editingId ? await supabase.from('produk').update(payload).eq('id', editingId) : await supabase.from('produk').insert(payload)
    if (result.error) setError(result.error.message)
    else { setNotice(editingId ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.'); setForm(emptyForm); setEditingId(null); setShowForm(false); await loadData() }
    setSaving(false)
  }

  const editProduct = (product: Product) => { setEditingId(product.id); setForm({ ...product, harga: product.harga ? formatThousands(String(product.harga)) : '', stok: product.stok > 0 ? String(product.stok) : '', stok_minimal: product.stok_minimal > 0 ? String(product.stok_minimal) : '', gambar_url: product.gambar_url ?? '' }); setSelectedProduct(null); setShowForm(true) }
  const deleteProduct = async (product: Product) => { if (!window.confirm(`Hapus produk ${product.nama}?`)) return; const { error: deleteError } = await supabase.from('produk').delete().eq('id', product.id); if (deleteError) setError(deleteError.message); else { setNotice('Produk berhasil dihapus.'); setSelectedProduct(null); await loadData() } }
  const toggleProduct = async (product: Product) => { const { error: toggleError } = await supabase.from('produk').update({ aktif: !product.aktif }).eq('id', product.id); if (toggleError) setError(toggleError.message); else { setNotice(`Produk ${product.aktif ? 'dinonaktifkan' : 'diaktifkan'}.`); setSelectedProduct(null); await loadData() } }
  const uploadImage = async (file: File) => { const extension = file.name.split('.').pop() || 'jpg'; const { error: uploadError } = await supabase.storage.from('produk').upload(`${crypto.randomUUID()}.${extension}`, file, { upsert: false, contentType: file.type }); if (uploadError) { setError(uploadError.message); return } const { data } = supabase.storage.from('produk').getPublicUrl(`${crypto.randomUUID()}.${extension}`); updateForm('gambar_url', data.publicUrl) }
  const updateOrderStatus = async (id: string, status: string) => { const { error: updateError } = await supabase.from('pesanan').update({ status }).eq('id', id); if (updateError) setError(updateError.message); else { setNotice('Status pesanan diperbarui.'); await loadData() } }
  const logout = async () => { await supabase.auth.signOut(); router.replace('/auth') }

  if (loading) return <main className="auth-page"><div className="auth-card"><p className="eyebrow blue">RIS GADGETKU</p><h1>Memuat data...</h1></div></main>
  return <main className="admin-page"><aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}><div className="admin-brand"><div className="brand-mark">R</div><div><strong>Ris GadgetKu</strong><span>Admin Console</span></div><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Tutup menu"><X size={18} /></button></div><nav className="admin-nav"><button className={activeTab === 'overview' ? 'active' : ''} onClick={() => { setActiveTab('overview'); setMenuOpen(false) }}><LayoutDashboard size={18} />Overview</button><button className={activeTab === 'products' ? 'active' : ''} onClick={() => { setActiveTab('products'); setMenuOpen(false) }}><Package size={18} />Produk</button><button className={activeTab === 'orders' ? 'active' : ''} onClick={() => { setActiveTab('orders'); setMenuOpen(false) }}><ShoppingBag size={18} />Pesanan<span className="nav-count">{orders.length}</span></button><button className={activeTab === 'customers' ? 'active' : ''} onClick={() => { setActiveTab('customers'); setMenuOpen(false) }}><Users size={18} />Pelanggan<span className="nav-count">{customers.length}</span></button><a className="nav-item admin-store-link" href="/"><StoreIcon />Lihat Toko</a></nav><div className="admin-profile"><div className="avatar">A</div><div><strong>Admin GadgetKu</strong><span>Administrator</span></div><button onClick={logout} className="icon-button" aria-label="Keluar"><LogOut size={16} /></button></div></aside>{menuOpen && <button className="admin-scrim" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" />}<section className="admin-content"><header className="admin-header"><button className="admin-menu-button" onClick={() => setMenuOpen(true)} aria-label="Buka menu"><Menu size={20} /></button><div><p className="eyebrow">Admin Console</p><h1>{activeTab === 'overview' ? 'Overview' : activeTab === 'products' ? 'Manajemen Produk' : activeTab === 'orders' ? 'Pesanan Masuk' : 'Manajemen Pelanggan'}</h1></div><div className="admin-header-actions"><div className="notification-wrap"><button className="notification" aria-label="Notifikasi" onClick={() => setNotificationsOpen(open => !open)}><Bell size={18} />{notificationItems.length > 0 && <span className="notification-badge">{notificationItems.length}</span>}</button>{notificationsOpen && <div className="notification-popover"><strong>Notifikasi</strong>{notificationItems.length ? notificationItems.slice(0, 5).map((item, index) => <p key={`${item}-${index}`}>{item}</p>) : <p>Tidak ada notifikasi baru.</p>}</div>}</div><button className="header-logout" onClick={logout}><LogOut size={16} />Keluar</button><div className="admin-avatar">A</div></div></header>{notice && <div className="notice"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={15} /></button></div>}{error && <div className="error-banner"><AlertTriangle size={16} />{error}<button onClick={() => setError('')} aria-label="Tutup error"><X size={15} /></button></div>}

{activeTab === 'overview' && <section className="admin-overview"><div className="stat-grid"><div className="stat-card"><span>Total produk</span><strong>{products.length}</strong><small>Produk terdaftar</small></div><div className="stat-card"><span>Stok menipis</span><strong className={lowStock.length ? 'danger-text' : ''}>{lowStock.length}</strong><small>Perlu restock</small></div><div className="stat-card"><span>Pesanan</span><strong>{orders.length}</strong><small>Semua status</small></div><div className="stat-card"><span>Pesanan pending</span><strong>{orders.filter(order => order.status === 'pending').length}</strong><small>Perlu diproses</small></div></div><div className="admin-grid"><div className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Inventory watch</p><h2>Stok menipis</h2></div><button onClick={() => setActiveTab('products')} className="text-link">Lihat semua</button></div>{lowStock.length === 0 ? <div className="empty-state">Semua stok masih aman.</div> : lowStock.slice(0, 5).map(product => <div className="stock-row" key={product.id}><div className="product-thumb">{product.gambar_url ? <img src={product.gambar_url} alt="" /> : <Box size={18} />}</div><div><strong>{product.nama}</strong><span>{product.merek || product.kategori}</span></div><b className="danger-text">{product.stok} tersisa</b></div>)}</div></div></section>}

{activeTab === 'products' && <section className="admin-panel product-management"><div className="panel-heading"><div><p className="eyebrow">Catalog</p><h2>Produk</h2><p className="panel-subtitle">Tap kartu untuk melihat detail dan mengelola produk.</p></div><button className="primary-button" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true) }}><Plus size={16} />Tambah produk</button></div><div className="toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari produk..." aria-label="Cari produk" /></div></div><div className="admin-product-grid">{filteredProducts.map(product => <button className="admin-product-card" key={product.id} onClick={() => setSelectedProduct(product)}><div className="admin-product-image">{product.gambar_url ? <img src={product.gambar_url} alt={product.nama} /> : <Box size={34} />}</div><div className="admin-product-copy"><div className="product-card-top"><span className="category-label">{product.kategori}</span><span className={`status-pill ${product.aktif ? 'active' : 'inactive'}`}>{product.aktif ? 'Aktif' : 'Nonaktif'}</span></div><h3>{product.nama}</h3><p>{product.merek || 'Tanpa merek'}</p><strong>{formatRupiah(product.harga)}</strong><small className={product.stok <= product.stok_minimal ? 'danger-text' : ''}>Stok {product.stok}</small></div></button>)}</div>{filteredProducts.length === 0 && <div className="empty-state">Belum ada produk yang cocok.</div>}</section>}

{activeTab === 'orders' && <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">Order management</p><h2>Semua pesanan</h2></div></div><div className="product-table-wrap"><table className="product-table"><thead><tr><th>Pelanggan</th><th>Produk</th><th>Jumlah</th><th>Total</th><th>Status</th><th>Ubah status</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td>{order.profiles?.nama || 'Pelanggan'}</td><td>{order.produk?.nama || 'Produk'}</td><td>{order.jumlah}</td><td>{formatRupiah(order.total)}</td><td><span className={`status-pill ${order.status}`}>{order.status}</span></td><td><select value={order.status} onChange={event => updateOrderStatus(order.id, event.target.value)} aria-label="Status pesanan"><option value="pending">Pending</option><option value="diproses">Diproses</option><option value="selesai">Selesai</option><option value="dibatalkan">Dibatalkan</option></select></td></tr>)}</tbody></table></div></section>}

{activeTab === 'customers' && <section className="admin-panel customer-management"><div className="panel-heading"><div><p className="eyebrow">Customer directory</p><h2>Semua pelanggan</h2></div></div><div className="toolbar"><div className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Cari nama atau email..." aria-label="Cari pelanggan" /></div></div><div className="product-table-wrap"><table className="product-table"><thead><tr><th>Pelanggan</th><th>Email</th><th>Status</th></tr></thead><tbody>{filteredCustomers.map(customer => <tr key={customer.id}><td>{customer.nama || 'Belum diisi'}</td><td>{customer.email || '—'}</td><td><span className="status-pill active">Aktif</span></td></tr>)}</tbody></table></div></section>}
</section>

{selectedProduct && <div className="product-detail-backdrop" role="presentation"><div className="product-detail-modal admin-product-detail" role="dialog" aria-modal="true" aria-labelledby="admin-product-title"><button className="detail-close" onClick={() => setSelectedProduct(null)} aria-label="Tutup detail"><X size={20} /></button><div className="detail-image">{selectedProduct.gambar_url ? <img src={selectedProduct.gambar_url} alt={selectedProduct.nama} /> : <Box size={58} />}</div><div className="detail-copy"><div className="product-card-top"><span className="category-label">{selectedProduct.kategori}</span><span className={`status-pill ${selectedProduct.aktif ? 'active' : 'inactive'}`}>{selectedProduct.aktif ? 'Aktif' : 'Nonaktif'}</span></div><h2 id="admin-product-title">{selectedProduct.nama}</h2><p className="detail-brand">{selectedProduct.merek || 'Tanpa merek'}</p><strong>{formatRupiah(selectedProduct.harga)}</strong><p>{selectedProduct.deskripsi || 'Belum ada deskripsi produk.'}</p><div className="detail-stock"><span>Stok saat ini <b>{selectedProduct.stok}</b></span><span>Stok minimal <b>{selectedProduct.stok_minimal}</b></span></div><div className="detail-actions"><button className="primary-button" onClick={() => editProduct(selectedProduct)}><Edit3 size={16} />Ubah</button><button className="secondary-button" onClick={() => toggleProduct(selectedProduct)}>{selectedProduct.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button><button className="danger-button" onClick={() => deleteProduct(selectedProduct)}><Trash2 size={16} />Hapus</button></div></div></div></div>}

{showForm && <div className="modal-backdrop" role="presentation"><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title"><div className="modal-heading"><div><p className="eyebrow">Catalog</p><h2 id="product-form-title">{editingId ? 'Edit produk' : 'Tambah produk'}</h2></div><button onClick={() => setShowForm(false)} aria-label="Tutup"><X size={19} /></button></div><form onSubmit={saveProduct} className="product-form"><div className="form-grid"><label>Nama produk<input required value={form.nama} onChange={event => updateForm('nama', event.target.value)} /></label><label>Merek<input value={form.merek} onChange={event => updateForm('merek', event.target.value)} /></label><label>Kategori<select value={form.kategori} onChange={event => updateForm('kategori', event.target.value)}><option>Aksesoris</option><option>Audio</option><option>Power</option><option>Gadget</option><option>Networking</option></select></label><label>Harga<span className="price-input"><span className="price-prefix">Rp</span><input inputMode="numeric" value={form.harga} placeholder="Contoh: 2199000" onChange={event => updateNumericField('harga', event.target.value)} /></span></label><label>Stok<input inputMode="numeric" value={form.stok} placeholder="Contoh: 25" onChange={event => updateNumericField('stok', event.target.value)} /></label><label>Stok minimal<input inputMode="numeric" value={form.stok_minimal} placeholder="Contoh: 5" onChange={event => updateNumericField('stok_minimal', event.target.value)} /></label></div><label>Deskripsi<textarea rows={3} value={form.deskripsi} onChange={event => updateForm('deskripsi', event.target.value)} /></label><div className="upload-field"><span>Foto produk</span><div className="upload-row"><label className="upload-button"><Upload size={16} />Pilih gambar<input type="file" accept="image/*" hidden onChange={event => { const file = event.target.files?.[0]; if (!file) return; const extension = file.name.split('.').pop() || 'jpg'; const path = `${crypto.randomUUID()}.${extension}`; supabase.storage.from('produk').upload(path, file, { upsert: false, contentType: file.type }).then(({ error: uploadError }) => { if (uploadError) setError(uploadError.message); else updateForm('gambar_url', supabase.storage.from('produk').getPublicUrl(path).data.publicUrl) }) }} /></label>{form.gambar_url ? <img src={form.gambar_url} alt="Preview produk" className="image-preview" /> : <span className="upload-hint"><ImagePlus size={16} />Belum ada gambar</span>}</div></div><label className="checkbox-label"><input type="checkbox" checked={form.aktif} onChange={event => updateForm('aktif', event.target.checked)} />Produk aktif dan tampil di katalog</label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Batal</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan produk'}</button></div></form></div></div>}
</main>
}

function StoreIcon() { return <ShoppingBag size={18} /> }
