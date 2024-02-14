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
  console.log(`Server is initializing ${port}`);
});

async function start(app) {
  await client.connect();
  console.log("Connected with success");
  const db = client.db(dbName);
  const collection = db.collection("documents");

  app.listen(process.env.PORT, () => {
    console.log("Server is executing (Express)");
  });
}

app.post("/communities", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "name and description are required" });
    }

    const collection = client.db(dbName).collection("communities");

    const newComunity = {
      name,
      description,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(newComunity);
    res.status(201).json({
      message: "Comunidade created with success",
      id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({ message: "Error creating community:" });
  }
});

app.post("/communities/:comunityId/posts", async (req, res) => {
  try {
    const { comunityId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "title and content are required" });
    }

    const collection = client.db(dbName).collection("posts");

    const novoPost = {
      comunityId,
      title,
      content,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(novoPost);
    res
      .status(201)
      .json({ message: "Post created with success", id: result.insertedId });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
});

app.get("/communities/:comunityId/posts", async (req, res) => {
  try {
    const { comunityId } = req.params;
    const collection = client.db(dbName).collection("posts");
    const posts = await collection.find({ comunityId }).toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ message: "Error getting posts" });
  }
});

app.get("/communities/:comunityId/posts/:postId/comments", async (req, res) => {
  try {
    const { comunityId, postId } = req.params;
    const collection = client.db(dbName).collection("comments");
    const comments = await collection.find({ postId }).toArray();
    if (comments.length === 0) {
      comments.push({
        postId: postId,
        text: "Test Post",
        author: "yes",
      });
    }
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({ message: "Error getting comments" });
  }
});

app.put("/communities/:comunityId/posts/:postId", async (req, res) => {
  try {
    const { comunityId, postId } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "title and content are required" });
    }

    const collection = client.db(dbName).collection("posts");

    const result = await collection.updateOne(
      { _id: postId, comunityId },
      { $set: { title, content } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post edited successfully" });
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).json({ message: "Error editing post" });
  }
});

start(app)
  .then(() => console.log("Initialization routine complete"))
  .catch((err) => console.log("Error in initialization routine: ", err));
