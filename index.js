import express, { json } from "express";
import youtubedl from "youtube-dl-exec";
import cors from "cors";
import { existsSync } from "fs";
import path from "path";
const app = express();
const port = 3001;

app.use(cors());
app.use(json());

// Rota para baixar o vídeo

app.post("/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL é obrigatória." });
  }

  try {
    // 1. Obtém informações do vídeo
    const info = await youtubedl(url, { dumpSingleJson: true });
    const safeTitle = info.title.replace(/[^\w\s]/gi, "").replace(/\s+/g, "_");

    const tempBase = `videos/${safeTitle}`; // sem extensão
    const downloadedFile = `${tempBase}.webm`; // arquivo de vídeo + áudio em .webm

    // 2. Baixar vídeo + áudio juntos no formato .webm
    await youtubedl(url, {
      format: `bestvideo[height<=1080]+bestaudio/best`, // vídeo + áudio combinados
      output: `${tempBase}.%(ext)s`, // nome do arquivo com a extensão .webm
    });

    // 3. Verifique se o arquivo foi baixado corretamente
    if (!existsSync(downloadedFile)) {
      throw new Error("Arquivo de vídeo + áudio não encontrado.");
    }

    // 4. Enviar o arquivo diretamente na resposta
    res.sendFile(path.resolve(downloadedFile), (err) => {
      if (err) {
        console.error("Erro ao enviar o arquivo:", err);
        res.status(500).json({
          error: "Erro ao enviar o vídeo.",
          details: err.toString(),
        });
      } else {
        console.log("Arquivo enviado com sucesso.");
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Erro ao baixar o vídeo.",
      details: error.toString(),
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
