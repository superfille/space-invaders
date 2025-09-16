import { useState } from 'react'
import './App.css'

interface Post {
  id: string
  text: string
  likes: number
  timestamp: Date
}

function App() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')

  const addPost = () => {
    if (newPost.trim()) {
      const post: Post = {
        id: Date.now().toString(),
        text: newPost,
        likes: 0,
        timestamp: new Date()
      }
      
      // Add to local state (new posts at top)
      setPosts([post, ...posts])
      setNewPost('')
    }
  }

  const likePost = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
          <span className="disconnected">🔴 Offline läge (test version)</span>
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
        />
        <button 
          onClick={addPost} 
          className="post-button"
          disabled={!newPost.trim()}
        >
          Tweeta
        </button>
      </div>

      <div className="posts-list">
        {posts.length === 0 ? (
          <p className="empty-state">Inga tweets ännu. Skriv den första!</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post">
              <div className="post-content">{post.text}</div>
              <div className="post-meta">
                <div className="post-time">
                  {formatTime(post.timestamp)}
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