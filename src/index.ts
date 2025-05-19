import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import { exec } from "child_process";

// Create an MCP server
const server = new McpServer({
  name: "voicevox-mcp",
  version: "1.0.0",
});

// Add an additional tool
server.tool("speakers",
  {},
  async () => {
    const res = await fetch("http://localhost:50021/speakers")
    const data = await res.json()
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
    }
  }
)
  
server.tool("speak",
  { speaker_id: z.number(), text: z.string() },
  async ({ speaker_id, text }) => {
    const res = await fetch(`http://localhost:50021/audio_query?speaker=${speaker_id}&text=${text}`, {
      method: "POST",
    });
    const query = await res.json();
    query.speedScale = 1.2

    const voiceRes = await fetch(`http://localhost:50021/synthesis?speaker=${speaker_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    });

    // バイナリデータをBase64に変換
    const audioBlob = await voiceRes.blob()
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    // const arrayBuffer = await audioBlob.arrayBuffer();
    try {
      fs.writeFileSync("/tmp/voicevox.wav", buffer);
      console.log("ファイル保存成功");
    } catch (e) {
      console.error("ファイル保存エラー:", e);
    }

    const base64Audio = buffer.toString("base64");

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
          text: JSON.stringify(query),
          // mimeType: "audio/wav"
        }
      ]
    };
  }
)


// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);