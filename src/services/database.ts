import { MongoClient, Db, Collection } from 'mongodb';

interface Post {
  _id?: string;
  id: string;
  text: string;
  likes: number;
  timestamp: Date;
}

class DatabaseService {
  private client: MongoClient;
  private db: Db | null = null;
  private posts: Collection<Post> | null = null;

  constructor() {
    const uri = 'mongodb://user:pass@vibe.53jvaty.mongodb.net/vibe1';
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db('vibe1');
      this.posts = this.db.collection<Post>('posts');
      console.log('Connected to MongoDB successfully');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async getPosts(): Promise<Post[]> {
    if (!this.posts) {
      throw new Error('Database not connected');
    }
    
    try {
      const posts = await this.posts
        .find()
        .sort({ timestamp: -1 }) // Most recent first
        .toArray();
      
      return posts.map(post => ({
        id: post.id,
        text: post.text,
        likes: post.likes,
        timestamp: post.timestamp
      }));
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async createPost(postData: { id: string; text: string; likes: number }): Promise<Post> {
    if (!this.posts) {
      throw new Error('Database not connected');
    }

    try {
      const post: Post = {
        ...postData,
        timestamp: new Date()
      };

      await this.posts.insertOne(post);
      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePostLikes(postId: string): Promise<void> {
    if (!this.posts) {
      throw new Error('Database not connected');
    }

    try {
      await this.posts.updateOne(
        { id: postId },
        { $inc: { likes: 1 } }
      );
    } catch (error) {
      console.error('Error updating likes:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dbService = new DatabaseService();

export default dbService;