const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;

//middlewares
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion } = require('mongodb');
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