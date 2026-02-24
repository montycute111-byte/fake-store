import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as api from "../lib/api";
import { FeedPost, PostComment } from "../types";

type Props = {
  post: FeedPost;
  onLike: () => void;
  onCommentsChanged?: () => Promise<void> | void;
};

export function PostCard({ post, onLike, onCommentsChanged }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);

  const byParent = useMemo(() => {
    return comments.reduce<Record<string, PostComment[]>>((acc, comment) => {
      const key = comment.parentId || "root";
      if (!acc[key]) acc[key] = [];
      acc[key].push(comment);
      return acc;
    }, {});
  }, [comments]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const list = await api.listComments(post.id);
      setComments(list);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next) {
      await loadComments();
    }
  };

  const submitComment = async () => {
    const body = draft.trim();
    if (!body) return;
    await api.createComment(post.id, {
      body,
      ...(replyTo?.id ? { parentId: replyTo.id } : {})
    });
    setDraft("");
    setReplyTo(null);
    await loadComments();
    await onCommentsChanged?.();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.username}>{post.author.username}</Text>
        <Text style={styles.time}>{new Date(post.createdAt).toLocaleDateString()}</Text>
      </View>
      <Image source={{ uri: post.mediaUrl }} style={styles.media} />
      <View style={styles.row}>
        <TouchableOpacity onPress={onLike} style={styles.actionBtn}>
          <Text>{post.viewer.liked ? "♥" : "♡"} {post.counts.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleComments}>
          <Text>{post.counts.comments} comments</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.caption}>{post.caption}</Text>
      {showComments ? (
        <View style={styles.commentsWrap}>
          {loadingComments ? <ActivityIndicator style={styles.loader} /> : null}
          {(byParent.root || []).map((comment) => (
            <View key={comment.id} style={styles.commentBlock}>
              <View style={styles.commentRow}>
                <Text style={styles.commentAuthor}>{comment.user.username}</Text>
                <Text>{comment.body}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyTo(comment)}>
                <Text style={styles.replyAction}>Reply</Text>
              </TouchableOpacity>
              {(byParent[comment.id] || []).map((reply) => (
                <View key={reply.id} style={styles.replyRow}>
                  <Text style={styles.commentAuthor}>{reply.user.username}</Text>
                  <Text>{reply.body}</Text>
                </View>
              ))}
            </View>
          ))}
          {replyTo ? (
            <View style={styles.replyTarget}>
              <Text style={styles.replyTargetText}>Replying to @{replyTo.user.username}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Text style={styles.replyAction}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? `Reply to @${replyTo.user.username}` : "Add a comment"}
              value={draft}
              onChangeText={setDraft}
            />
            <TouchableOpacity onPress={submitComment} style={styles.sendBtn}>
              <Text style={styles.sendText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8
  },
  username: {
    fontWeight: "700"
  },
  time: {
    color: "#6b7280",
    fontSize: 12
  },
  media: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    backgroundColor: "#e5e7eb"
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  caption: {
    marginTop: 8
  },
  commentsWrap: {
    marginTop: 10,
    gap: 8
  },
  loader: {
    marginVertical: 6
  },
  commentBlock: {
    gap: 2
  },
  commentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  commentAuthor: {
    fontWeight: "700"
  },
  replyAction: {
    color: "#2563eb",
    fontSize: 12
  },
  replyRow: {
    marginLeft: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  replyTarget: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  replyTargetText: {
    fontSize: 12,
    color: "#6b7280"
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  sendBtn: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  sendText: {
    color: "#fff",
    fontWeight: "700"
  }
});
