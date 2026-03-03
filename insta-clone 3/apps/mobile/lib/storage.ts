import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_KEY = "insta_access_token";
const REFRESH_KEY = "insta_refresh_token";

export async function saveTokens(accessToken: string, refreshToken: string) {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, accessToken],
    [REFRESH_KEY, refreshToken]
  ]);
}

export async function getTokens() {
  const [accessToken, refreshToken] = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  return {
    accessToken: accessToken[1],
    refreshToken: refreshToken[1]
  };
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
