const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mrrlkes.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const productsCollection = client.db("brandDB").collection("brandProducts");
    const brandCollection = client.db("brandDB").collection("brands");
    const addCartCollection = client.db("brandDB").collection("addCart");

    app.get("/brandProducts", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/brandProducts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    app.get("/brands", async (req, res) => {
      const cursor = brandCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/addCart", async (req, res) => {
      const cursor = addCartCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/brandProducts", async (req, res) => {
      console.log("post hitted");
      const brand = req.body;
      const result = await productsCollection.insertOne(brand);
      res.send(result);
    });

    // post add cart products
    app.post("/addCart", async (req, res) => {
      const product = req.body;
      const result = await addCartCollection.insertOne(product);
      res.send(result);
    });
    // delete cart products
    app.delete("/addCart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await addCartCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Running....");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
