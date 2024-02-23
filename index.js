const express = require('express')
const app = express()
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 5000

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

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

// own middleware
const logger = async(req,res,next)=>{
  console.log("cokkieeeeeeeee",req.method,req.url);
  next()
}

const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const usersCollection = client.db('Technovission').collection('users')
    const productsCollection = client.db('Technovission').collection('products')
    const addCartCollection = client.db('Technovission').collection('addCart')

    // JWT
    app.post('/jwt' ,async (req,res)=>{
      const user = req.body
      const token = jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:'1h'})
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:false
      })
      .send({success:true})
    })

    app.post('/logout',async(req,res)=>{
      const user = req.body
      res.clearCookie('token',{maxAge:0}).send({success:true})
  
    })

  
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
      const result = await productsCollection.insertMany(newproduct)
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
      const result = await addCartCollection.insertMany(newpusers)
      res.send(result)
    })

    // Get add cart data
    app.get('/addcart/:email',  async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await addCartCollection.find(query).toArray()
      res.send(result)
    })
    // get users rool
    app.get('/userrole/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })
    // Get all Users
    app.get('/userrole', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    // single products delete
    app.delete('/products/:id', async (req, res) => {
      const id = req.params.id
      const findresult = await productsCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(findresult)
    })
    // single AddCart delete
    app.delete('/addcart/:id', async (req, res) => {
      const id = req.params.id
      const finddelete = await addCartCollection.deleteOne({ _id: new ObjectId(id) })
      res.send(finddelete)
    })
    // Make Admin
    app.patch('/userrole/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
         role: 'admin',
        },
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
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