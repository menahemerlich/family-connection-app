import Constants from 'expo-constants';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const LIVEKIT_URL: string =
  (Constants.expoConfig?.extra?.livekit as { url?: string } | undefined)?.url ??
  'wss://your-project.livekit.cloud';

export type LiveKitTokenRequest = {
  familyId: string;
  callId: string;
  identity: string;
  name?: string;
};

export type LiveKitTokenResponse = {
  token: string;
  url: string;
};

const callableToken = httpsCallable<LiveKitTokenRequest, LiveKitTokenResponse>(
  functions,
  'livekitToken',
);

/**
 * Requests a LiveKit access token from the Cloud Function for a given family/call.
 */
export async function fetchLiveKitToken(req: LiveKitTokenRequest): Promise<LiveKitTokenResponse> {
  const result = await callableToken(req);
  return result.data;
}
