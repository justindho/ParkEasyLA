let map;
function initMap() {
    // The map, centered at LA
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 34.05223, lng: -118.24368},
        zoom: 12
    });
    // Demo marker
    // let marker = new google.maps.Marker({
    //     position: {lat: 34.05223, lng: -118.24368},
    //     map: map
    // });

    // Query Socrata for vacant parking meter spots and plot results
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

    // AJAX request for vacant openings in Socrata data set
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

    // fetch all parking meters from python backend
    fetch('allmeters')
        .then(function (response) {
            return response.json();
        }).then(function (json) {
            // generate a marker for each parking meter
            // for (let meter in json) {
            //     let marker = new google.maps.Marker({
            //         position: {lat: json[meter].lat, lng: json[meter].lng},
            //         map: map
            //     });
            // }

            // store locations from json response in an array
            let locations = [];
            for (let location in json) {
                // locations.push({'lat': json[location].lat, 'lng': json[location].lng});
                locations.push({'space_id': json[location].space_id, 'lat': json[location].lat, 'lng': json[location].lng});
            }

            // generate markers for each parking meter location
            let markers = locations.map(function (location) {
                let marker = new google.maps.Marker({                                
                    position: {'lat': location.lat, 'lng': location.lng},
                    // map: map,
                    title: 'Click for details'                                
                });
                // content of info window
                let contentString = '<div id="content">'+
                    '<div id="siteNotice">'+
                    '</div>'+
                    '<h1 class="firstHeading">' + location.space_id + '</h1>'+
                    '<div id="bodyContent">'+
                    '<p><a href="">Get directions</a></p>'+                                                                
                    '</div>'+
                    '</div>';

                let infowindow = new google.maps.InfoWindow({
                    content: contentString
                });
                
                marker.addListener('click', function() {
                    // zoom and center location upon marker click                                
                    map.setCenter(marker.getPosition());                                                                
                    // popup info window on marker click
                    infowindow.open(map, marker);                                
                });
                return marker;    
                
                // google.maps.event.addEventListener(marker, 'click', (function(marker) {
                //     return function(evt) {
                //         infowindow.setContent('HELLO');
                //         infowindow.open(map, marker);
                //     }
                // })(marker));
            });

            // style cluster markers
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

            // generate a marker cluster for better UI
            let markerCluster = new MarkerClusterer(map, markers,
                {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'}
            );
        });
}

// get user's geolocation
// AS OF CHROME 50, THE GEOLOCATION API WILL ONLY WORK ON SECURE CONTEXTS SUCH 
// AS HTTPS. IF YOUR SITE IS HOSTED ON AN NON-SECURE ORIGIN (SUCH AS HTTP) THE 
// REQUESTS TO GET THE USER'S LOCATION WILL NO LONGER FUNCTION.
function getLocation(infoWindow) {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            let pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            alert('CURRENT LOCATION: (' + pos.lat + ', ' + pos.lng + ')');
        }, function() {
            handleLocationError(error, infoWindow);
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(error, infoWindow);
        alert('BROWSER DOESN\'T SUPPORT GEOLOCATION');
    }
};
getLocation();


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

// get directions from user's current location to parking meter
// function getDirections(lat, lng) {
//     let origin = 
//     let destination = {
//         lat: lat,
//         lng: lng
//     }
//     let directionService = new google.maps.directionService;
//     let directionsDisplay = new google.maps.DirectionsRenderer;
//     directionService.route({
//         origin: origin,
//         destination: destination,
//         travelMode: TravelMode,
//         transitOptions: TransitOptions,
//         drivingOptions: DrivingOptions,
//         unitSystem: UnitSystem,
//         waypoints[]: DirectionsWaypoint,
//         optimizeWaypoints: Boolean,
//         provideRouteAlternatives: Boolean,
//         avoidFerries: Boolean,
//         avoidHighways: Boolean,
//         avoidTolls: Boolean,
//         region: String
//     });
// }