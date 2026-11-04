'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Package, ShoppingCart } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
type Product = { id: string; nama: string; merek: string; harga: number; stok: number; warna: string[]; gambar_url: string | null }

export default function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { (async () => { const { data } = await supabase.from('produk').select('id,nama,merek,harga,stok,warna,gambar_url').eq('id', id).eq('aktif', true).single<Product>(); setProduct(data); setLoading(false) })() }, [id, supabase])
  async function confirmOrder() {
    if (!product || product.stok < 1) { setError('Stok produk sudah habis.'); return }
    if (quantity < 1 || quantity > product.stok) { setError(`Jumlah harus antara 1 dan ${product.stok}.`); return }
    setSaving(true); setError('')
    const { error: rpcError } = await supabase.rpc('create_order', { p_product_id: product.id, p_quantity: quantity })
    if (rpcError) { setError(rpcError.message.includes('Stok produk tidak mencukupi') ? 'Stok produk tidak mencukupi.' : rpcError.message); setSaving(false); return }
    router.push('/')
  }
  if (loading) return <main className="auth-page"><div className="auth-card"><p>Memuat produk...</p></div></main>
  if (!product) return <main className="auth-page"><div className="auth-card"><h1>Produk tidak ditemukan</h1><Link href="/" className="primary-button">Kembali ke Katalog</Link></div></main>
  return <main className="order-page-shell"><div className="order-page-topbar"><Link href={`/produk/${product.id}`} className="back-link"><ArrowLeft size={18} /> Kembali</Link><span className="eyebrow">RIS GADGETKU</span></div><section className="order-page-card"><div className="order-product-summary">{product.gambar_url ? <img src={product.gambar_url} alt={product.nama} /> : <div className="order-product-placeholder"><Package size={28} /></div>}<div><p className="eyebrow blue">Konfirmasi Pesanan</p><h1>{product.nama}</h1><p>{product.merek || 'Tanpa merek'}</p><strong>{formatRupiah(product.harga)}</strong></div></div>{product.warna.length > 0 && <fieldset className="order-color-options"><legend>Warna tersedia</legend><div className="color-choice-grid">{product.warna.map(color => <label className="color-choice" key={color}><input type="radio" name="warna" value={color} checked={selectedColor === color} onChange={() => setSelectedColor(color)} /><span>{color}</span></label>)}</div></fieldset>}<div className="order-quantity-stepper"><span className="order-stepper-label">Jumlah pesanan</span><div className="order-stepper-controls"><button type="button" className="quantity-button" aria-label="Kurangi jumlah" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity <= 1 || saving}>−</button><input aria-label="Jumlah pesanan" inputMode="numeric" min={1} max={product.stok} value={quantity} onChange={(event) => { const digits = event.target.value.replace(/\D/g, ''); const next = digits ? Number(digits) : 1; setQuantity(Math.min(product.stok, Math.max(1, next))) }} disabled={saving} /><button type="button" className="quantity-button" aria-label="Tambah jumlah" onClick={() => setQuantity((current) => Math.min(product.stok, current + 1))} disabled={quantity >= product.stok || saving}>+</button></div><span className="order-stock-hint">Maksimal {product.stok} unit</span></div><div className="order-page-total"><span>Total harga</span><strong>{formatRupiah(product.harga * quantity)}</strong></div>{error && <p className="form-error">{error}</p>}<button className="primary-button order-confirm-button" onClick={confirmOrder} disabled={saving}><ShoppingCart size={18} /> {saving ? 'Menyimpan...' : 'Konfirmasi Pesanan'}</button></section></main>
}
