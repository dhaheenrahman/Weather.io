# Weather.io

A weather monitoring application that fetches real-times weather updates of metro cities from OpenWeatherMap API and provides daily weather summary and user configured weather alerts. The Front end is developed using HTML,CSS and JavaScript and the backend is handled by Node.js with MySQL as Database.

## Features
- **Real-time Weather Data :**
    Fetches weather data for metro cities in India.
    
- **User-configurable controls:**
    User can configure the temperature unit(°C default) and                                 refresh intervals.
    
- **Visualization of Daily Summary:**
    User can visualize the summary with the help of a chart which show Daily                Avg,Min,Max Temperature and Dominant Weather Condition of the last 10 days.

- **User-configurable Alerts:**
    User can set Weather alerts by setting Temperature threshold value and Specific         weather condition. Also configure how many consecutive updates should be               considered to trigger the alert.

- **Active and Triggered Alerts:**
    Display the active and triggered alerts in the console for the recent 5 alerts.

## Project Structure
	Weather.io/
	│
	├── backend/
	│   ├── app.js
	│   ├── db.js
	│   ├── .env
	│
	├── frontend/
	│   ├── index.html
	│   ├── styles.css
	│   ├── script.js
	│
	├── node_modules/
	├── package.json 
	├── package-lock.json
	├── README.md

## Installation and Setup
Follow these steps to set up and run the project locally.
### Prerequisites
- Node.js (v16 or higher)
- MySQL (v5.7 or higher)
- Git
- OpenWeatherMap API key

### Steps:
##### 1. Clone the github repository to your preferred directory. Open Terminal and run:-
    git clone https://github.com/dhaheenrahman/weather.io.git
    cd Weather.io
##### 2. Install the dependencies using following command:-
    npm install
##### 3. Create MySQL Database named 'weatherapp' and following tables(Better use a new terminal for mysql commands):
    CREATE DATABASE weatherapp;
    USE weatherapp;
	
    CREATE TABLE weather_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(255),
    temperature FLOAT,
    feels_like FLOAT,
	low FLOAT,
	high FLOAT,
    weather_condition VARCHAR(255),
	humidity INT,
	wind_speed FLOAT,
    recorded_at DATETIME,
    icon VARCHAR(10));
	
    CREATE TABLE daily_weather_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(255),
    date DATE,
    average_temperature FLOAT,
    max_temperature FLOAT,
    min_temperature FLOAT,
    dominant_weather_condition VARCHAR(255));
	
    CREATE TABLE weather_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(255),
    temperature_threshold FLOAT,
    condition_threshold VARCHAR(255),
    consecutive_checks INT,
    alert_type VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE );
##### 4. Navigate to 'backend' directory: `cd backend`<br> Create file '.env' and paste the below text in this file and configure your MySQL Credentials and OpenWeatherMap API key here
	DB_USER=your_user (Eg: root)
	DB_HOST=your_host (Eg: localhost)
	DB_NAME=your_db_name (Eg: weatherapp)
	DB_PASS=your_password
	DB_PORT=your_port (Eg:3306)
	WEATHER_API_KEY=your_api_key
##### 5. Run the file 'app.js':-
    node app.js
Now the server will be running on:- <br>
    `http://localhost:3000`
##### 6. Navigate to the 'frontend' folder and open 'index.html' in a browser. <br>
Your weather app is now ready to use. <br>
Note:- The daily summary won't be visible since the daily_weather_summary table is      empty initially. You can insert some dummy data for visualization purpose in the        inital case or wait for days to pass. Insertion query for some dummy data is            attached at then end of this readme. You can use it for testing purpose.

