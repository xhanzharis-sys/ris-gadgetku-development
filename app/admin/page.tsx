import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')
  const { data: products } = await supabase.from('produk').select('id,nama,kategori,harga,stok,aktif').order('created_at', { ascending: false })
  return <main className="page-content admin-page"><div className="welcome-row"><div><p className="eyebrow blue">ADMINISTRATOR</p><h1>Kelola Produk</h1><p className="subtext">Tambah, ubah, dan hapus produk dari katalog.</p></div></div><div className="panel table-panel"><div className="panel-heading"><div><h2>Daftar produk</h2><span className="muted-label">{products?.length ?? 0} produk terdaftar</span></div></div>{products && products.length > 0 ? <div className="admin-product-list">{products.map(product => <div className="admin-product-row" key={product.id}><div><strong>{product.nama}</strong><span>{product.kategori} · Rp{Number(product.harga).toLocaleString('id-ID')}</span></div><span className="stock-pill">{product.stok} stok</span></div>)}</div> : <p className="subtext">Belum ada produk. Tambahkan melalui operasi admin berikutnya.</p>}</div></main>
}
