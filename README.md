# voicevox-mcp

このプロジェクトは、VOICEVOXエンジンと連携して音声合成やスピーカー情報の取得ができるMCP（Model Context Protocol）サーバーです。TypeScriptで実装されており、MCP SDKを利用しています。

# 機能
- VOICEVOXエンジンのスピーカー情報取得（/speakers）
- 指定したスピーカーでテキストを音声合成し、ローカルで再生（/speak）
  - Macのみ対応

# セットアップ

## VOICEVOXエンジンの起動（Docker推奨）

```sh
docker compose up -d
```

これで localhost:50021 でVOICEVOXエンジンが起動します。


## 依存パッケージのインストール & ビルド

```sh
npm install
npm run build 
```



# 使い方

MCPクライアントから speakers ツールでスピーカー一覧を取得できます。

## Cursorの設定例


```.cursor/mcp.json
{
  "mcpServers": {
    "voicevox-mcp": {
      "command": "node",
      "args": ["${Path to Repository}/dist/index.js"],
      "env": {
        "SPEAKER_ID": 8
      }
    }
  }
}
```



speak ツールでテキストを音声合成し、ローカルで再生できます（afplayコマンドを使用しているため、Mac環境推奨）。

主な依存パッケージ

- `@modelcontextprotocol/sdk`
- `zod`
- `typescript`


# 注意事項

- 今後改善
  - VOICEVOXエンジンが localhost:50021 で動作していないと音声合成は利用できません。
  - Mac以外の環境では afplay の部分を適宜変更してください。


# ライセンス

MIT License