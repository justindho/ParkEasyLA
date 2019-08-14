let map;
function initMap() {
// function initMap(meterView) {
    // The map, centered at LA.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 34.05223, lng: -118.24368},
        zoom: 12
    });

    // Query Socrata for vacant parking meter spots and plot results.
    url = "https://data.lacity.org/resource/e7h6-4a3e.json?"
        + "occupancystate=VACANT"
        + "&$$app_token=ixOdggdMHJEhj3AjuHZ9JlPT4";
    // $.getJSON(url, function(data, textstatus) {
    //     $.each(data, function(i, entry) {
    //         // Create a marker for each entry on our map
    //         let marker = new google.maps.Marker({
    //             position: new google.maps.LatLng(entry.location_1.coordinates[1],
    //                                             entry.location_1.coordinates[0]),
    //             map: map,
    //             title: location.name
    //         });
    //     });
    // });

    // AJAX request for vacant openings in Socrata data set.
    $.ajax({
        url: "https://data.lacity.org/resource/e7h6-4a3e.json?occupancystate=VACANT",
        type: "GET",
        data: {
            "$limit": 50,
            "$$app_token": "ixOdggdMHJEhj3AjuHZ9JlPT4"
        }
    }).done(function(data) {
        // alert("Retrieved " + data.length + " records from the dataset!");
        console.log(data);
    });

    // Fetch all parking meters from python backend.
    navigator.geolocation.getCurrentPosition(function(position) {
        fetch('vacantMeters')
        // console.log('meterView: ' + meterView);
        // fetch(meterView)
            .then(function (response) {
                return response.json();
            }).then(function (json) {
                // Store locations from json response in an array.
                let locations = [];
                for (let location in json) {
                    if (json[location].streetcleaning == null || json[location].streetcleaning == 'undefined') {
                        json[location].streetcleaning = 'N/A';
                    }
                    locations.push({'space_id': json[location].space_id,
                                    'lat': json[location].lat,
                                    'lng': json[location].lng,
                                    'blockface': json[location].blockface,
                                    'metertype': json[location].metertype,
                                    'ratetype': json[location].ratetype,
                                    'raterange': json[location].raterange,
                                    'meteredtimelimit': json[location].meteredtimelimit,
                                    'parkingpolicy': json[location].parkingpolicy,
                                    'streetcleaning': json[location].streetcleaning
                                });
                }

                // Generate markers for each parking meter location.
                let markers = locations.map(function (location) {
                    let marker = new google.maps.Marker({
                        position: {'lat': location.lat, 'lng': location.lng},
                        title: 'Click for details'
                    });
                    // Content of info window.
                    let contentString = '<div id="content">'+
                        '<h1 class="firstHeading">Parking Meter ID: ' + location.space_id + '</h1>'+
                        '<div id="bodyContent">'+
                        '<p><u>Block-level Address</u>: ' + location.blockface + '</p>' + 
                        '<p><u>Meter Type (single-space/multi-space meter)</u>: ' + location.metertype + '</p>' + 
                        '<p><u>Hourly Rate Type (FLAT, JUMP($X.XX/hr-$X.XX/max), SEASONAL (Fall/Winter & Spring/Summer), Time-of-Day (TOD - Min-Max hourly rate range))</u>: ' + location.ratetype + '</p>' + 
                        '<p><u>Pricing</u>: ' + location.raterange + '</p>' + 
                        '<p><u>Parking Time Limit (during metered hours):</u> ' + location.meteredtimelimit + ' minutes</p>' + 
                        '<p><u>Parking Policy (meter hours of operation and enforced parking restrictions):</u> ' + location.parkingpolicy + '</p>' + 
                        '<p><u>Street Cleaning:</u> ' + location.streetcleaning + '</p>' + 
                        '<input type="button" id="button-directions" value="Get Directions" onclick="calculateRoute({lat: ' + position.coords.latitude + ', lng: ' + position.coords.longitude + '}, {lat: ' + location.lat + ', lng: ' + location.lng + '})"/>' +
                        '</div>'+
                        '</div>';

                    let infowindow = new google.maps.InfoWindow({
                        content: contentString
                    });

                    marker.addListener('click', function() {
                        // Zoom and center location upon marker click.
                        map.setCenter(marker.getPosition());

                        // Get directions

                        // Popup info window on marker click.
                        infowindow.open(map, marker);
                    });
                    return marker;

                    // Only allow one infoWindow to show at once.
                    // google.maps.event.addEventListener(marker, 'click', (function(marker) {
                    //     return function(evt) {
                    //         infowindow.setContent('HELLO');
                    //         infowindow.open(map, marker);
                    //     }
                    // })(marker));
                });

                // // Style cluster markers.
                // let clusterStyles = [
                //     {
                //         textColor: 'black',
                //         url: 'https://github.com/justindho/ParkEasyLA/blob/master/img/m1.png?raw=true',
                //         height: 50,
                //         width: 50
                //     },
                //     {
                //         textColor: 'black',
                //         url: 'https://github.com/justindho/ParkEasyLA/blob/master/img/m2.png?raw=true',
                //         height: 50,
                //         width: 50
                //     },
                //     {
                //         textColor: 'black',
                //         url: 'https://github.com/justindho/ParkEasyLA/blob/master/img/m3.png?raw=true',
                //         height: 50,
                //         width: 50
                //     }
                // ];

                // let mcOptions = {
                //     gridSize: 50,
                //     styles: clusterStyles,
                //     maxZoom: 15
                // };

                // Generate a marker cluster for better UI.
                let markerCluster = new MarkerClusterer(map, markers,
                    {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'}
                );
            });
        });
}

