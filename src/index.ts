import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import { exec } from "child_process";
import dotenv from "dotenv";
import { fetchSpeakers, createAudioQuery, synthesizeVoice } from "./api.js";
dotenv.config();


// Create an MCP server
const server = new McpServer({
  name: "voicevox-mcp",
  version: "1.0.0",
});

// ファイル保存用関数
function saveAudioFile(buffer: Buffer, filePath: string) {
  try {
    fs.writeFileSync(filePath, buffer);
    console.log("ファイル保存成功");
  } catch (e) {
    console.error("ファイル保存エラー:", e);
  }
}

// 音声再生用関数
function playAudio(filePath: string) {
  exec(`afplay ${filePath}`, (err) => {
    if (err) {
      console.error("音声再生エラー:", err);
    } else {
      console.log("Audio playback completed");
    }
  });
}

// Add an additional tool
server.tool("speakers",
  {},
  async () => {
    const data = await fetchSpeakers();
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
    const query = await createAudioQuery(text, resolvedSpeakerId);
    const buffer = await synthesizeVoice(query, resolvedSpeakerId);
    const filePath = "/tmp/voicevox.wav";
    saveAudioFile(buffer, filePath);
    playAudio(filePath);
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