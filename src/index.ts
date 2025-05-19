import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import { exec } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const VOICEVOX_API_URL = process.env.VOICEVOX_API_URL || "http://localhost:50021";

// Create an MCP server
const server = new McpServer({
  name: "voicevox-mcp",
  version: "1.0.0",
});

// Add an additional tool
server.tool("speakers",
  {},
  async () => {
    const res = await fetch(`${VOICEVOX_API_URL}/speakers`)
    const data = await res.json()
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
    }
  }
)
  
server.tool("speak",
  { text: z.string() },
  async ({ text }) => {
    const resolvedSpeakerId = Number(process.env.SPEAKER_ID);
    if (!resolvedSpeakerId || isNaN(resolvedSpeakerId)) {
      throw new Error("speaker_idが指定されてないか、環境変数SPEAKER_IDが不正です");
    }
    const res = await fetch(`${VOICEVOX_API_URL}/audio_query?speaker=${resolvedSpeakerId}&text=${text}`, {
      method: "POST",
    });
    const query = await res.json();
    const speedScale = process.env.SPEED_SCALE ? Number(process.env.SPEED_SCALE) : 1.2;
    query.speedScale = speedScale;

    const voiceRes = await fetch(`${VOICEVOX_API_URL}/synthesis?speaker=${resolvedSpeakerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    const audioBlob = await voiceRes.blob()
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    try {
      fs.writeFileSync("/tmp/voicevox.wav", buffer);
      console.log("ファイル保存成功");
    } catch (e) {
      console.error("ファイル保存エラー:", e);
    }

    // eslint-disable-next-line
    exec("afplay /tmp/voicevox.wav", (err) => {
      if (err) {
        console.error("音声再生エラー:", err);
      } else {
        console.log("Audio playback completed");
      }
    });

    return {
      content: [
        {
          type: "text",
          text: "OK",
        }
      ]
    };
  }
)


const transport = new StdioServerTransport();
await server.connect(transport);