import { useState, useEffect } from 'react'
import './App.css'
// import dbService from './services/database'

interface Post {
  id: string
  text: string
  likes: number
  timestamp?: Date
}

function App() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  // Initialize app without blocking UI
  useEffect(() => {
    const initializeApp = async () => {
      console.log('App initializing...')
      
      // For now, start in offline mode to ensure the app works
      setConnected(false)
      setPosts([])
      
      // TODO: Add database connection later
      // try {
      //   await dbService.connect()
      //   setConnected(true)
      //   const postsData = await dbService.getPosts()
      //   setPosts(postsData)
      // } catch (error) {
      //   console.error('Database connection failed:', error)
      //   setConnected(false)
      // }
      
      console.log('App initialization complete')
    }

    initializeApp()
  }, [])

  const addPost = async () => {
    if (newPost.trim()) {
      const postData = {
        id: Date.now().toString(),
        text: newPost,
        likes: 0,
        timestamp: new Date()
      }
      
      try {
        setLoading(true)
        
        // TODO: Add database save later
        // if (connected) {
        //   await dbService.createPost(postData)
        // }
        
        // Add to local state (new posts at top)
        setPosts([postData, ...posts])
        setNewPost('')
      } catch (error) {
        console.error('Error saving post:', error)
        // Still add to local state as fallback
        setPosts([postData, ...posts])
        setNewPost('')
      } finally {
        setLoading(false)
      }
    }
  }

  const likePost = async (postId: string) => {
    try {
      // TODO: Add database update later
      // if (connected) {
      //   await dbService.updatePostLikes(postId)
      // }
      
      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      ))
    } catch (error) {
      console.error('Error updating likes:', error)
      // Still update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      ))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      addPost()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    })
  }

  return (
    <div className="app">
      <header className="header">
        <h1>MiniTwitter</h1>
        <div className="connection-status">
          {loading ? (
            <span className="connecting">🟡 Ansluter...</span>
          ) : connected ? (
            <span className="connected">🟢 Ansluten till databas</span>
          ) : (
            <span className="disconnected">🔴 Offline läge</span>
          )}
        </div>
        <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
          Posts: {posts.length} | Loading: {loading.toString()} | Connected: {connected.toString()}
        </div>
      </header>
      
      <div className="post-form">
        <input
          type="text"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Vad händer?"
          className="post-input"
          maxLength={280}
          disabled={loading}
        />
        <button 
          onClick={addPost} 
          className="post-button"
          disabled={loading || !newPost.trim()}
        >
          {loading ? 'Skickar...' : 'Tweeta'}
        </button>
      </div>

      <div className="posts-list">
        {loading && posts.length === 0 ? (
          <p className="loading-state">Laddar tweets...</p>
        ) : posts.length === 0 ? (
          <p className="empty-state">Inga tweets ännu. Skriv den första!</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post">
              <div className="post-content">{post.text}</div>
              <div className="post-meta">
                <div className="post-time">
                  {post.timestamp && formatTime(post.timestamp)}
                </div>
                <button 
                  className="like-button"
                  onClick={() => likePost(post.id)}
                >
                  ❤️ {post.likes}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
