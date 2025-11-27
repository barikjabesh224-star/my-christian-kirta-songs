import React, {useEffect, useState} from 'react'
import { supabase } from './supabaseClient'

export default function App(){
  const [songs,setSongs] = useState([])
  const [user,setUser] = useState(null)
  const [admin,setAdmin] = useState(false)
  const [editing, setEditing] = useState(null)
  const [title,setTitle] = useState('')
  const [lyrics,setLyrics] = useState('')

  async function fetchSongs(){
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('public', true)
      .order('updated_at', { ascending: false })
    setSongs(data || [])
  }

  useEffect(()=>{
    fetchSongs()
    supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) checkAdmin(u.id)
    })
  },[])

  async function checkAdmin(userId){
    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    setAdmin(!!data)
  }

  async function signIn(email,password){
    await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut(){
    await supabase.auth.signOut()
    setUser(null)
    setAdmin(false)
  }

  async function createSong(){
    const { data } = await supabase
      .from('songs')
      .insert([{ title:'Untitled', lyrics:'', public:true }])
      .select()
      .single()

    setEditing(data.id)
    setTitle(data.title)
    setLyrics(data.lyrics)
  }

  async function saveSong(){
    await supabase
      .from('songs')
      .update({ title, lyrics, updated_at: new Date().toISOString() })
      .eq('id', editing)

    setEditing(null)
    setTitle('')
    setLyrics('')
    fetchSongs()
  }

  async function delSong(id){
    if (!confirm('Delete this song?')) return
    await supabase.from('songs').delete().eq('id', id)
    fetchSongs()
  }

  return (
    <div className="container">
      <h1>My Christian Kirta Songs</h1>

      {/* Login Section */}
      {user ? (
        <div>
          Logged in as Admin
          <button onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <AuthForm onSignIn={signIn} />
      )}

      {/* Public Songs */}
      <div className="card">
        <h2>All Songs</h2>
        {songs.map(s => (
          <div className="song" key={s.id}>
            <strong>{s.title}</strong>
            <pre>{s.lyrics}</pre>
            {admin && (
              <>
                <button onClick={()=>{ setEditing(s.id); setTitle(s.title); setLyrics(s.lyrics); }}>Edit</button>
                <button onClick={()=>delSong(s.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Admin Editor */}
      {admin && (
        <div className="card">
          <h2>Admin Panel</h2>

          <button onClick={createSong}>New Song</button>

          {editing && (
            <>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" />
              <textarea rows={5} value={lyrics} onChange={e=>setLyrics(e.target.value)} placeholder="Lyrics"></textarea>
              <button onClick={saveSong}>Save</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AuthForm({onSignIn}){
  const [email,setEmail] = useState('')
  const [pw,setPw] = useState('')
  return (
    <div>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
      <button onClick={()=>onSignIn(email,pw)}>Login</button>
    </div>
  )
}
