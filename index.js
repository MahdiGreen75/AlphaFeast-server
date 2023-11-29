const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;

//middlewares
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = "mongodb+srv://<username>:<password>@cluster0.geunt7i.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.geunt7i.mongodb.net/?retryWrites=true&w=majority`;

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

        const mealsCollection = client.db("AlphaFeastDB").collection("mealsCollection");
        const usersCollection = client.db("AlphaFeastDB").collection("usersCollection");
        const reviewAndMealRequestCollection = client.db("AlphaFeastDB").collection("reviewAndMealRequestCollection");

        //non-registered users
        //code for showing data in tabs
        app.get('/breakfast', async (req, res) => {
            const query = { "mealType": 'breakfast' };
            const cursor = await mealsCollection.find(query).toArray();
            res.send(cursor);
        })

        app.get('/lunch', async (req, res) => {
            const query = { "mealType": 'lunch' };
            const cursor = await mealsCollection.find(query).toArray();
            res.send(cursor);
        })

        app.get('/dinner', async (req, res) => {
            const query = { "mealType": 'dinner' };
            const cursor = await mealsCollection.find(query).toArray();
            res.send(cursor);
        })

        app.get('/allMeals', async (req, res) => {
            // const query = { "mealType": 'breakfast' };
            const cursor = await mealsCollection.find().toArray();
            res.send(cursor);
        })

        //storing data in the reviews section
        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const review = req.body;
            const filter = { _id: new ObjectId(id) };
            const cursor = await mealsCollection.find(filter).toArray();
            const prevReview = cursor[0].mealReview;
            const updateDoc = {
                $set: {
                    mealReview: [...prevReview, review.review]
                },
            };
            const result = await mealsCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        //users
        app.post("/users", async (req, res) => {
            const dataObj = req.body;
            const result = await usersCollection.insertOne(dataObj);
            res.send(result);
        })

        //userReview and mealRequest setting
        app.post("/userReviews", async (req, res) => {
            const dataObj = req.body;
            const result = await reviewAndMealRequestCollection.insertOne(dataObj);
            res.send(result);
        })

        //adding meals review to users
        app.patch('/userReviews/:id', async (req, res) => {
            const email = req.params.id;
            const dataObj = req.body;

            const currentReview = dataObj.dataObj;
            const filter = { user_email: email };
            const cursor = await usersCollection.find(filter).toArray();
            const prevReview = cursor[0].user_reviews;

            const updateDoc = {
                $set: {
                    user_reviews: [...prevReview, currentReview]
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        //Receiving meal request for individual users
        app.patch('/mealReq/:email', async (req, res) => {
            const email = req.params.email;
            const dataObj = req.body;
            const currentReq = dataObj.mealReqObj;
            const filter = { user_email: email };
            const cursor = await usersCollection.find(filter).toArray();
            const prevReq = cursor[0].requestedMealsId;

            const updateDoc = {
                $set: {
                    requestedMealsId: [...prevReq, currentReq]
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        //getting mealRequest value
        app.get("/requests/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { user_email: email };
            const cursor = await usersCollection.find(filter).toArray();
            const data = cursor[0].requestedMealsId
        })

        //admin
        app.post("/meals", async (req, res) => {
            const dataObj = req.body;
            const result = await mealsCollection.insertOne(dataObj);
            res.send(result);
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("AlphaFeast server is running.");
})

app.listen(port, () => {
    console.log(`AlphaFeast server is running on port ${port}`);
})