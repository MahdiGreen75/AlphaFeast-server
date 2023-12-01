const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // Don't forget to install the bodyParser package if you haven't already

app.use(bodyParser.json());

// Assuming you have a MongoDB connection, replace 'yourCollection' with the actual name of your collection
const yourCollection = require('./path-to-your-collection'); 

app.patch("/user/changeReq/:email", async (req, res) => {
  const userEmail = req.params.email;

  try {
    // Find the user by email
    const user = await yourCollection.findOne({ user_email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the "states" property to "deliver" for all requestedMealsId with "pending" state
    user.requestedMealsId.forEach((meal) => {
      if (meal.states === 'pending') {
        meal.states = 'deliver';
      }
    });

    // Update the document in the MongoDB collection
    await yourCollection.updateOne({ user_email: userEmail }, { $set: { requestedMealsId: user.requestedMealsId } });

    res.status(200).json({ message: 'States updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Your other routes and configurations...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
