import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { PostCard } from "./components/PostCard";
import * as api from "./lib/api";
import { FeedPost } from "./types";

type Tab = "Home" | "Search" | "Create" | "Profile";

function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("demo@insta.dev");
  const [password, setPassword] = useState("password123");
  const [username, setUsername] = useState("demo_user");
  const [name, setName] = useState("Demo User");
  const [error, setError] = useState("");

  const onSubmit = async () => {
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({ email, username, password, name });
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Authentication failed");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>CatSnap</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
      {mode === "signup" ? (
        <>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" autoCapitalize="none" />
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
        </>
      ) : null}
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryBtnText}>{mode === "login" ? "Log in" : "Sign up"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setMode(mode === "login" ? "signup" : "login")}>
        <Text style={styles.link}>{mode === "login" ? "Need an account? Sign up" : "Already have one? Log in"}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function HomeTab() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await api.getFeed();
    setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onLike={async () => {
            await api.toggleLike(item.id);
            await load();
          }}
          onCommentsChanged={load}
        />
      )}
      contentContainerStyle={styles.list}
    />
  );
}

function SearchTab() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>([]);

  const load = async () => {
    const data = await api.getExplore();
    setPosts(data);
  };

  useEffect(() => {
    load().catch(() => setPosts([]));
  }, []);

  const filtered = posts.filter(
    (p) => p.caption.toLowerCase().includes(query.toLowerCase()) || p.author.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.content}>
      <TextInput style={styles.input} placeholder="Search by caption or username" value={query} onChangeText={setQuery} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={async () => {
              await api.toggleLike(item.id);
              await load();
            }}
            onCommentsChanged={load}
          />
        )}
      />
    </View>
  );
}

function CreateTab() {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("https://placekitten.com/1080/1080");
  const [status, setStatus] = useState("");

  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>Post Cat Photo</Text>
      <Text style={styles.note}>Only cat pictures are allowed.</Text>
      <TextInput style={styles.input} placeholder="Caption" value={caption} onChangeText={setCaption} />
      <TextInput style={styles.input} placeholder="Media URL" value={mediaUrl} onChangeText={setMediaUrl} autoCapitalize="none" />
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={async () => {
          try {
            await api.createPost({ caption, mediaUrl, mediaType: "IMAGE" });
            setCaption("");
            setMediaUrl("https://placekitten.com/1080/1080");
            setStatus("Cat photo posted");
          } catch (e: any) {
            setStatus(e?.response?.data?.error || "Failed to create post");
          }
        }}
      >
        <Text style={styles.primaryBtnText}>Publish</Text>
      </TouchableOpacity>
      {status ? <Text style={styles.link}>{status}</Text> : null}
    </View>
  );
}

function ProfileTab() {
  const { user, refreshMe, logout } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [name, setName] = useState(user?.name || "");
  const [petName, setPetName] = useState(user?.petName || "");
  const [petBio, setPetBio] = useState(user?.petBio || "");
  const [petAvatarUrl, setPetAvatarUrl] = useState(user?.petAvatarUrl || "");

  useEffect(() => {
    setBio(user?.bio || "");
    setName(user?.name || "");
    setPetName(user?.petName || "");
    setPetBio(user?.petBio || "");
    setPetAvatarUrl(user?.petAvatarUrl || "");
  }, [user?.bio, user?.name, user?.petName, user?.petBio, user?.petAvatarUrl]);

  return (
    <View style={styles.content}>
      <Text style={styles.sectionTitle}>@{user?.username}</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
      <TextInput style={styles.input} value={bio} onChangeText={setBio} placeholder="Bio" />
      <Text style={styles.sectionSubTitle}>Pet Profile</Text>
      <TextInput style={styles.input} value={petName} onChangeText={setPetName} placeholder="Pet name" />
      <TextInput style={styles.input} value={petBio} onChangeText={setPetBio} placeholder="Pet bio" />
      <TextInput
        style={styles.input}
        value={petAvatarUrl}
        onChangeText={setPetAvatarUrl}
        placeholder="Pet avatar URL"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={async () => {
          await api.updateProfile({ name, bio, petName, petBio, petAvatarUrl });
          await refreshMe();
        }}
      >
        <Text style={styles.primaryBtnText}>Save Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: "#111827" }]}
        onPress={async () => {
          await logout();
        }}
      >
        <Text style={styles.primaryBtnText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppShell() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("Home");

  if (loading) {
    return (
      <SafeAreaView style={styles.screenCenter}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Text style={styles.title}>CatSnap</Text>
      </View>
      <View style={styles.body}>
        {tab === "Home" ? <HomeTab /> : null}
        {tab === "Search" ? <SearchTab /> : null}
        {tab === "Create" ? <CreateTab /> : null}
        {tab === "Profile" ? <ProfileTab /> : null}
      </View>
      <View style={styles.tabBar}>
        {(["Home", "Search", "Create", "Profile"] as Tab[]).map((item) => (
          <TouchableOpacity key={item} style={styles.tabBtn} onPress={() => setTab(item)}>
            <Text style={[styles.tabText, tab === item && styles.tabActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f4f6"
  },
  screenCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb"
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  body: {
    flex: 1
  },
  content: {
    flex: 1,
    padding: 16
  },
  list: {
    padding: 12
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },
  primaryBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700"
  },
  link: {
    color: "#374151",
    textAlign: "center",
    marginTop: 4
  },
  error: {
    color: "#dc2626",
    marginBottom: 10
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff"
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12
  },
  tabText: {
    color: "#6b7280"
  },
  tabActive: {
    color: "#111827",
    fontWeight: "700"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 6
  },
  note: {
    color: "#374151",
    marginBottom: 10
  }
});
