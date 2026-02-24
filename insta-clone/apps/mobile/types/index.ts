export type User = {
  id: string;
  email?: string;
  username: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  petName?: string | null;
  petBio?: string | null;
  petAvatarUrl?: string | null;
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

export type PostComment = {
  id: string;
  postId: string;
  userId: string;
  body: string;
  parentId?: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
};
