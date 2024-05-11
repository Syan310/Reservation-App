require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${encodeURIComponent(process.env.MONGO_DB_PASSWORD)}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/reserve', async (req, res) => {
    const { name, email, date, time } = req.body;
    const weatherUrl = `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=New York&dt=${date}`;

    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection(process.env.MONGO_COLLECTION);
        
        const weatherResponse = await axios.get(weatherUrl);
        const weather = weatherResponse.data.forecast.forecastday[0].day.condition.text;

        await collection.insertOne(req.body);

        res.render('confirmation', {
            reservation: req.body,
            weather: weather
        });
    } catch (error) {
        console.error("Failed to create reservation", error);
        res.status(500).send("Failed to create reservation");
    } finally {
        await client.close();
    }
});

app.get('/search', async (req, res) => {
    const { name, email } = req.query;
    try {
        await client.connect();
        const database = client.db();
        const collection = database.collection(process.env.MONGO_COLLECTION);
        
        // Find the reservation that matches the name and email
        const reservation = await collection.findOne({ name: name, email: email });

        if (reservation) {
            // If found, render a page to show the reservation details
            res.render('reservation-details', {
                reservation: reservation
            });
        } else {
            // If no reservation found, send a message
            res.send('No reservation found for the provided name and email.');
        }
    } catch (error) {
        console.error("Failed to search reservation", error);
        res.status(500).send("Error searching for reservation");
    } finally {
        await client.close();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
