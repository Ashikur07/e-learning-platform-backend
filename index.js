const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ny1xaie.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // database collection 
        const userCollection = client.db('assignment_12').collection('users');
        const applyTeachingCollection = client.db('assignment_12').collection('applyforTeaching');

        // user related api
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ messege: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // get user info
        app.get('/users', async (req, res) => {     
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })

        // make user as teacher or change role
        app.patch('/users/teacher/:id', async(req, res) =>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const updateDoc = {
                $set:{
                    role: 'teacher'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        })




         // use patch for applyforTeaching status change to accepted
         app.patch('/applyforTeaching/teacher/:id', async(req, res) =>{
            const id = req.params.id;
            const { status } = req.body;
            const filter = {_id: new ObjectId(id)};
            const updateDoc = {
                $set:{
                    status: status
                }
            }
            const result = await applyTeachingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })



        // Apply For Teaching post method
        app.post('/applyforTeaching', async (req, res) => {
            const newItems = req.body;
            const result = await applyTeachingCollection.insertOne(newItems);
            res.send(result);
        })

        app.get('/applyforTeaching', async (req, res) => {
            const cursor = applyTeachingCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}


run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('LearnQuest server is running')
})

app.listen(port, () => {
    console.log(`LearnQuest Server is running on port ${port}`)
})