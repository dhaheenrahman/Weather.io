
const city = document.getElementById("city");
const weatherIcon = document.getElementById("weatherIcon")
const temp = document.getElementById("temp");
const feelsLike = document.getElementById("feelsLike");
const condition = document.getElementById("status");
const refreshTime = document.getElementById("refreshtime")
const updateTime = document.getElementById("updatetime")
const tempUnit = document.getElementById("unit");
const cityChoiceInput = document.getElementById("cityChoice");
const refreshInterval = document.getElementById("refreshInterval")
const ctx = document.getElementById('temperatureChart').getContext('2d');
let temperatureChart,FahrenheitFlag;
let activeAlertCount=0
let alertCheckIntervalId = null;

fetchWeather()                                        //    For initial weather display
startAlertCheck()                                     //    Check for existing weather alerts initially
cityChoiceInput.onchange=fetchWeather                 //    Update the console whenever user changes the city
tempUnit.onchange=fetchWeather                        //    Update the console whenever user changes the temperature unit(default °C)
let refreshIntervalId = setInterval(() => {           //    By default, the console will be refreshed in every 10 mins. (User can configure this interval)
    fetchWeather();
}, 600000);
refreshInterval.onchange=()=>{                        // Upon changing the refresh interval, interval ID is set to new value
    clearInterval(refreshIntervalId)
    refreshIntervalId = setInterval(()=>{
        fetchWeather()
    },refreshInterval.value)
} 

