
var myLat = 0;
var myLng = 0;
var stations = [];

stations.push({name: "Alewife", lat: 42.395428, lng: -71.142483, prev: -1});                   //0
stations.push({name: "Davis", lat: 42.39674, lng: -71.121815, prev: 0});                       //1
stations.push({name: "Porter Square", lat: 42.3884, lng: -71.11914899999999, prev: 1});        //2
stations.push({name: "Harvard Square", lat: 42.373362, lng :-71.118956, prev: 2});             //3
stations.push({name: "Central Square", lat: 42.365486, lng: -71.103802, prev: 3});             //4
stations.push({name: "Kendall/MIT", lat: 42.36249079, lng: -71.08617653, prev: 4});            //5
stations.push({name: "Charles/MGH", lat: 42.361166, lng: -71.070628, prev: 5});                //6
stations.push({name: "Park Street", lat: 42.35639457, lng: -71.0624242, prev: 6});             //7
stations.push({name: "Downtown Crossing", lat: 42.355518, lng: -71.06022, prev: 7});           //8
stations.push({name: "South Station", lat: 42.352271, lng: -71.05524200000001, prev: 8});      //9
stations.push({name: "Broadway", lat: 42.342622, lng: -71.056967, prev: 9});                   //10
stations.push({name: "Andrew", lat: 42.330154, lng: -71.057655, prev: 10});                    //11
stations.push({name: "JFK/UMass", lat: 42.320685, lng: -71.052391, prev: 11});                 //12
stations.push({name: "North Quincy", lat: 42.275275, lng: -71.029583, prev: 12});              //13
stations.push({name: "Wollaston", lat: 42.2665139, lng: -71.0203369, prev: 13});               //14
stations.push({name: "Quincy Center", lat: 42.251809, lng: -71.005409, prev: 14});             //15
stations.push({name: "Quincy Adams", lat: 42.233391, lng: -71.007153, prev: 15});              //16
stations.push({name: "Braintree", lat: 42.2078543, lng:-71.0011385, prev: 16});                //17
stations.push({name: "Savin Hill", lat: 42.31129, lng: -71.053331, prev: 11});                 //18
stations.push({name: "Fields Corner", lat: 42.300093, lng: -71.061667, prev: 18});             //19
stations.push({name: "Shawmut", lat: 42.29312583, lng: -71.06573796000001, prev: 19});         //20
stations.push({name: "Ashmont", lat: 42.284652, lng: -71.06448899999999, prev: 20});           //21


var request = new XMLHttpRequest();
var myLoc = new google.maps.LatLng(myLat, myLng);
var myOptions = {
    zoom: 13, 
    center: myLoc,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

var map;
var myMarker;
var stationMarkers = [];
var infowindow = new google.maps.InfoWindow();

function init()
{
    map = new google.maps.Map(document.getElementById("map"), myOptions);
    getMyLocation();
}

function getMyLocation() {
    if (navigator.geolocation) { 
        navigator.geolocation.getCurrentPosition(function(position) {
            myLat = position.coords.latitude;
            myLng = position.coords.longitude;
            renderMap();
        });
    }
    else {
        alert("Geolocation is not supported by your web browser.");
    }
}

function renderMap()
{
    myLoc = new google.maps.LatLng(myLat, myLng);

    map.panTo(myLoc);

    myMarker = new google.maps.Marker({
        position: myLoc,
        title: ""
    });
    myMarker.setMap(map);

    renderStations();
    renderPolylines();
    renderSchedules();
    findClosestStation();
}

function renderStations()
{
    for (i=0; i<stations.length; i++){
        var marker = new google.maps.Marker({
            position: {lat: stations[i].lat, lng: stations[i].lng},
            display: stations[i].name, 
            icon: "mbtasymbol.png",
            map: map
        });
        stationMarkers.push(marker);
    }
}

function renderPolylines()
{
    for(i = 21; i > 0; i--){
        var p = new google.maps.Polyline({ 
            path: [{lat: stations[i].lat, lng: stations[i].lng}, {lat: stations[stations[i].prev].lat, lng: stations[stations[i].prev].lng}],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        p.setMap(map);
    }
}

function renderSchedules()
{
    request.open("GET", "https://rocky-taiga-26352.herokuapp.com/redline.json", true);

    request.onload = function(){

        if (request.status == 200){

            data = JSON.parse(request.responseText);
            console.log(data);
            data = data.TripList.Trips;
            for(m = 0; m < stationMarkers.length; m++){
                markerTitle = stationMarkers[m].display;
                for(i = 0; i < data.length; i++){
                    for(j = 0; j < data[i].Predictions.length; j++){
                        if (data[i].Predictions[j].Stop == markerTitle){
                            stationMarkers[m].display += "<p> will arrive in " + Math.floor((data[i].Predictions[j].Seconds)/60) + ":" + ('0' + (data[i].Predictions[j].Seconds)%60).slice(-2) + " minutes going to " + data[i].Destination + "</p>";
                        }
                    }
                }
            }

            for (i=0; i<stations.length; i++){
                marker = stationMarkers[i];
                var infowindow = new google.maps.InfoWindow();
                marker.addListener('click', function() {
                    infowindow.setContent(this.display);
                    infowindow.open(marker.get('map'), this); });
            }
        }
        else{
            renderSchedules();
        }

    }       

    request.send();

}

function findClosestStation(){
    var stationDistances = [];
    var closestStation;
    var shortestDistance = Number.MAX_VALUE;
    for(i = 0; i < stations.length; i++){
        currentDistance = findDistance(myLat, myLng, stations[i].lat, stations[i].lng);
        if(currentDistance < shortestDistance){
            shortestDistance = currentDistance;
            closestStation = i;
        }
    }
    var myInfowindow = new google.maps.InfoWindow();
    myMarker.addListener('click', function() {
        myInfowindow.setContent("<p>You are here! Closest Station is " + stations[closestStation].name + " which is " + Math.round(shortestDistance * 100)/100 + " miles away from you.</p>");
        myInfowindow.open(myMarker.get('map'), this); 
    });
    var p = new google.maps.Polyline({ 
        path: [{lat: stations[closestStation].lat, lng: stations[closestStation].lng}, {lat: myLat, lng:
            myLng}],
            geodesic: true,
            strokeColor: '#0000ff',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    p.setMap(map);


}

function findDistance(lat1, lng1, lat2, lng2){

    Number.prototype.toRad = function() {
       return this * Math.PI / 180;
   }

   var R = 6371; 
   var x1 = lat2-lat1;
   var dLat = x1.toRad();  
   var x2 = lng2-lng1;
   var dLng = x2.toRad();  
   var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLng/2) * Math.sin(dLng/2);  
   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
   var d = (R * c) * 0.625; 

   return d;
}