import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Package, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

type Product = { id: string; nama: string; merek: string; kategori: string; deskripsi: string; harga: number; stok: number; gambar_url: string | null }

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('produk').select('id,nama,merek,kategori,deskripsi,harga,stok,gambar_url').eq('id', id).eq('aktif', true).single<Product>()
  if (!product) notFound()

  return (
    <main className="product-page-shell">
      <div className="product-page-topbar"><Link href="/" className="back-link"><ArrowLeft size={18} /> Kembali ke Katalog</Link><span className="eyebrow">RIS GADGETKU</span></div>
      <article className="product-page-card">
        <div className="product-page-image-wrap">{product.gambar_url ? <img src={product.gambar_url} alt={product.nama} className="product-page-image" /> : <div className="product-page-placeholder"><Package size={42} /></div>}</div>
        <div className="product-page-copy">
          <p className="eyebrow blue">{product.kategori}</p>
          <h1>{product.nama}</h1>
          <p className="product-page-brand">{product.merek || 'Tanpa merek'}</p>
          <p className="product-page-price">{formatRupiah(product.harga)}</p>
          <div className="product-page-stock">{product.stok > 0 ? <><CheckCircle2 size={16} /> Stok tersedia: {product.stok}</> : 'Stok habis'}</div>
          <div className="product-page-description"><h2>Deskripsi Produk</h2><p>{product.deskripsi || 'Belum ada deskripsi produk.'}</p></div>
        </div>
        <div className="product-page-footer"><Link href={product.stok > 0 ? `/pesan/${product.id}` : '#'} aria-disabled={product.stok <= 0} className={`primary-button product-page-order ${product.stok <= 0 ? 'disabled' : ''}`}><ShoppingCart size={18} /> {product.stok > 0 ? 'Pesan' : 'Stok Habis'}</Link></div>
      </article>
    </main>
  )
}
