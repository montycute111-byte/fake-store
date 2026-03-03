import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FeedPost } from "../types";

type Props = {
  post: FeedPost;
  onLike: () => void;
};

export function PostCard({ post, onLike }: Props) {
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
        <Text>{post.counts.comments} comments</Text>
      </View>
      <Text style={styles.caption}>{post.caption}</Text>
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
  }
});
