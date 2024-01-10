const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())
 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.8wqrrau.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const usersCollection = client.db('Technovission').collection('users')
    const productsCollection = client.db('Technovission').collection('products')
    const addCartCollection = client.db('Technovission').collection('addCart')

     // Save or modify user email, status in DB
     app.put('/users/:email', async (req, res) => {
        const email = req.params.email
        const user = req.body
        const query = { email: email }
        const options = { upsert: true }
        const isExist = await usersCollection.findOne(query)
        console.log('User found?----->', isExist)
        if (isExist) {
          if (user?.status === 'Requested') {
            const result = await usersCollection.updateOne(
              query,
              {
                $set: user,
              },
              options
            )
            return res.send(result)
          } else {
            return res.send(isExist)
          }
        }
        const result = await usersCollection.updateOne(
          query,
          {
            $set: { ...user, timestamp: Date.now() },
          },
          options
        )
        res.send(result)
      })

    // post(add products) products
      app.post('/products', async (req, res) => {
        const newproduct = req.body;
        const result = await  productsCollection.insertMany(newproduct)
        res.send(result)
      })

      // Get all products
      app.get('/products', async (req, res) => {
        const result = await productsCollection.find().toArray()
        res.send(result)
      })

      // Get single products
      app.get('/products/:id', async (req, res) => {
        const id = req.params.id
        const result = await productsCollection.findOne({ _id: new ObjectId(id) })
        res.send(result)
      })

    // addCart in database(post)
    app.post('/addcart', async (req, res) => {
        const newpusers = req.body;
        const result = await  addCartCollection.insertMany(newpusers)
        res.send(result)
      })


    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})