## Working
#### Weather Dashboard
![weather_dashboard_snapshot](https://github.com/user-attachments/assets/4607e29e-0d86-465a-bec1-b706b2dde88d)
- User can choose any city among the metro cities in Inda. 
- User can toggle between temperature display unit.
- User can configure weather refreshing interval. The default value will be 10 mins.
- User can view the current weather information which is updated on a defined interval. The informations include:
1. Weather condition
2. Temperature
3. Feels Like temperature
4. Low and High of the current day
5. Humidity Percentage
6. Wind speed in Kmph
7. Last refresh time
8. Last weather updation time.
#### Daily Summary Chart
![dailySummary_snapshot](https://github.com/user-attachments/assets/4585ea5e-aa28-4601-bf76-c85f2b87f8ee)
- The summary of daily weather data for the last 10 days.
- The summary can be visualized in a chart where y-axis shows temperature and x-axis represents date.
- The informations included in the map:
##### 1. Daily average temperature
Calculated from the temperature recorded throughout the day from the database 
##### 2. Daily minimum temperature
Calculated from the temperature recorded throughout the day from the database 
##### 3. Daily maximum temperature
Calculated from the temperature recorded throughout the day from the database 
##### 4. Dominant weather condition of the day(Visible when hovered over the points in the chart):<br>
Determined by choosing the most recorded weather condition of the day from the database.

#### Weather Alerts
User can create custom weather alerts for each cities. The alerts created are applicable only for the currently selected city.
- ##### Temperature alert:
  This type of alerts are triggered when the temperature reaches or goes above the temperature threshold set by the user.
- ##### Weather condition alert:
  This one gets triggered when the weather condition becomes certain conditions set by the user.
- ##### Consecutive checks:
  User can also set the number of consecutive checks to be considered for triggering the alarm.
- ##### View active and triggered alerts
  User can view the active and triggered alerts set by them on seperate tabs. 
## Major Areas:
### OpenWeatherMap API call: <br>
&nbsp;&nbsp; The free weather api service given by OpenWeatherMap is the backbone of this application since it is the only data source of this project. All the data are formed out of this data. The API call url: <br><br>
    `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}`<br><br>
&nbsp;&nbsp;Since this call needs 'lat' and 'long' of each location, they are also providing another geocoding api to fetch 'lat' and 'long' from location inputs. But when i have gone through their documentation deeply, they are also providing a Built-in geocoding integrated weather API call. The url is as follows:- <br><br>
`https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={API key}`<br>
&nbsp;&nbsp;So I decided to use this API call for fetching weather data  since there is no need to find latitude and longitude seperately using geocoding API.<br><br>
The values of following keys are used for this application: `temp` `feels_like` `main` `icon` `dt`
### Temperature Conversion Formulas used:-<br>
&nbsp;&nbsp;Since the 'temp' value fetched from weather api is in Kelvin, we have to convert it to Celsius or Fahrenheit as per user preference. The conversion formulas used are:<br><br>
Kelvin to Celsius: `T(K) - 273`<br> 
Kelvin to Fahrenheit: `(T(K) - 273)*9/5 + 32`<br><br>
&nbsp;&nbsp;The temperature value is rounded to upto 1 decimal for enhancing user readability.

### Cron Jobs using node-cron:
&nbsp; &nbsp;- The node-cron helps to schedule tasks. This is used for scheduling two tasks in the backend.- First one is scheduled at 10 minutes interval for fetching weather data from api inorder keep the database updated with latest data every 10 mins.
The 10 mins interval is chosen because the weather data in the api is refreshing only once in every 10 minutes. So an api call with interval of less than 10 mins is of no use.<br>Cron expression of this task: `*/10 * * * *` &nbsp;<br> <br>- The second cron task scheduled is to calculate and push the summary of the day to daily_weather_summary table at the end of the day(11:59 pm). It is calculated from all the records in weather_data table fetched at every 10 mins. The weather_data is also truncated after this task for capturing next day's data so as to prevent database flooding with all previous data. <br> Cron expression of this task: `59 23 * * *` <br><br>
## Technology Stack
### Backend

- Node.js
- Express
- MySQL
### Frontend
- HTML
- CSS
- JavaScript

## Usage
1. Launch the server and access the frontend in `index.html`. 
2. Monitor the weather data in real-time.
3. Set custom weather alerts based on temperature and conditions.
4. Visualize weather trends over the past 10 days using the chart.
## Appendix:
### Dummy data insertion query to visualize daily_summary chart:
	INSERT INTO daily_weather_summary (id, city, date, average_temperature, max_temperature, min_temperature, dominant_weather_condition) 
	VALUES
	(1, 'Bengaluru', '2024-10-10', 295.5, 300, 290, 'Clear'),
	(2, 'Chennai', '2024-10-10', 300.5, 305, 295, 'Clear'),
	(3, 'Mumbai', '2024-10-10', 299.5, 304, 295, 'Clear'),
	(4, 'Kolkata', '2024-10-10', 302, 307, 298, 'Clear'),
	(5, 'Delhi', '2024-10-10', 305, 310, 300, 'Haze'),
	(6, 'Hyderabad', '2024-10-10', 299, 304, 294, 'Clouds'),
	
	(7, 'Bengaluru', '2024-10-11', 296, 301, 291, 'Clouds'),
	(8, 'Chennai', '2024-10-11', 301, 306, 296, 'Haze'),
	(9, 'Mumbai', '2024-10-11', 300, 305, 296, 'Thunderstorm'),
	(10, 'Kolkata', '2024-10-11', 303, 308, 298, 'Haze'),
	(11, 'Delhi', '2024-10-11', 305.5, 311, 300.5, 'Clouds'),
	(12, 'Hyderabad', '2024-10-11', 300, 305, 295, 'Haze'),
	
	(13, 'Bengaluru', '2024-10-12', 297, 302, 292, 'Rain'),
	(14, 'Chennai', '2024-10-12', 302, 307, 297, 'Mist'),
	(15, 'Mumbai', '2024-10-12', 301, 306, 297, 'Haze'),
	(16, 'Kolkata', '2024-10-12', 303.5, 309, 298.5, 'Clouds'),
	(17, 'Delhi', '2024-10-12', 306, 311.5, 301, 'Clear'),
	(18, 'Hyderabad', '2024-10-12', 300.5, 306, 295, 'Clear'),
	
	(19, 'Bengaluru', '2024-10-13', 295.5, 299, 290.5, 'Thunderstorm'),
	(20, 'Chennai', '2024-10-13', 303, 308, 298, 'Clear'),
	(21, 'Mumbai', '2024-10-13', 300.5, 305.5, 296.5, 'Clouds'),
	(22, 'Kolkata', '2024-10-13', 302.5, 308, 297, 'Mist'),
	(23, 'Delhi', '2024-10-13', 307, 312, 302, 'Mist'),
	(24, 'Hyderabad', '2024-10-13', 301, 307, 296, 'Clouds'),
	
	(25, 'Bengaluru', '2024-10-14', 298, 303, 293, 'Haze'),
	(26, 'Chennai', '2024-10-14', 300, 305, 295, 'Clouds'),
	(27, 'Mumbai', '2024-10-14', 298, 303, 293, 'Mist'),
	(28, 'Kolkata', '2024-10-14', 301, 306, 296, 'Thunderstorm'),
	(29, 'Delhi', '2024-10-14', 305.5, 311, 300.5, 'Thunderstorm'),
	(30, 'Hyderabad', '2024-10-14', 299.5, 305, 294, 'Thunderstorm'),
	
	(31, 'Bengaluru', '2024-10-15', 296.5, 302, 291.5, 'Mist'),
	(32, 'Chennai', '2024-10-15', 302.5, 307.5, 297.5, 'Thunderstorm'),
	(33, 'Mumbai', '2024-10-15', 299, 304, 294, 'Clear'),
	(34, 'Kolkata', '2024-10-15', 303, 308, 298, 'Haze'),
	(35, 'Delhi', '2024-10-15', 304.5, 310, 299, 'Haze'),
	(36, 'Hyderabad', '2024-10-15', 300, 305, 295, 'Mist'),
	
	(37, 'Bengaluru', '2024-10-16', 295, 299, 290, 'Clear'),
	(38, 'Chennai', '2024-10-16', 301, 306, 296, 'Clear'),
	(39, 'Mumbai', '2024-10-16', 300, 305, 295, 'Thunderstorm'),
	(40, 'Kolkata', '2024-10-16', 302, 307, 297, 'Clear'),
	(41, 'Delhi', '2024-10-16', 306.5, 311.5, 301.5, 'Clear'),
	(42, 'Hyderabad', '2024-10-16', 301, 306, 296, 'Clear'),
	
	(43, 'Bengaluru', '2024-10-17', 297.5, 301, 292, 'Clouds'),
	(44, 'Chennai', '2024-10-17', 302, 307, 297, 'Haze'),
	(45, 'Mumbai', '2024-10-17', 301, 306, 296, 'Haze'),
	(46, 'Kolkata', '2024-10-17', 303.5, 309, 298.5, 'Mist'),
	(47, 'Delhi', '2024-10-17', 305, 310, 300, 'Mist'),
	(48, 'Hyderabad', '2024-10-17', 300.5, 305.5, 295.5, 'Clouds'),
	
	(49, 'Bengaluru', '2024-10-18', 298.5, 304, 293, 'Clear'),
	(50, 'Chennai', '2024-10-18', 303, 308, 298, 'Mist'),
	(51, 'Mumbai', '2024-10-18', 300.5, 305.5, 295.5, 'Clear'),
	(52, 'Kolkata', '2024-10-18', 304, 310, 299, 'Haze'),
	(53, 'Delhi', '2024-10-18', 304, 309, 299, 'Haze'),
	(54, 'Hyderabad', '2024-10-18', 300, 305, 295, 'Haze'),
	
	(55, 'Bengaluru', '2024-10-19', 297.6, 303.5, 294.68, 'Clear'),
	(56, 'Chennai', '2024-10-19', 303.3, 307.2, 301.2, 'Mist'),
	(57, 'Mumbai', '2024-10-19', 300.9, 306, 297.1, 'Thunderstorm'),
	(58, 'Kolkata', '2024-10-19', 303.6, 308.9, 300.1, 'Haze'),
	(59, 'Delhi', '2024-10-19', 305.9, 312, 300.2, 'Haze'),
	(60, 'Hyderabad', '2024-10-19', 300.7, 305.3, 297.38, 'Clouds');
