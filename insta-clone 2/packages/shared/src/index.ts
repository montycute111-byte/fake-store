export type JwtPayload = {
  userId: string;
  email: string;
  username: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    isPrivate: boolean;
  };
};

export type FeedPost = {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  createdAt: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  counts: {
    likes: number;
    comments: number;
  };
  viewer: {
    liked: boolean;
    saved: boolean;
  };
};
