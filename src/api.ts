const VOICEVOX_API_URL = process.env.VOICEVOX_API_URL || "http://localhost:50021";

// VOICEVOXのスピーカー一覧を取得する関数
export async function fetchSpeakers() {
  const res = await fetch(`${VOICEVOX_API_URL}/speakers`);
  return await res.json();
}

// speak用の音声合成クエリを作成する関数
export async function createAudioQuery(text: string, speakerId: number) {
  const res = await fetch(`${VOICEVOX_API_URL}/audio_query?speaker=${speakerId}&text=${encodeURIComponent(text)}`, {
    method: "POST",
  });
  return await res.json();
}

// 音声合成してバッファを返す関数
export async function synthesizeVoice(query: any, speakerId: number) {
  const speedScale = process.env.SPEED_SCALE ? Number(process.env.SPEED_SCALE) : 1.2;
  query.speedScale = speedScale;
  const res = await fetch(`${VOICEVOX_API_URL}/synthesis?speaker=${speakerId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });
  const audioBlob = await res.blob();
  return Buffer.from(await audioBlob.arrayBuffer());
} 