let map;
// let pos = getLocation();    
function initMap() {
    // The map, centered at LA.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 34.05223, lng: -118.24368},
        zoom: 12
    });

    // Query Socrata for vacant parking meter spots and plot results.
    // url = "https://data.lacity.org/resource/e7h6-4a3e.json?"
    //     + "occupancystate=VACANT"
    //     + "&$$app_token=ixOdggdMHJEhj3AjuHZ9JlPT4";
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
    fetch('allmeters')
        .then(function (response) {
            // let pos = getLocation();
            // console.log('line 43 position: ' + pos);         
            // return {pos: getLocation(), response: response.json()};
            return response.json();
        // }).then(function(json) {
        //     let pos = getLocation();
        }).then(function (json) {
            // console.log('current position: ' + json.pos);
            // Store locations from json response in an array.
            let locations = [];
            for (let location in json) {                
                locations.push({'space_id': json[location].space_id, 'lat': json[location].lat, 'lng': json[location].lng});
            }

            // Generate markers for each parking meter location.
            let markers = locations.map(function (location) {
                let marker = new google.maps.Marker({
                    position: {'lat': location.lat, 'lng': location.lng},                    
                    title: 'Click for details'
                });
                // Content of info window.                                
                let start_lat = 34.0224;
                let start_lng = -118.2851;
                // let pos = getLocation();                

                let contentString = '<div id="content">'+
                    '<div id="siteNotice">'+
                    '</div>'+
                    '<h1 class="firstHeading">' + location.space_id + '</h1>'+
                    '<div id="bodyContent">'+
                    '<input type="button" id="button-directions" value="Get Directions" onclick="calculateRoute({lat: ' + start_lat + ', lng: ' + start_lng + '}, {lat: ' + location.lat + ', lng: ' + location.lng + '})"/>' +
                    // '<input type="button" id="button-directions" value="Get Directions" onclick="calculateRoute({lat: ' + pos.lat + ', lng: ' + pos.lng + '}, {lat: ' + location.lat + ', lng: ' + location.lng + '})"/>' +
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

            // Style cluster markers.
            let clusterStyles = [
                {
                    textColor: 'black',
                    url: 'https://github.com/justindho/ParkEasyLA/blob/master/img/m1.png?raw=true',
                    height: 50,
                    width: 50
                },
                {
                    textColor: 'black',
                    url: 'https://github.com/justindho/ParkEasyLA/blob/master/img/m2.png?raw=true',
                    height: 50,
                    width: 50
                },
                {
                    textColor: 'black',
                    url: 'https://github.com/justindho/ParkEasyLA/blob/master/img/m3.png?raw=true',
                    height: 50,
                    width: 50
                }
            ];

            let mcOptions = {
                gridSize: 50,
                styles: clusterStyles,
                maxZoom: 15
            };

            // Generate a marker cluster for better UI.
            let markerCluster = new MarkerClusterer(map, markers,
                {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'}
            );
        });
}

// Get user's geolocation.
// AS OF CHROME 50, THE GEOLOCATION API WILL ONLY WORK ON SECURE CONTEXTS SUCH
// AS HTTPS. IF YOUR SITE IS HOSTED ON AN NON-SECURE ORIGIN (SUCH AS HTTP) THE
// REQUESTS TO GET THE USER'S LOCATION WILL NO LONGER FUNCTION.
// function getLocationSuccess() {
//     // Try HTML5 geolocation.
//     let pos;
//     if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(function (position) {
//             pos = {
//                 lat: position.coords.latitude,
//                 lng: position.coords.longitude
//             };
//             console.log('(' + pos.lat + ', ' + pos.lng + ')');
//             return pos;
//             // console.log('POS TYPE: ' + typeof pos);
//             // alert('CURRENT LOCATION: (' + pos.lat + ', ' + pos.lng + ')');
//         });
//         // , function() {
//         //     // handleLocationError(error, infoWindow);
//         // });
//     }
// }
function getLocation() {
    // return new Promise((getLocationSuccess, getLocationFailure) => {
        
    // });
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
    console.log('Inside calculateRoute');
    // Get directions.
    let directionService = new google.maps.DirectionsService;
    let directionsDisplay = new google.maps.DirectionsRenderer;
    let request = {
        origin: startLocation,
        destination: endLocation,
        travelMode: 'DRIVING',
        // transitOptions: TransitOptions,
        // drivingOptions: DrivingOptions,
        unitSystem: google.maps.UnitSystem.IMPERIAL
        // waypoints[]: DirectionsWaypoint,
        // optimizeWaypoints: Boolean,
        // provideRouteAlternatives: Boolean,
        // avoidFerries: True,
        // avoidHighways: Boolean,
        // avoidTolls: Boolean,
        // region: String
    };
    directionService.route(request, function(result, status) {
        if (status == 'OK') {            
            directionsDisplay.setMap(map);
            directionsDisplay.setDirections(result);

        }
        else {
            alert('An error occurred.');
        }
    });
};


// function calculateRoute(startLocation, endLocation) {
//     // Try HTML5 geolocation.
//     let pos;
//     if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(function (position) {
//             pos = {
//                 lat: position.coords.latitude,
//                 lng: position.coords.longitude
//             };

//             // Get directions.
//             let directionService = new google.maps.directionService;
//             let directionsDisplay = new google.maps.DirectionsRenderer;
//             let request = {
//                 origin: pos,
//                 destination: endLocation,
//                 travelMode: 'DRIVING',
//                 // transitOptions: TransitOptions,
//                 // drivingOptions: DrivingOptions,
//                 unitSystem: google.maps.UnitSystem.IMPERIAL
//                 // waypoints[]: DirectionsWaypoint,
//                 // optimizeWaypoints: Boolean,
//                 // provideRouteAlternatives: Boolean,
//                 // avoidFerries: True,
//                 // avoidHighways: Boolean,
//                 // avoidTolls: Boolean,
//                 // region: String
//             };
//             directionService.route(request, function(result, status) {
//                 if (status == 'OK') {
//                     directionsDisplay.setDirections(result);
//                 }
//             });

//             // console.log('(' + pos.lat + ', ' + pos.lng + ')');
//             // return pos;
//             // console.log('POS TYPE: ' + typeof pos);
//             // alert('CURRENT LOCATION: (' + pos.lat + ', ' + pos.lng + ')');
//         });
//         // , function() {
//         //     // handleLocationError(error, infoWindow);
//         // });
//     } else {
//         // Browser doesn't support Geolocation.
//         handleLocationError(error, infoWindow);
//         alert('BROWSER DOESN\'T SUPPORT GEOLOCATION');
//     }
// };