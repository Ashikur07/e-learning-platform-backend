const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
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
        const classCollection = client.db('assignment_12').collection('classes');
        const applyTeachingCollection = client.db('assignment_12').collection('applyforTeaching');
        const paymentCollection = client.db('assignment_12').collection('payments');
        const assignmentCollection = client.db('assignment_12').collection('assignments');
        const submitAssignmentCollection = client.db('assignment_12').collection('submitAssignments');
        const feedbackCollection = client.db('assignment_12').collection('feedback');

        // jwt related api 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('user for token', user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.send({ token });
        })

        // middlewares 
        const verifyToken = (req, res, next) => {
            console.log('inside verify token', req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }



        // feedback post method
        app.post('/feedback', async (req, res) => {
            const newItems = req.body;
            const result = await feedbackCollection.insertOne(newItems);
            res.send(result);
        })

        // feedback get method
        app.get('/feedback', async (req, res) => {
            const cursor = feedbackCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


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
        app.get('/users', verifyToken, async (req, res) => {
            console.log(req.headers);
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })

        // make user as teacher or  admin / change role
        app.patch('/users/teacher/:id', async (req, res) => {
            const id = req.params.id;
            const { role } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: role
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        })



        // Teaching related api
        // use patch for applyforTeaching status change to accepted
        app.patch('/applyforTeaching/teacher/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
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

        // get apply for teaching information
        app.get('/applyforTeaching',  verifyToken, async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }

            const result = await applyTeachingCollection.find(query).toArray();
            res.send(result);
        })



        //  classes related api
        // add class for database use post method
        app.post('/classes', async (req, res) => {
            const newClasses = req.body;
            const result = await classCollection.insertOne(newClasses);
            res.send(result);
        })

        // get apply for classes information
        app.get('/classes', async (req, res) => {
            const cursor = classCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // get single class data
        app.get('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.findOne(query);
            res.send(result);
        })


        // add a patch method in classes database collection
        app.patch('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const { status, enrolment, assignmentSubmited } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status: status },
                $inc: {}
            };

            if (enrolment !== undefined) {
                updateDoc.$inc.enrolment = parseInt(enrolment, 10);
            }

            if (assignmentSubmited !== undefined) {
                updateDoc.$inc.assignmentSubmited = parseInt(assignmentSubmited, 10);
            }


            const result = await classCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        // add a delete method in class collection
        app.delete('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.deleteOne(query);
            res.send(result);
        })

        // update class data
        app.put('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedClasses = req.body;
            console.log(updatedClasses);

            const classes = {
                $set: {
                    title: updatedClasses.title,
                    image: updatedClasses.image,
                    price: updatedClasses.price,
                    name: updatedClasses.name,
                    email: updatedClasses.email,
                    description: updatedClasses.description,
                    status: updatedClasses.status,
                    enrolment: updatedClasses.enrolment,
                }
            }
            const result = await classCollection.updateOne(filter, classes, options);
            res.send(result);
        })

        // payment intent
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        // payment infor save in the database
        app.post('/payments', async (req, res) => {
            const payments = req.body;
            const result = await paymentCollection.insertOne(payments);
            res.send(result);
        })

        // get payment some info 
        app.get('/payments', async (req, res) => {
            let query = {};
            if (req.query?.studentEmail) {
                query = { studentEmail: req.query.studentEmail }
            }

            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        })

        //get single payment data
        app.get('/payments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await paymentCollection.findOne(query);
            res.send(result);
        })


        // assignment collection 
        app.post('/assignments', async (req, res) => {
            const assignments = req.body;
            const result = await assignmentCollection.insertOne(assignments);
            res.send(result);
        })

        app.get('/assignments', async (req, res) => {
            let query = {};
            if (req.query?.classId) {
                query = { classId: req.query.classId }
            }
            const result = await assignmentCollection.find(query).toArray();
            res.send(result);
        })


        // submit assignment 
        app.post('/submitAssignments', async (req, res) => {
            const assignments = req.body;
            const result = await submitAssignmentCollection.insertOne(assignments);
            res.send(result);
        })

        // get method added
        app.get('/submitAssignments', async (req, res) => {
            let query = {};
            if (req.query?.courseId) {
                query = { courseId: req.query.courseId }
            }
            const result = await submitAssignmentCollection.find(query).toArray();
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