// function to fetch weather from database
function fetchWeather() {
    const cityChoice=cityChoiceInput.value
    fetch(`http://localhost:3000/weather?cityChoice=${cityChoice}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            setDisplay(data);
            startAlertCheck()
            fetchDailySummary(cityChoice)
            fetchActiveAlerts(cityChoice)
            fetchTriggeredAlerts(cityChoice)
        })
        .catch(error => console.error("Error fetching weather:", error));
}

//  function to fill the weather information from the json data extracted from fetchWeather()
function setDisplay(dataObj) {
    weatherIcon.src=`http://openweathermap.org/img/w/${dataObj.icon}.png`
    city.textContent = dataObj.city;
    condition.textContent = dataObj.weather_condition;
    refreshTime.textContent = ` Last refreshed at: ${new Date().toLocaleTimeString()}`
    updateTime.textContent = `Last updated at: ${new Date(dataObj.recorded_at).toLocaleTimeString()}`

    let tempKelvin = dataObj.temperature;
    feelsLikeKelvin = dataObj.feels_like;

    FahrenheitFlag = tempUnit.value === "f" ? true : false;
    if (FahrenheitFlag) {
        temp.textContent = `${((tempKelvin - 273) * 9/5 + 32).toFixed(1)}°F`;
        feelsLike.textContent = `Feels like ${((feelsLikeKelvin - 273) * 9/5 + 32).toFixed(1)}°F`;
    } else {
        temp.textContent = `${(tempKelvin - 273).toFixed(1)}°C`;
        feelsLike.textContent = `Feels like ${(feelsLikeKelvin - 273).toFixed(1)}°C`;
    }
}


//  function for displaying the daily weather summary of last 10 days
function fetchDailySummary(city) {
    
    FahrenheitFlag = tempUnit.value === "f" ? true : false;
    fetch(`http://localhost:3000/daily-summary?city=${city}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            const weatherConditions = data.map(entry => entry.dominant_weather_condition);
            const labels = data.map(entry => {
                const date = new Date(entry.date);
                return `${date.getDate()}${getOrdinalSuffix(date.getDate())} ${date.toLocaleString('default', { month: 'short' })}`;
            });

            const avgTemperatures = data.map(entry => {
                return FahrenheitFlag? (entry.average_temperature - 273)*9/5+32:
                                (entry.average_temperature - 273)
            });
            const maxTemperatures = data.map(entry => {
                return FahrenheitFlag? (entry.max_temperature - 273)*9/5+32:
                                (entry.max_temperature - 273)
            });
            const minTemperatures = data.map(entry => {
                return FahrenheitFlag? (entry.min_temperature - 273)*9/5+32:
                                (entry.min_temperature - 273)
            });

            // If chart already exists, destroy it before creating a new one
            if (temperatureChart) {
                temperatureChart.destroy();
            }

            temperatureChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: `Average Temperature (${FahrenheitFlag ? "°F" : "°C"})`,
                            data: avgTemperatures,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 2,
                            fill: false,
                        },
                        {
                            label: `Max Temperature (${FahrenheitFlag ? "°F" : "°C"})`,
                            data: maxTemperatures,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            fill: false,
                            borderDash: [5, 5],
                        },
                        {
                            label: `Min Temperature (${FahrenheitFlag ? "°F" : "°C"})`,
                            data: minTemperatures,
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            fill: false,
                            borderDash: [5, 5],
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(tooltipItem) {
                                    const datasetIndex = tooltipItem.datasetIndex;
                                    const label = tooltipItem.dataset.label || '';
                                    const value = tooltipItem.formattedValue;
                                    const weatherCondition = weatherConditions[tooltipItem.dataIndex];
                                    return [
                                        `${label}: ${value}`, 
                                        `Dominant Weather: ${weatherCondition}`
                                    ];
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: FahrenheitFlag ? Math.floor(Math.min(...minTemperatures) / 5) * 5 : Math.floor(Math.min(...minTemperatures) / 2) * 2,
                            max: FahrenheitFlag ? Math.ceil(Math.max(...maxTemperatures) / 5) * 5 : Math.ceil(Math.max(...maxTemperatures) / 2) * 2,
                            title: {
                                display: true,
                                text: `Temperature (${FahrenheitFlag ? "°F" : "°C"})`,
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Last 10 Days',
                            }
                        }
                    }
                }
            });
            
        })
        .catch(error => console.error('Error fetching daily summary:', error));
}


//  function for setting the Date on x-axis in a local standard.
function getOrdinalSuffix(date) {
    if (date > 3 && date < 21) return 'th'; 
    switch (date % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

//  making a post request to backend for the insertion of alert details into alert database when the set alert button is clicked
document.getElementById('alertForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const temp = Number(document.getElementById('tempThreshold').value);
    const tempThreshold = FahrenheitFlag? (temp-32)*5/9+273: temp+273
    const conditionThreshold = document.getElementById('conditionThreshold').value;
    const consecutiveChecks = document.getElementById('consecutiveChecks').value;
    const alertType = document.getElementById('alertType').value;

    fetch('http://localhost:3000/set-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            city: cityChoiceInput.value,
            tempThreshold,
            conditionThreshold,
            consecutiveChecks,
            alertType
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Alert set successfully!');
        activeAlertCount++;
        startAlertCheck(); 
        setTimeout(()=>{
            fetchTriggeredAlerts(cityChoiceInput.value)
        },1000)

        setTimeout(()=>{
            fetchActiveAlerts(cityChoiceInput.value)
        },1000)

    });
});


//  function to fetch the recent weather updates and compare it with alert fetched from the alert database for triggering the alerts.
let alertCounters = {}
function fetchAndCheckAlerts() {
    fetch(`http://localhost:3000/weather?cityChoice=${cityChoiceInput.value}`)
        .then(response => response.json())
        .then(data => {
            fetch(`http://localhost:3000/get-active-alerts?city=${cityChoiceInput.value}`)
                .then(res => res.json())
                .then(alerts => {
                    if (alerts.length > 0) {
                        activeAlertCount = alerts.length;
                        startAlertCheck(); 
                    }

                    alerts.forEach(alert => {
                        if(alert.is_active) {
                            if (!alertCounters[alert.id]) {
                                alertCounters[alert.id] = { tempCounter: 0, conditionCounter: 0 };
                            }

                            if (alert.alert_type === 'temperature') {
                                checkTemperatureAlert(alert, data.temperature);
                            }

                            if (alert.alert_type === 'condition') {
                                checkConditionAlert(alert, data.weather_condition);
                            }
                        }
                    });
                });
        });
}

let tempAlertCounter = 0;
let conditionAlertCounter = 0;

function checkTemperatureAlert(alert, currentTemp) {
    if (currentTemp >= alert.temperature_threshold) {
        alertCounters[alert.id].tempCounter++;
    } else {
        alertCounters[alert.id].tempCounter = 0;  
    }

    if (alertCounters[alert.id].tempCounter >= alert.consecutive_checks) {
        triggerAlert('temperature', currentTemp, alert.id);
        alertCounters[alert.id].tempCounter = 0;  
    }
}

function checkConditionAlert(alert, currentCondition) {
    if (currentCondition === alert.condition_threshold) {
        alertCounters[alert.id].conditionCounter++;
    } else {
        alertCounters[alert.id].conditionCounter = 0;
    }

    if (alertCounters[alert.id].conditionCounter >= alert.consecutive_checks) {
        triggerAlert('condition', currentCondition, alert.id);
        alertCounters[alert.id].conditionCounter = 0;
    }
}

function triggerAlert(type, value, alertId) {
    alert(`ALERT: ${type} alert triggered with value: ${value}`);
    setTimeout(()=>{
        fetchTriggeredAlerts(cityChoiceInput.value)
    },1000)

    setTimeout(()=>{
        fetchActiveAlerts(cityChoiceInput.value)
    },1000)



    fetch(`http://localhost:3000/deactivate-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            alertId: alertId,  
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Alert deactivated:', data);
        delete alertCounters[alertId];  
        activeAlertCount--;
        if (activeAlertCount <= 0) {
            stopAlertCheck();  
        }
    })
    .catch(error => console.error('Error deactivating alert:', error));
}




function startAlertCheck() {
    if (activeAlertCount > 0 && !alertCheckIntervalId) {
        alertCheckIntervalId = setInterval(() => {
            fetchAndCheckAlerts();
        }, refreshInterval.value);
    }
}

function stopAlertCheck() {
    if (activeAlertCount === 0 && alertCheckIntervalId) {
        clearInterval(alertCheckIntervalId);
        alertCheckIntervalId = null;  
    }
}

async function fetchActiveAlerts(city){
    const response = await fetch(`http://localhost:3000/active-alerts?city=${city}`)
    const data =await response.json()
    const list = document.getElementById("active-list")
    if(data && data.length>0){
        list.innerHTML=""
        data.forEach(entry =>{
            if(entry.alert_type=='temperature')
                list.innerHTML+=`
                    <li>Temperature Alert: ${ConvertFromKelvin(entry.temperature_threshold)} 
                    ${FahrenheitFlag?"­°F":"°C"}
                    </li>
                `
            else{
                list.innerHTML+=`
                    <li>Weather Alert: ${entry.condition_threshold}</li>
                `
            }
        })
    } else{
        list.innerHTML = "<li>No active alerts.</li>"; 
    }
}

async function fetchTriggeredAlerts(city){
    const response = await fetch(`http://localhost:3000/triggered-alerts?city=${city}`)
    const data =await response.json()
    const list = document.getElementById("triggered-list")
    if(data && data.length >0){
        list.innerHTML=""
        data.forEach(entry =>{
            if(entry.alert_type=='temperature')
                list.innerHTML+=`
                    <li>Temperature Alert: ${ConvertFromKelvin(entry.temperature_threshold)} 
                    ${FahrenheitFlag?"­°F":"°C"}
                    </li>
                `
            else{
                list.innerHTML+=`
                    <li>Weather Alert: ${entry.condition_threshold}</li>
                `
            }
        })
    } else{
        list.innerHTML = "<li>No triggered alerts.</li>"; 
    }
}

function ConvertFromKelvin(temp){
    if(FahrenheitFlag)
        return (temp-273)*9/5+32
    else
        return temp-273
}



