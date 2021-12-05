var citySearch;
var APIkey = '&appid=28870b55a52a06273a2463ffab2469f7';
var weatherAPI = 'https://api.openweathermap.org/data/2.5/weather?';
var uviAPI = 'https://api.openweathermap.org/data/2.5/uvi?lat=';
var forecastAPI = 'https://api.openweathermap.org/data/2.5/forecast?q=';
var geoAPI = navigator.geolocation;
var units = '&units=imperial';
var getWeatherIcon = 'http://openweathermap.org/img/wn/';
var searchHistoryArr = [];

$(document).ready(function() {
    init();

    // Function to reset the page and hide the divs
    function init() {
        search();
        $("#current-forecast").hide();
        $("#five-day-forecast-container").hide();
        $("#search-history-container").hide();
        $("#current-weather-location").hide();
        $("#error-div").hide();
        displayHistory();
        clearHistory();
        clickHistory();
        currentLocationButton()
    }

    // Function for the search city button
    function search() {
        $('#search-button').on('click', function() {
            citySearch = $('#search-input')
                .val()
                .trim();

            if (citySearch === '') {
                return;
            }
            $('#search-input').val('');
            getWeather(citySearch);
        });
    }

    // Function to get the weather result of user input
    function getWeather(search) {
        var queryURL = weatherAPI + "q=" + search + units + APIkey;

        $.ajax({
            url: queryURL,
            method: "GET",
            statusCode: {
                404: function() {
                    $('#current-forecast').hide();
                    $('#five-day-forecast-container').hide();
                    $('#error-div').show();
                }
            }
        }).then(function(response) {
            $("#error-div").hide();
            $("#current-forecast").show();
            $("#five-day-forecast-container").show();

            var results = response;
            var name = results.name;
            var temperature = Math.floor(results.main.temp);
            var humidity = results.main.humidity;
            var windSpeed = results.wind.speed;
            var date = new Date(results.dt * 1000).toLocaleDateString("en-US");
            var weatherIcon = results.weather[0].icon;
            var weatherIconURL = getWeatherIcon + weatherIcon + ".png";

            storeHistory(name);

            $('#city-name').text(name + ' (' + date + ') ');
            $('#weather-image').attr('src', weatherIconURL);
            $('#temperature').html('<b>Temperature: </b>' + temperature + ' °F');
            $('#humidity').html('<b>Humidity: </b>' + humidity + '%');
            $('#wind-speed').html('<b>Wind Speed: </b>' + windSpeed + ' MPH');

            var lat = response.coord.lat;
            var lon = response.coord.lon;
            var uviQueryURL = uviAPI + lat + '&lon=' + lon + APIkey;


            // To get the UV index from API
            $.ajax({
                url: uviQueryURL,
                method: "GET"
            }).then(function(uviResponse) {
                var uviResults = uviResponse;
                var uvi = uviResults.value;
                $("uv-index").html(
                    "<b>UV Index: </b>" +
                    '<span class="badge badge-pill badge-light" id="uvi-badge">' +
                    uvi + "</span>"
                )
            })

            var cityName = name;
            var countryCode = response.sys.country;
            var forecastQueryURL =
                forecastAPI + cityName + "," + countryCode + units + APIkey;

            $.ajax({
                url: forecastQueryURL,
                method: "GET"
            }).then(function(forecastResponse) {
                var forecastResults = forecastResponse;
                var forecastArray = [];

                for (var i = 5; i < 40; i += 8) {
                    var forecastObj = {};
                    var forecastResultsDate = forecastResults.list[i].dt_txt;
                    var forecastDate = new Date(forecastResultsDate).toLocaleDateString(
                        "en-us"
                    );
                    var forecastTemp = forecastResults.list[i].main.temp;
                    var forecastHumidity = forecastResults.list[i].main.humidity;
                    var forecastIcon = forecastResults.list[i].weather[0].icon;

                    forecastObj["list"] = {};
                    forecastObj["list"]["date"] = forecastDate;
                    forecastObj["list"]["temp"] = forecastTemp;
                    forecastObj["list"]["humidity"] = forecastHumidity;
                    forecastObj["list"]["icon"] = forecastIcon;

                    forecastArray.push(forecastObj);
                }

                for (var j = 0; j < 5; j++) {
                    var forecastArrayDate = forecastArray[j].list.date;
                    var forecastIconURL =
                        getWeatherIcon + forecastArray[j].list.icon + '.png';
                    var forecastArrayTemp = Math.floor(forecastArray[j].list.temp);
                    var forecastArrayHumidity = forecastArray[j].list.humidity

                    $("#date-" + (j + 1)).text(forecastArrayDate);
                    $("#weather-image-" + (j + 1)).attr("src", forecastIconURL);
                    $("#temp-" + (j + 1)).text(
                        "Temp: " + Math.floor(forecastArrayTemp) + " °F"
                    );
                    $("#humidity-" + (j + 1)).text(
                        "Humidity: " + forecastArrayHumidity + "%"
                    );
                }
                $("#weather-container").show()
            })
        })
    }

    // Function to get the current location
    function getCurrentLocation() {
        function success(position) {
            const currentLat = position.coords.latitude;
            const currentLon = position.coords.longitude;
            var currentLocationQueryURL =
                weatherAPI +
                'lat=' +
                currentLat +
                '&lon=' +
                currentLon +
                units +
                APIkey;

            $.ajax({
                url: currentLocationQueryURL,
                method: 'GET'
            }).then(function(currentLocationResponse) {
                var currentLocationResults = currentLocationResponse;
                var currentLocationName = currentLocationResults.name;
                var currentLocationTemp = currentLocationResults.main.temp;
                var currentLocationHumidity = currentLocationResults.main.humidity;
                var currentLocationIcon = currentLocationResults.weather[0].icon;
                var currentLocationIconURL =
                    getWeatherIcon + currentLocationIcon + '.png';

                $('#current-location').text(currentLocationName);
                $('#weather-image-current-location').attr(
                    'src',
                    currentLocationIconURL
                );
                $('#temp-current-location').html(
                    '<b>Temperature: </b>' + currentLocationTemp + ' °F'
                );
                $('#humidity-current-location').html(
                    '<b>Humidity: </b>' + currentLocationHumidity + '%'
                );
            });

            $("#current-weather-location").show();
        }

        // function if ever the webiste cannot track your location
        function error() {
            $('#current-location').text('Cannot get your current location.');
        }

        if (!geoAPI) {
            $('#current-location').text(
                'Geolocation is not supported by your browser'
            );
        } else {
            geoAPI.getCurrentPosition(success, error);
        }
    }

    // function for current location button
    function currentLocationButton() {
        $("#current-location-button").on("click", function() {
            getCurrentLocation();
        });
    }


    // function to store searched history for cities
    function storeHistory(citySearchName) {
        var searchHistoryObj = {};

        if (searchHistoryArr.length === 0) {
            searchHistoryObj['city'] = citySearchName;
            searchHistoryArr.push(searchHistoryObj);
            localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));
        } else {
            var checkHistory = searchHistoryArr.find(
                ({ city }) => city === citySearchName
            );

            if (searchHistoryArr.length < 5) {
                if (checkHistory === undefined) {
                    searchHistoryObj['city'] = citySearchName;
                    searchHistoryArr.push(searchHistoryObj);
                    localStorage.setItem(
                        'searchHistory',
                        JSON.stringify(searchHistoryArr)
                    );
                }
            } else {
                if (checkHistory === undefined) {
                    searchHistoryArr.shift();
                    searchHistoryObj['city'] = citySearchName;
                    searchHistoryArr.push(searchHistoryObj);
                    localStorage.setItem(
                        'searchHistory',
                        JSON.stringify(searchHistoryArr)
                    );
                }
            }
        }
        $("#search-history").empty();
        displayHistory();
    }

    // ffunction to get history from local storage and show it
    function displayHistory() {
        var getLocalSearchHistory = localStorage.getItem('searchHistory');
        var localSearchHistory = JSON.parse(getLocalSearchHistory);

        if (getLocalSearchHistory === null) {
            createHistory();
            getLocalSearchHistory = localStorage.getItem('searchHistory');
            localSearchHistory = JSON.parse(getLocalSearchHistory);
        }

        for (var i = 0; i < localSearchHistory.length; i++) {
            var historyLi = $('<li>');
            historyLi.addClass('list-group-item');
            historyLi.text(localSearchHistory[i].city);
            $('#search-history').prepend(historyLi);
            $('#search-history-container').show();
        }
        return (searchHistoryArr = localSearchHistory);
    }

    // function to add all searched city into a string in local storage
    function createHistory() {
        searchHistoryArr.length = 0;
        localStorage.setItem('searchHistory', JSON.stringify(searchHistoryArr));
    }

    // function to clear history in local storage and remove it in history container
    function clearHistory() {
        $('#clear-history').on('click', function() {
            $('#search-history').empty();
            $('#search-history-container').hide();
            localStorage.removeItem('searchHistory');
            createHistory();
        });
    }

    function clickHistory() {
        $('#search-history').on('click', 'li', function() {
            var cityNameHistory = $(this).text();
            getWeather(cityNameHistory);
        });
    }
})