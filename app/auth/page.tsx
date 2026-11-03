'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage('')
    const supabase = createClient()
    const result = mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { nama }, emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } })
    if (result.error) setMessage('Email atau kata sandi tidak valid. Periksa kembali data kamu.')
    else setMessage(mode === 'login' ? 'Berhasil masuk.' : 'Cek email kamu untuk konfirmasi akun.')
    if (mode === 'login' && !result.error) window.location.href = '/'
  }
  return <main className="auth-page"><div className="auth-card"><p className="eyebrow blue">RIS GADGETKU</p><h1>{mode === 'login' ? 'Masuk ke akunmu' : 'Buat akun baru'}</h1><p className="subtext">Kelola pesanan dan katalog gadget dengan aman.</p><form onSubmit={submit} className="auth-form">{mode === 'register' && <label>Nama<input value={nama} onChange={e => setNama(e.target.value)} required /></label>}<label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Kata sandi<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required /></label><button className="primary-button" type="submit">{mode === 'login' ? 'Masuk' : 'Daftar'}</button></form>{message && <p className="form-message">{message}</p>}<button className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button></div></main>
}
