let map;
let cityMarker;
let radiusCircle;
let directionsService;
let noOfPoints;
let infoWindowListeners = []

document.getElementById('routeForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const city = document.getElementById('city').value;
    const radius = document.getElementById('radius').value;
    noOfPoints = document.getElementById('points').value;
    geocodeCity(city, radius);
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: { lat: 0, lng: 0 }
    });

    directionsService = new google.maps.DirectionsService();
}

function geocodeCity(city, radius) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': city }, function(results, status) {
        if (status == 'OK') {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(12);

            if (cityMarker) cityMarker.setMap(null);
            if (radiusCircle) radiusCircle.setMap(null);

            cityMarker = new google.maps.Marker({
                position: location,
                map: map,
                title: 'City Center'
            });

            radiusCircle = new google.maps.Circle({
                map: map,
                radius: radius * 1609.34, // Convert miles to meters
                fillColor: '#AA0000',
                strokeColor: '#AA0000',
                strokeOpacity: 0.4,
                fillOpacity: 0.1
            });
            radiusCircle.bindTo('center', cityMarker, 'position');

            getElevationPoints(location, radius);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function getElevationPoints(location, radius) {
    const numPoints = 512; 
    const points = generateRandomPoints(location, radius, numPoints);

    const elevator = new google.maps.ElevationService();
    elevator.getElevationForLocations({ 'locations': points }, function(results, status) {
        if (status === 'OK') {
            if (results) {
                const sortedPoints = results.sort((a, b) => a.elevation - b.elevation);
                const lowestPoint = sortedPoints[0];
                const highestPoints = sortedPoints.slice(-noOfPoints).reverse();

                displayResults(lowestPoint, highestPoints);
                generateRoutes(lowestPoint, highestPoints);
            }
        } else {
            alert('Elevation service failed due to: ' + status);
        }
    });
}

function generateRandomPoints(center, radius, numPoints) {
    const points = [];
    const earthRadius = 6371; // Earth's radius in km
    const radiusKm = radius * 1.60934; // Convert miles to km

    for (let i = 0; i < numPoints; i++) {
        const randomDistance = Math.sqrt(Math.random()) * radiusKm;
        const randomAngle = Math.random() * 2 * Math.PI;

        const deltaLat = randomDistance * Math.cos(randomAngle) / earthRadius;
        const deltaLng = randomDistance * Math.sin(randomAngle) / (earthRadius * Math.cos(center.lat() * Math.PI / 180));

        const lat = center.lat() + (deltaLat * 180 / Math.PI);
        const lng = center.lng() + (deltaLng * 180 / Math.PI);

        points.push(new google.maps.LatLng(lat, lng));
    }

    return points;
}

function displayResults(lowestPoint, highestPoints) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML += `
        
        <p>Lowest Point: ${lowestPoint.elevation.toFixed(2)} meters at (${lowestPoint.location.lat().toFixed(6)}, ${lowestPoint.location.lng().toFixed(6)})</p>
        ${highestPoints.map((point, index) => `<div style="background: #28a745;color: white;padding: 10px;border-radius: 10px;margin-bottom:10px;cursor:pointer;" class="list-point-div"><p class="list-point" data-point="${index}"><strong>Highest Point ${index + 1}: </strong> ${point.elevation.toFixed(2)} meters at (${point.location.lat().toFixed(6)}, ${point.location.lng().toFixed(6)})</p></div>`).join('')}
    `;
    console.log(highestPoints)
}

function generateRoutes(lowestPoint, highestPoints) {
    highestPoints.forEach((highestPoint, index) => {
        const waypoint = generateWaypoint(lowestPoint.location, highestPoint.location, index);
        calculateAndDisplayRoute(lowestPoint.location, highestPoint.location, waypoint, index);
    });
}

