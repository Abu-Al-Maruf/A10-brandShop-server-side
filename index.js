const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://a10-brandshop.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mrrlkes.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware for verify token
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // await client.connect();
    const productsCollection = client.db("brandDB").collection("brandProducts");
    const brandCollection = client.db("brandDB").collection("brands");
    const addCartCollection = client.db("brandDB").collection("addCart");

    // auth related api

    app.post("/jwt", async (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // clear api if no user found/logout
    app.post("/logout", async (req, res) => {
      const userEmail = req.body;
      console.log("logged out", userEmail);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

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
    // get addCart data 
    app.get("/addCart", verifyToken, async (req, res) => {
      const queryEmail = req.query?.email;
      const tokenEmail = req.user?.email;
      
      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });

      }

      let queryObj = {};
      if (req.query?.email) {
        queryObj = { email: req.query.email };
      }
      const result = await addCartCollection.find(queryObj).toArray();
      res.send(result);
    });

    // post add cart products
    app.post("/addCart", async (req, res) => {
      const product = req.body;
      const result = await addCartCollection.insertOne(product);
      res.send(result);
    });

    app.post("/brandProducts", async (req, res) => {
      const brand = req.body;
      const result = await productsCollection.insertOne(brand);
      res.send(result);
    });

    // delete cart products
    app.delete("/addCart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addCartCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/brandProducts/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateProduct = {
        $set: {
          name: updatedProduct.name,
          brand: updatedProduct.brand,
          type: updatedProduct.type,
          price: updatedProduct.price,
          desc: updatedProduct.desc,
          rating: updatedProduct.rating,
          image: updatedProduct.image,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateProduct,
        options
      );
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running..");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
