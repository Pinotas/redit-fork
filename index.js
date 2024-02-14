const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

app.use(express.json());

const url = process.env.DB_URL;
const client = new MongoClient(url);

const dbName = "Database1";

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor está em execução na porta ${port}`);
});

async function start(app) {
  await client.connect();
  console.log("Conectado com sucesso ao servidor");
  const db = client.db(dbName);
  const collection = db.collection("documents");

  app.listen(process.env.PORT, () => {
    console.log("Servidor está em execução (Express)");
  });
}

app.post("/comunidades", async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome || !descricao) {
      return res
        .status(400)
        .json({ mensagem: "Nome e descrição são obrigatórios" });
    }

    const collection = client.db(dbName).collection("comunidades");

    const novaComunidade = {
      nome,
      descricao,
      dataCriacao: new Date(),
    };

    const resultado = await collection.insertOne(novaComunidade);
    res.status(201).json({
      mensagem: "Comunidade criada com sucesso",
      id: resultado.insertedId,
    });
  } catch (error) {
    console.error("Erro ao criar a comunidade:", error);
    res.status(500).json({ mensagem: "Erro ao criar a comunidade" });
  }
});

app.post("/comunidades/:comunidadeId/posts", async (req, res) => {
  try {
    const { comunidadeId } = req.params;
    const { titulo, conteudo } = req.body;

    if (!titulo || !conteudo) {
      return res
        .status(400)
        .json({ mensagem: "Título e conteúdo são obrigatórios" });
    }

    const collection = client.db(dbName).collection("posts");

    const novoPost = {
      comunidadeId,
      titulo,
      conteudo,
      dataCriacao: new Date(),
    };

    const resultado = await collection.insertOne(novoPost);
    res
      .status(201)
      .json({ mensagem: "Post criado com sucesso", id: resultado.insertedId });
  } catch (error) {
    console.error("Erro ao criar o post:", error);
    res.status(500).json({ mensagem: "Erro ao criar o post" });
  }
});

app.get("/comunidades/:comunidadeId/posts", async (req, res) => {
  try {
    const { comunidadeId } = req.params;
    const collection = client.db(dbName).collection("posts");
    const posts = await collection.find({ comunidadeId }).toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Erro ao obter os posts:", error);
    res.status(500).json({ mensagem: "Erro ao obter os posts" });
  }
});

app.get(
  "/comunidades/:comunidadeId/posts/:postId/comentarios",
  async (req, res) => {
    try {
      const { comunidadeId, postId } = req.params;
      const collection = client.db(dbName).collection("comentarios");
      const comentarios = await collection.find({ postId }).toArray();
      if (comentarios.length === 0) {
        comentarios.push({
          postId: postId,
          texto: "Test Post",
          autor: "yes",
        });
      }
      res.status(200).json(comentarios);
    } catch (error) {
      console.error("Erro ao obter os comentários:", error);
      res.status(500).json({ mensagem: "Erro ao obter os comentários" });
    }
  }
);

app.put("/comunidades/:comunidadeId/posts/:postId", async (req, res) => {
  try {
    const { comunidadeId, postId } = req.params;
    const { titulo, conteudo } = req.body;

    if (!titulo || !conteudo) {
      return res
        .status(400)
        .json({ mensagem: "Título e conteúdo são obrigatórios" });
    }

    const collection = client.db(dbName).collection("posts");

    const resultado = await collection.updateOne(
      { _id: postId, comunidadeId },
      { $set: { titulo, conteudo } }
    );

    if (resultado.modifiedCount === 0) {
      return res.status(404).json({ mensagem: "Post não encontrado" });
    }

    res.status(200).json({ mensagem: "Post editado com sucesso" });
  } catch (error) {
    console.error("Erro ao editar o post:", error);
    res.status(500).json({ mensagem: "Erro ao editar o post" });
  }
});

start(app)
  .then(() => console.log("Rotina de inicialização concluída"))
  .catch((err) => console.log("Erro na rotina de inicialização: ", err));
