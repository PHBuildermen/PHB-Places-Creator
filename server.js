import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const logs = [];

function addLog(message, type = "info") {
  const entry = {
    time: new Date().toISOString(),
    message,
    type
  };

  logs.push(entry);

  if (logs.length > 250) {
    logs.shift();
  }

  console.log(`[${type.toUpperCase()}] ${message}`);
}

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "PHBuilderman Roblox Publisher"
  });
});

/*
|--------------------------------------------------------------------------
| Logs
|--------------------------------------------------------------------------
*/

app.get("/api/logs", (req, res) => {
  res.json(logs);
});

/*
|--------------------------------------------------------------------------
| Publish Place
|--------------------------------------------------------------------------
*/

app.post(
  "/api/publish",
  upload.single("placeFile"),
  async (req, res) => {
    try {
      const {
        universeId,
        placeId,
        versionType = "Published"
      } = req.body;

      if (!universeId) {
        return res.status(400).json({
          error: "Universe ID is required."
        });
      }

      if (!placeId) {
        return res.status(400).json({
          error: "Place ID is required."
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Please upload an .rbxl or .rbxlx file."
        });
      }

      /*
       * IMPORTANT:
       * The API key should be stored as an environment variable.
       *
       * Example:
       * ROBLOX_API_KEY=your_key_here
       */

      const apiKey = process.env.ROBLOX_API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          error:
            "ROBLOX_API_KEY is not configured on the server."
        });
      }

      const filename =
        req.file.originalname.toLowerCase();

      let contentType =
        "application/octet-stream";

      if (filename.endsWith(".rbxlx")) {
        contentType = "application/xml";
      }

      const url =
        `https://apis.roblox.com/universes/v1/` +
        `${encodeURIComponent(universeId)}/places/` +
        `${encodeURIComponent(placeId)}/versions` +
        `?versionType=${encodeURIComponent(versionType)}`;

      addLog(
        `Publishing ${req.file.originalname}...`
      );

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "x-api-key": apiKey,
          "Content-Type": contentType
        },

        body: req.file.buffer
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          raw: text
        };
      }

      if (!response.ok) {
        addLog(
          `Roblox returned HTTP ${response.status}.`,
          "error"
        );

        return res.status(response.status).json({
          error:
            data?.message ||
            data?.error ||
            data?.raw ||
            "Roblox rejected the request.",

          details: data
        });
      }

      addLog(
        `Publish successful. Version: ${
          data.versionNumber ?? "unknown"
        }`,
        "success"
      );

      return res.json({
        ok: true,

        versionNumber:
          data.versionNumber ?? null,

        response: data
      });

    } catch (error) {
      console.error(error);

      addLog(
        error.message || "Unknown server error.",
        "error"
      );

      return res.status(500).json({
        error: "Server error.",
        details: error.message
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  addLog(
    `PHBuilderman Publisher running on port ${PORT}.`,
    "success"
  );
});