// Get user's geolocation.
// AS OF CHROME 50, THE GEOLOCATION API WILL ONLY WORK ON SECURE CONTEXTS SUCH
// AS HTTPS. IF YOUR SITE IS HOSTED ON AN NON-SECURE ORIGIN (SUCH AS HTTP) THE
// REQUESTS TO GET THE USER'S LOCATION WILL NO LONGER FUNCTION.
function getLocation() {
    // Try HTML5 geolocation.
    let pos;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            console.log('(' + pos.lat + ', ' + pos.lng + ')');
            return pos;
            // console.log('POS TYPE: ' + typeof pos);
            // alert('CURRENT LOCATION: (' + pos.lat + ', ' + pos.lng + ')');
        });
        // , function() {
        //     // handleLocationError(error, infoWindow);
        // });
    } else {
        // Browser doesn't support Geolocation.
        handleLocationError(error, infoWindow);
        alert('PLEASE ENABLE GEOLOCATION IN YOUR BROWSER');
    }
};

function handleLocationError(error, infoWindow) {
    switch(error) {
        case error.PERMISSION_DENIED:
            infoWindow.innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            infoWindow.innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            infoWindow.innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            infoWindow.innerHTML = "An unknown error occurred."
            break;
    }
}

// Get directions from user's current location to parking meter.
function calculateRoute(startLocation, endLocation) {
    // Get directions.
    let directionsService = new google.maps.DirectionsService;
    let directionsDisplay = new google.maps.DirectionsRenderer;
    let request = {
        origin: startLocation,
        destination: endLocation,
        travelMode: 'DRIVING',
        drivingOptions: {
            departureTime: new Date(Date.now()),
            trafficModel: 'pessimistic'
        },
        // transitOptions: TransitOptions,
        // drivingOptions: DrivingOptions,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        // waypoints[]: DirectionsWaypoint,
        // optimizeWaypoints: Boolean,
        // provideRouteAlternatives: Boolean,
        avoidFerries: true,
        avoidHighways: false,
        avoidTolls: true
        // region: String
    };
    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            directionsDisplay.setMap(map);
            directionsDisplay.setDirections(result);

            // Get turn-by-turn directions
            let directionsButton = document.createElement('button');
            directionsButton.setAttribute('id', 'directionsButton');
            let directionsButtonText = document.createTextNode('Show Details');
            directionsButton.appendChild(directionsButtonText);
            directionsButton.classList.add('btn', 'btn-info');

            // Show/hide directions on 'details' button click
            directionsButton.onclick = function() {
                let mapDiv = document.getElementById('map');
                let rightpanel = document.getElementById('right-panel');

                if (rightpanel.style.display == "none" || rightpanel.style.display == '') {
                    mapDiv.style.width = "50%";
                    directionsButton.innerHTML = "Hide Details";
                    rightpanel.style.display = "inline-block";
                    rightpanel.style.width = "50%";
                    directionsDisplay.setPanel(rightpanel);
                } else {
                    mapDiv.style.width = "100%";
                    rightpanel.style.display = "none";
                    directionsButton.innerHTML = "Show Details";
                }
            }

            // Display distance (nearest tenth of a mile) and commute time (nearest minute)
            let metersInMile = 1609.34;
            let distance = Math.round(result.routes[0].legs[0].distance.value * 10 / metersInMile) / 10;
            let duration = Math.round(result.routes[0].legs[0].duration.value / 60);
            document.getElementById('tripStats').innerHTML = `Distance: `
                + distance.toFixed(1) + ` miles.\n` + `Duration: ` + duration.toFixed(1) + ` minutes.`;

            // Add button to show/hide details of trip
            document.getElementById('tripStats').appendChild(directionsButton);

            // Add button to clear map directions
            let clearDirectionsButton = document.createElement('button');
            clearDirectionsButton.setAttribute('id', 'clearButton');
            clearDirectionsButton.classList.add('btn', 'btn-danger');
            let clearDirectionsButtonText = document.createTextNode('Clear Directions');
            clearDirectionsButton.appendChild(clearDirectionsButtonText);
            clearDirectionsButton.onclick = function() {
                // Remove highlighted route
                directionsDisplay.setMap(null);
                // Remove step-by-step directions
                directionsDisplay.setPanel(null);
                // Expand map to full width
                document.getElementById('map').setAttribute('style', 'width: 100%');
                // Clear trip stats bar
                document.getElementById('tripStats').innerHTML = '';
            }
            document.getElementById('tripStats').appendChild(clearDirectionsButton);
        }
        else {
            alert('An error occurred.');
        }
    });
};

// document.addEventListener('DOMContentLoaded', () => {

//     // Update displayed meters (all/vacant)
//     document.getElementById('meterViews').onchange = () => {

//         // Iniitalize request
//         const xhr = new XMLHttpRequest();
//         const viewType = document.getElementById('meterViews').value;
//         if (viewType === 'allMeters') {
//             let meterView = 'all_meters';
//             xhr.open('POST', 'allMeters/');
//         } else if (viewType === 'vacantMeters') {
//             let meterVIew = 'vacant_meters';
//             xhr.open('POST', 'vacantMeters/');
//         }

//         // Callback function for when request completes
//         xhr.onload = () => {

//             console.log('Inside request onload');

//             // Extract JSON data from request
//             const response = JSON.parse(xhr.responseText);

//             // Display meters (all or vacant)
//             initMap(viewType);
//         }

//         // Add data to send with request
//         const data = new FormData();
//         data.append('viewType', viewType);

//         // Send request
//         xhr.send(data);
//         return false;
//     }
// });