import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import cron from 'node-cron';
import connection from './db.js';

const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json())
const metros=["Bengaluru","Chennai","Mumbai","Kolkata","Delhi","Hyderabad"]

metros.forEach((metro)=>fetchWeather(metro))

//  endpoint to display server greeting
app.get('/',(req,res)=>{
    res.send("Welcome to the server!")
})

//  scheduling the fetchWeather to run every 10 mins for keeping the database updated about the latest weather updates from the api. 
cron.schedule(`*/10 * * * *`,()=>{
    metros.forEach((metro)=>fetchWeather(metro))
})

//  function to fetch weather data from api and pushing it to database
async function fetchWeather(city){

        const apiCall = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}`);
        const data = await apiCall.json();

        const icon = data.weather[0].icon
        const temp = Number(data.main.temp.toFixed(1));
        const feelsLike = Number(data.main.feels_like.toFixed(1));
        const condition = data.weather[0].main;
    
        const query = "INSERT INTO weather_data (City, Temperature,feels_like, weather_condition, recorded_at,icon) VALUES (?,?, ?, ?, CURRENT_TIMESTAMP,?)";
        connection.query(query, [city, temp,feelsLike, condition,icon], (err, result) => {
            if (err) {
                console.log(`Weather data for ${city} insertion failed!`, err);
            } else {
                console.log(`Weather data of ${city} inserted successfully!`);
            }
        });
    ;
}


// endpoint to serve the latest weather data from databse to the frontend on console refresh
app.get('/weather', (req, res) => {
    const cityChoice=req.query.cityChoice
    const query = `SELECT * FROM weather_data WHERE City = ? ORDER BY recorded_at DESC LIMIT 1`;
    
    connection.query(query,[cityChoice],(err, result) => {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve weather data!' });
        } else {
            res.json(result[0]); // Send the latest weather data to the frontend
        }
    });
});

//  function to fetch MAX,MIN,AVG and Dominant Weather Condition from weather table of the day and Push it to daily weather summary table 
function pushDailySummary(city) {
    let dailyMax, dailyMin, dailyAvg, dominantWeather;

    const queryPromise = (query, values = []) => {
        return new Promise((resolve, reject) => {
            connection.query(query, values, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };

    queryPromise(`
        SELECT weather_condition
        FROM weather_data
        WHERE city=?
        GROUP BY weather_condition
        ORDER BY COUNT(weather_condition) DESC
        LIMIT 1
    `,[city])
    .then(result => {
        dominantWeather = result[0].weather_condition;
        console.log(`Dominant Weather-${city}:`, dominantWeather);

        return queryPromise(`
            SELECT MAX(temperature) AS max, MIN(temperature) AS min, AVG(temperature) AS avg
            FROM weather_data
            WHERE city=? AND DATE(recorded_at) = CURRENT_DATE()
        `,[city]);
    })
    .then(result => {
        dailyMax = result[0].max;
        dailyMin = result[0].min;
        dailyAvg = Number(result[0].avg.toFixed(1));

        console.log(`${city} Max Temp:`, dailyMax, `${city} Avg Temp:`, dailyAvg, `${city} Min Temp:`, dailyMin);

        return queryPromise(`
            INSERT INTO daily_weather_summary
            (city,date, average_temperature, max_temperature, min_temperature, dominant_weather_condition)
            VALUES (?,CURRENT_DATE(), ?, ?, ?, ?)
        `, [city,dailyAvg, dailyMax, dailyMin, dominantWeather]);
    }).then(()=>{
        return queryPromise(`TRUNCATE weather_data`)    // truncated weather data of the current day after finding daily summary
    })
    .then(() => {
        console.log(`Daily summary for ${city} inserted successfully
        & truncated weather_data of the current day.`);
    })
    .catch(err => {
        console.log('Error:', err);
    });
}

//  scheduled the insertion to daily summary table at 11:59 pm every day.
cron.schedule(`59 23 * * *`,()=>{
    metros.forEach(metro => pushDailySummary(metro))
})



// Endpoint to retrieve daily summary for a specific city for the purpose of chart visualization
app.get('/daily-summary', (req, res) => {
    const city = req.query.city; 
    const query = `
        SELECT *
        FROM daily_weather_summary
        WHERE city = ? 
        ORDER BY date DESC LIMIT 10
    `;

    connection.query(query, [city], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve daily summary!' });
        } else {
            res.json(result);
        }
    });
});
 

// end point to insert alerts to alerts table
app.post('/set-alert', (req, res) => {
    const { city, tempThreshold, conditionThreshold, consecutiveChecks, alertType } = req.body;
    
    const query = `
        INSERT INTO weather_alerts (city, temperature_threshold, condition_threshold, consecutive_checks, alert_type)
        VALUES (?, ?, ?, ?, ?)
    `;
    connection.query(query, [city, tempThreshold, conditionThreshold, consecutiveChecks, alertType], (error, results) => {
        if (error) return res.status(500).json({ error });
        res.json({ message: 'Alert set successfully' });
    });
});


//  end point to fetch active alerts for checking with weather data on defined intervals 
app.get('/get-active-alerts',(req,res)=>{
    const city=req.query.city
    const query = 'SELECT * FROM weather_alerts WHERE CITY = ?'    
    connection.query(query,[city],(err,result)=>{
        if(err)
            console.log(`Failed fetching alerts for ${city}`);
        else{
            res.json(result)
        }
    })
})

//  end point to set the alert as triggered in database.
app.post('/deactivate-alert', (req, res) => {
    const alertId = req.body.alertId;

    const query = 'UPDATE weather_alerts SET is_active = false WHERE id = ?';

    connection.query(query, [alertId], (err, result) => {
        if (err) {
            console.error('Error deactivating alert:', err);
            res.status(500).send('Error deactivating alert');
        } else {
            res.json({ success: true, message: 'Alert deactivated successfully' });
        }
    });
});

//  end points to fetch active and triggered alerts to for displaying in front-end
app.get('/active-alerts',(req,res)=>{
    const city=req.query.city
    const query='SELECT * FROM weather_alerts WHERE city = ? AND is_active = TRUE ORDER BY id DESC LIMIT 5'
    connection.query(query,[city],(err,result)=>{
        if(err)
            console.log(`Failed to fetch Active Alerts of ${city}`)
        else{
            res.json(result)
        }
    })

})


app.get('/triggered-alerts',(req,res)=>{
    const city=req.query.city
    const query='SELECT * FROM weather_alerts WHERE city = ? AND is_active = FALSE ORDER BY id DESC LIMIT 5'
    connection.query(query,[city],(err,result)=>{
        if(err)
            console.log(`Failed to fetch Triggered Alerts of ${city}`)
        else{
            res.json(result)
        }
    })

})


app.listen(PORT, (err) => {
    if (err)
        console.log("Server starting failed!");
    else
        console.log(`Server is running on http://localhost:${PORT}`);
});