function generateWaypoint(start, end, index) {
    const deltaLat = (end.lat() - start.lat()) / 3; 
    const deltaLng = (end.lng() - start.lng()) / 3; 

    const waypointLat = start.lat() + deltaLat + (index * 0.001); 
    const waypointLng = start.lng() + deltaLng + (index * 0.001); 

    return new google.maps.LatLng(waypointLat, waypointLng);
}
async function renderVideo(address) {
    const apiKey = 'AIzaSyDkc8ns3VwvlFv2lehPmh-kRYSLtxDydtI';
    const url = `https://aerialview.googleapis.com/v1/videos:renderVideo?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error rendering video:', error);
        return null;
    }
}
async function lookupVideo(videoId) {
    const apiKey = 'AIzaSyDkc8ns3VwvlFv2lehPmh-kRYSLtxDydtI';
    const url = `https://aerialview.googleapis.com/v1/videos:lookupVideo?key=${apiKey}&videoId=${videoId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Render video response:', data);
        return data;
    } catch (error) {
        console.error('Error rendering video:', error);
        return null;
    }
}
async function getVideoMeta(address) {
    const apiKey = 'AIzaSyDkc8ns3VwvlFv2lehPmh-kRYSLtxDydtI';
    const url = `https://aerialview.googleapis.com/v1/videos:lookupVideoMetadata?key=${apiKey}&address=${address}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Render video response:', data);
        return data;
    } catch (error) {
        return null;
    }
}
async function getPostalAddress(lat, lng) {
    const apiKey = 'AIzaSyDkc8ns3VwvlFv2lehPmh-kRYSLtxDydtI'; 
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
            const addressComponents = data.results[0].address_components;
            const countryComponent = addressComponents.find(component => component.types.includes('country'));
            
            if (countryComponent && countryComponent.long_name === 'United States') {
                const address = data.results[0].formatted_address;
                return encodeURIComponent(address);
            } else {
                return null; // Location is not in the US
            }
        } else {
            throw new Error('No results found or error in response.');
        }
    } catch (error) {
        console.error('Error:', error);
        return null; 
    }
}
function calculateAndDisplayRoute(start, end, waypoint, index) {
    const problemsDiv = document.getElementById('problems');

    const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: getRandomColor(),
            strokeWeight: 4,
            strokeOpacity: 0.6
        }
    });

    new google.maps.Marker({
        position: start,
        map: map,
        title: `Start of Routes`,
        label: `L`
    });

    directionsService.route({
        origin: start,
        destination: end,
        waypoints: [{ location: waypoint, stopover: false }],
        travelMode: 'WALKING'
    }, function(response, status) {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            const listPoints = document.querySelectorAll(".list-point-div");
            const route = response.routes[0];
            const leg = route.legs[0];
            let currentStepIndex = 0;
            let infoWindowOpen = false;
            const polylines = [];
            const listDivs = document.querySelectorAll(".list-point-div");
            listDivs[index].innerHTML += '<p><strong>Address: </strong>' + leg.end_address + '</p>'
            const endMarker = new google.maps.Marker({
                position: end,
                map: map,
                title: `End of Route ${index + 1}`,
                label: `H${index + 1}`
            });
            
            
            const infoWindow = new google.maps.InfoWindow();
            listPoints[index].addEventListener("click",(e)=>{
                infoWindow.close()
                clearPolylines()
                google.maps.event.trigger(endMarker, 'click');
                setTimeout(()=>{
                    document.getElementById("showStepsBtn").click()
                },50)
            })
    
            function updateStepInfo(stepIndex ) {
                const step = leg.steps[stepIndex];
                infoWindow.setContent(`
                    <div id="infoWindowContent">
                        <p><strong>Route ${index + 1}</strong></p>
                        <p>Start: ${leg.start_address}</p>
                        <p>End: ${leg.end_address}</p>
                        <p>Distance: ${leg.distance.text}</p>
                        <p>Duration: ${leg.duration.text}</p>
                        <p><strong>Step ${stepIndex + 1}</strong></p>
                        <p>Start: ${step.start_location.lat()}, ${step.start_location.lng()}</p>
                        <p>End: ${step.end_location.lat()}, ${step.end_location.lng()}</p>
                        <p>Distance: ${step.distance.text}</p>
                        <p>Duration: ${step.duration.text}</p>
                        <p>Instruction: ${step.instructions}</p>
                        <button id="prevStepBtn">Previous Step</button>
                        <button id="nextStepBtn">Next Step</button>
                    </div>
                `);
                highlightStep(stepIndex);
                infoWindow.setPosition(step.end_location);
                document.getElementById('prevStepBtn').onclick = previousStep;
                document.getElementById('nextStepBtn').onclick = nextStep;
            }
    
            function highlightStep(stepIndex) {
                clearPolylines();
                leg.steps.forEach((step, idx) => {
                    const polyline = new google.maps.Polyline({
                        path: step.path,
                        strokeColor: idx === stepIndex ? 'red' : 'blue',
                        strokeOpacity: idx === stepIndex ? 1.0 : 0.6,
                        strokeWeight: idx === stepIndex ? 4 : 2,
                        zIndex: idx === stepIndex ? 2 : 1,
                        map: map
                    });
                    polylines.push(polyline);
                    if (idx === stepIndex) {
                        currentPolyline = polyline;
                    }
                });
                addListenersforPolylines()
            }
            
            function clearPolylines() {
                polylines.forEach(polyline => polyline.setMap(null));
                polylines.length = 0;
            }
            function addListenersforPolylines(){
                polylines.forEach((polyline,idx)=>{
                    google.maps.event.addListener(polyline, 'mouseover', () => {
                        console.log(currentStepIndex)
                        polyline.setOptions({
                            strokeColor: 'yellow',
                            strokeOpacity: 1.0,
                            strokeWeight: 6,
                            zIndex: 3
                        });
                    });
                    polylines.forEach((polyline,idx)=>{
                        google.maps.event.addListener(polyline, 'click', () => {
                            updateStepInfo(idx)
                            currentStepIndex = idx
                        });
                    })
                
                    google.maps.event.addListener(polyline, 'mouseout', () => {
                        polyline.setOptions({
                            strokeColor: idx === currentStepIndex ? 'red' : 'blue',
                            strokeOpacity: idx === currentStepIndex ? 1.0 : 0.6,
                            strokeWeight: idx === currentStepIndex ? 4 : 2,
                            zIndex: idx === currentStepIndex ? 2 : 1
                        });
                    });
                })
            }
            
            function previousStep() {
                if (currentStepIndex > 0) {
                    currentPolyline.setMap(null);
                    currentStepIndex--;
                    updateStepInfo(currentStepIndex);
                }
            }
            
            function nextStep() {
                if (currentStepIndex < leg.steps.length - 1) {
                    currentPolyline.setMap(null);
                    currentStepIndex++;
                    updateStepInfo(currentStepIndex);
                }
            }
    
            let endMarkerListener = endMarker.addListener('click', function() {
                if (infoWindowOpen) {
                    infoWindow.close();
                    infoWindowOpen = !infoWindowOpen
                    return
                }
                infoWindow.setContent(`
                    <div id="infoWindowContent">
                        <p><strong>Route ${index + 1}</strong></p>
                        <p>Start: ${leg.start_address}</p>
                        <p>End: ${leg.end_address}</p>
                        <p>Distance: ${leg.distance.text}</p>
                        <p>Duration: ${leg.duration.text}</p>
                        <button id="showStepsBtn">Show Steps</button>
                        <button id="showRouteVideoBtn">Show Video</button>
                    </div>
                `);
                infoWindow.setPosition(end);
                infoWindow.open(map, endMarker);
                infoWindowOpen = true;
                setTimeout(()=>{
                    const showStepsBtn = document.getElementById('showStepsBtn');
                    if (showStepsBtn) {
                        showStepsBtn.onclick = function() {
                            updateStepInfo(0);
                            google.maps.event.addListener(infoWindow, 'closeclick', function(e) {
                                clearPolylines();
                            });
                        };
                    }
                    

                    document.getElementById('showRouteVideoBtn').onclick = async function() {
                        const location = endMarker.getPosition();
                        const postalAddress = await getPostalAddress(location.lat(),location.lng())
                        if(!postalAddress){
                            alert("This feature is just for United States");
                            return
                        }
                        const videoMeta =  await getVideoMeta(postalAddress)
                        if(videoMeta){
                            let response = JSON.parse(videoMeta);
                            let videoId = response.videoId
                            const videoData = await lookupVideo(videoId)
                            console.log(videoData)
                        }else{
                            let renderResponse = await renderVideo(postalAddress)
                            if(renderResponse){
                                console.log(renderResponse)
                            }
                        }
                    };
                },50)
            });
    
        } else {
            problemsDiv.innerHTML += `<p>Route Not found for Route ${index + 1}: ${status}</p>`;
            console.error(`Route ${index + 1} not found: ${status}`);
        }
    });
}
  
  // Example usage:
//   getPostalAddress(60.29054785500306, -109.86553068980447).then(encodedAddress => {
//     console.log('URL Encoded Address:', encodedAddress);
//     renderVideo(encodedAddress).then(data => {
//     if (data) {
//         console.log(data);
//         // You may want to handle further processing here
//     }
// });
//   });
  
// Example usage




function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

google.maps.event.addDomListener(window, 'load', initMap);
