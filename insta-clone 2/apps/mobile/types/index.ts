export type User = {
  id: string;
  email?: string;
  username: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isPrivate?: boolean;
};

export type FeedPost = {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  createdAt: string;
  author: User;
  counts: {
    likes: number;
    comments: number;
  };
  viewer: {
    liked: boolean;
    saved: boolean;
  };
};

export type Conversation = {
  id: string;
  users: Array<{ user: User }>;
  messages: Array<{
    id: string;
    body?: string;
    createdAt: string;
  }>;
};
