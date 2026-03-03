import axios from "axios";
import { getTokens, saveTokens, clearTokens } from "./storage";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api"
});

api.interceptors.request.use(async (config) => {
  const tokens = await getTokens();
  if (tokens.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

export async function signup(payload: {
  email: string;
  username: string;
  password: string;
  name: string;
}) {
  const res = await api.post("/auth/signup", payload);
  await saveTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

export async function login(payload: { email: string; password: string }) {
  const res = await api.post("/auth/login", payload);
  await saveTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

export async function logout() {
  const tokens = await getTokens();
  if (tokens.refreshToken) {
    await api.post("/auth/logout", { refreshToken: tokens.refreshToken });
  }
  await clearTokens();
}

export async function me() {
  const res = await api.get("/auth/me");
  return res.data;
}

export async function getFeed() {
  const res = await api.get("/posts/feed");
  return res.data.data;
}

export async function getExplore() {
  const res = await api.get("/posts/explore");
  return res.data.data;
}

export async function toggleLike(postId: string) {
  const res = await api.post(`/posts/${postId}/likes`);
  return res.data;
}

export async function createPost(payload: {
  caption: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
}) {
  const res = await api.post("/posts", payload);
  return res.data;
}

export async function listConversations() {
  const res = await api.get("/messages/conversations");
  return res.data;
}

export async function startConversation(participantId: string) {
  const res = await api.post("/messages/conversations", { participantId });
  return res.data;
}

export async function sendMessage(conversationId: string, body: string) {
  const res = await api.post(`/messages/conversations/${conversationId}/messages`, { body });
  return res.data;
}

export async function getNotifications() {
  const res = await api.get("/notifications");
  return res.data;
}

export async function updateProfile(payload: {
  name?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isPrivate?: boolean;
}) {
  const res = await api.patch("/profiles/me", payload);
  return res.data;
}

export default api;
