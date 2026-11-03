'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Package, ShoppingCart } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
type Product = { id: string; nama: string; merek: string; harga: number; stok: number; gambar_url: string | null }

export default function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { (async () => { const { data } = await supabase.from('produk').select('id,nama,merek,harga,stok,gambar_url').eq('id', id).eq('aktif', true).single<Product>(); setProduct(data); setLoading(false) })() }, [id, supabase])
  async function confirmOrder() {
    if (!product || product.stok < 1) { setError('Stok produk sudah habis.'); return }
    setSaving(true); setError('')
    const { error: rpcError } = await supabase.rpc('create_order', { p_product_id: product.id, p_quantity: 1 })
    if (rpcError) { setError(rpcError.message.includes('Stok produk tidak mencukupi') ? 'Stok produk tidak mencukupi.' : rpcError.message); setSaving(false); return }
    router.push('/')
  }
  if (loading) return <main className="auth-page"><div className="auth-card"><p>Memuat produk...</p></div></main>
  if (!product) return <main className="auth-page"><div className="auth-card"><h1>Produk tidak ditemukan</h1><Link href="/" className="primary-button">Kembali ke Katalog</Link></div></main>
  return <main className="order-page-shell"><div className="order-page-topbar"><Link href={`/produk/${product.id}`} className="back-link"><ArrowLeft size={18} /> Kembali</Link><span className="eyebrow">RIS GADGETKU</span></div><section className="order-page-card"><div className="order-product-summary">{product.gambar_url ? <img src={product.gambar_url} alt={product.nama} /> : <div className="order-product-placeholder"><Package size={28} /></div>}<div><p className="eyebrow blue">Konfirmasi Pesanan</p><h1>{product.nama}</h1><p>{product.merek || 'Tanpa merek'}</p><strong>{formatRupiah(product.harga)}</strong></div></div><div className="order-page-total"><span>Jumlah</span><strong>1</strong><span>Total</span><strong>{formatRupiah(product.harga)}</strong></div>{error && <p className="form-error">{error}</p>}<button className="primary-button order-confirm-button" onClick={confirmOrder} disabled={saving}><ShoppingCart size={18} /> {saving ? 'Menyimpan...' : 'Konfirmasi Pesanan'}</button></section></main>
}
