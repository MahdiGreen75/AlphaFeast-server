const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
        const upComingMealPublishCollection = client.db("AlphaFeastDB").collection("upComingMealPublishCollection");
        const paymentCollection = client.db("AlphaFeastDB").collection("paymentCollection");

        //non-registered users
        //code for showing data in tabs
        app.get('/breakfast', async (req, res) => {
            const query = { "mealType": 'breakfast' };
            const cursor = await mealsCollection.find(query).toArray();
            const arr = cursor.filter(item => (item.upcomingOrAddMeals === "addToMeals"));
            // console.log(arr);
            res.send(arr);
        })

        app.get('/lunch', async (req, res) => {
            const query = { "mealType": 'lunch' };
            const cursor = await mealsCollection.find(query).toArray();
            const arr = cursor.filter(item => (item.upcomingOrAddMeals === "addToMeals"));
            // console.log(arr);
            res.send(arr);
        })

        app.get('/dinner', async (req, res) => {
            const query = { "mealType": 'dinner' };
            const cursor = await mealsCollection.find(query).toArray();
            const arr = cursor.filter(item => (item.upcomingOrAddMeals === "addToMeals"));
            // console.log(arr);
            res.send(arr);
        })

        app.get('/allMeals', async (req, res) => {
            // const query = { "mealType": 'breakfast' };
            const cursor = await mealsCollection.find().toArray();
            const arr = cursor.filter(item => (item.upcomingOrAddMeals === "addToMeals"));
            const mealsArr = await upComingMealPublishCollection.find().toArray();
            // console.log(arr);
            res.send([...arr, ...mealsArr]);
        })

        app.get('/upcomingMeals', async (req, res) => {
            const cursor = await mealsCollection.find().toArray();
            const arr = cursor.filter(item => (item.upcomingOrAddMeals === "upcomingMeals"));
            // console.log(arr);
            res.send(arr);
        })

        //handle like and unlike for signed in users
        app.get('/addLike/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const mealObj = await mealsCollection.findOne(query);
            const prevLikeCount = +mealObj.mealLikes;
            const newLikeCount = prevLikeCount + 1;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    mealLikes: newLikeCount
                },
            };
            const result = await mealsCollection.updateOne(filter, updateDoc);
            res.send(result);
            // const cursor = await mealsCollection.find().toArray();
        })

        app.get('/substractLke/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const mealObj = await mealsCollection.findOne(query);
            const prevLikeCount = +mealObj.mealLikes;
            const newLikeCount = prevLikeCount - 1;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    mealLikes: newLikeCount
                },
            };
            const result = await mealsCollection.updateOne(filter, updateDoc);
            res.send(result);
            // console.log("sub", id);
            // const cursor = await mealsCollection.find().toArray();
        })

        //storing data in the reviews section
        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const review = req.body;
            const filter = { _id: new ObjectId(id) };
            const cursor = await mealsCollection.find(filter).toArray();
            const prevReview = cursor[0]?.mealReview;
            if (prevReview) {
                const updateDoc = {
                    $set: {
                        mealReview: [...prevReview, review.review]
                    },
                };
                const result = await mealsCollection.updateOne(filter, updateDoc);
                res.send(result);
            } else {
                console.log("bypassed...")
                res.send({
                    acknowledged: true,
                    matchedCount: 1,
                    modifiedCount: 1
                });
            }
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

        app.get("/mealReqQuery/:email", async (req, res) => {
            const email = req.params.email;
            // console.log(email, req.id);
            const query = { user_email: email };
            const data = await usersCollection.findOne(query);
            const meal = data?.requestedMealsId;
            // console.log(meal)
            res.send(meal);
        })
        // app.get('/mealReq/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const dataObj = req.body;
        //     const currentReq = dataObj.mealReqObj;
        //     const filter = { user_email: email };
        //     const cursor = await usersCollection.find(filter).toArray();
        //     const prevReq = cursor[0].requestedMealsId;

        //     const updateDoc = {
        //         $set: {
        //             requestedMealsId: [...prevReq, currentReq]
        //         },
        //     };
        //     const result = await usersCollection.updateOne(filter, updateDoc);
        //     res.send(result);
        // })

        // getting mealRequest value
        // app.get("/requests/:email", async (req, res) => {
        //     const email = req.params.email;
        //     const filter = { user_email: email };
        //     const cursor = await usersCollection.find(filter).toArray();
        //     const data = cursor[0].requestedMealsId
        // })

        //user existance check depending on email
        app.get("/isUser/:email", async (req, res) => {
            const email = req.params.email;
            const query = { user_email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                res.send({ isExists: true })
            } else {
                res.send({ isExists: false })
            }
        })

        app.get("/userReqMeals/:email", async (req, res) => {
            const email = req.params.email;
            const query = { user_email: email };
            const user = await usersCollection.findOne(query);
            const mealRequestsArr = (user?.requestedMealsId);
            res.send(mealRequestsArr);
        })

        app.get("/userReview/:email", async (req, res) => {
            const email = req.params.email;
            const query = { user_email: email };
            const user = await usersCollection.findOne(query);
            // const mealRequestsArr = (user?.requestedMealsId);
            res.send(user);
            // console.log(user);
        })


        //admin
        app.post("/meals", async (req, res) => {
            const dataObj = req.body;
            const result = await mealsCollection.insertOne(dataObj);
            res.send(result);
        })

        app.get("/manageUsers", async (req, res) => {
            const options = {
                projection: { user_name: 1, user_email: 1, role: 1 },
            };
            const cursor = await usersCollection.find().toArray();
            res.send(cursor);
        })

        app.patch("/makeAdmin/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { user_email: email };
            const updateDoc = {
                $set: {
                    role: "admin"
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        //get all users for admin
        app.get("/getall", async (req, res) => {
            const cursor = await usersCollection.find().toArray();
            res.send(cursor);
        })

        app.patch("/deliverMeal/:id", async (req, res) => {
            const id = req.params.id;
            const email = req.body.reqObj.email;
            // const filter = { user_email: email };
            const query = { user_email: email };
            const reqUser = await usersCollection.findOne(query);
            if (!reqUser) {
                return res.send({ reqUser: false });
            }
            reqUser.requestedMealsId.forEach((obj) => {
                if (obj.mealId === id) {
                    obj.states = "delivered";
                }
            });
            console.log(id, email, reqUser);
            const filter = { user_email: email };
            const result = await usersCollection.replaceOne(filter, reqUser);
            // console.log(reqUser);
            res.send(result);
        });

        //check if admin 
        app.get("/isAdmin/:email", async (req, res) => {
            const email = req.params.email;
            const query = { user_email: email };
            const user = await usersCollection.findOne(query);
            res.send(user?.role);
        })

        app.post("/upcomingMealsByAdmin/:email", async (req, res) => {
            const email = req.params.email;
            const upcomingMeal = req.body;
            upcomingMeal.adminEmail = email;
            // console.log(email, upcomingMeal);
            const result = await upComingMealPublishCollection.insertOne(upcomingMeal);
            res.send(result);
        })

        app.delete("/delUpcomingMeals/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await mealsCollection.deleteOne(query);
            res.send(result);
        })
        //stripe payment
        app.post("/create-payment-intent", async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            console.log("Amount Inside the intent", amount, price);
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: [
                    "card"
                ]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post("/payments", async (req, res) => {
            const payment = (req.body);
            // console.log(payment);
            const result = await paymentCollection.insertOne(payment);
            res.send(result);
        })

        app.get("/userPayment/:email", async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const query = { email: email };
            const result = await paymentCollection.findOne(query);
            // console.log(result);
            res.send(result);
        })


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