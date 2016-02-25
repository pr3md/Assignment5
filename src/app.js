//MODULE

var fm = angular.module('FlickrMap', ['ngRoute']);


//ROUTES

fm.config(function($routeProvider){
   $routeProvider
       .when('/', {
           templateUrl: 'views/home.html',
           controller: 'homeController'
       })

       .when('/access_token=:accessToken', {
            template: '',
            controller: function($location, $rootScope) {
                var hash = $location.path();

                var access = hash.indexOf("=");
                var token = hash.indexOf("&");
                var access_token = hash.substr(access+1,token);
                $rootScope.accessToken = access_token;
                $location.path('/FlickrMap')
            }
       })

       .when('/FlickrMap', {
           templateUrl: 'views/FlickrMap.html',
           controller: 'FlickrController'
       })
});


fm.controller('homeController', function($scope) {
    $scope.login = function() {
        var client_id = "386682331479-8ts74nidtgpg59o3pae2tjiggnl9ab7o.apps.googleusercontent.com";
        var scope = "profile";
        var redirect_uri = "http://localhost:63342/FlickrMap";
        var response_type = "token";
        var gAuthURL = "https://accounts.google.com/o/oauth2/auth?scope="+scope+"&client_id="+client_id+"&redirect_uri="+redirect_uri+"&response_type="+response_type;
        window.location.replace(gAuthURL);
    }
});

fm.controller('FlickrController', function($scope, $http, $rootScope){
    var map;
    var mapOptions;
    var geocoder = new google.maps.Geocoder();
    var infowindow = new google.maps.InfoWindow;
    $scope.root = $rootScope;
    $scope.username;
    $scope.area;
    $scope.city;
    var locations = [
        []
    ];
    $scope.init = function () {

        $http.get("https://www.googleapis.com/plus/v1/people/me?access_token="+$scope.root.accessToken)
            .success(function(userDetails){
                console.log(userDetails.displayName);
                angular.element(document.querySelector('#username')).html("<img src='"+userDetails.image.url+"' style='border-radius:40px'> "+userDetails.displayName);
            });

        navigator.geolocation.getCurrentPosition(function (position) {

            $scope.lat = position.coords.latitude;
            $scope.lng = position.coords.longitude;
            $scope.pos = new google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude);


            var mapOptions = {
                zoom: 12    ,
                center: $scope.pos
            };

            map = new google.maps.Map(document.getElementById('map-canvas'),
                mapOptions);

            var marker = new google.maps.Marker({
                position: $scope.pos,
                map: map
            });
            geocoder.geocode({ 'latLng': $scope.pos}, function (results, status) {
                var result = results[0];
                var city = '';
                var state = '';


                for (var i = 0, len = result.address_components.length; i < len; i++) {
                    var ac = result.address_components[i];

                    if (ac.types.indexOf('locality') >= 0) {
                        $scope.city = ac.long_name;
                    }

                    if (ac.types.indexOf('administrative_area_level_1') >= 0) {
                        $scope.state = ac.short_name;
                    }
                }
                console.log($scope.city+" "+$scope.state);
                $scope.getFlickrData();
            });

        });

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    };

    $scope.getFlickrData = function() {
        console.log("Flickr:"+$scope.city+", "+$scope.state);
        $http.get("https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=430da80c77c3bd48cc973feecfcf186d&tags="+$scope.city+"&tag_mode=any&text="+$scope.city+"&privacy_filter=1&per_page=200&accuracy=11&safe_search=1&content_type=1&extras=geo&format=json&nojsoncallback=1")
        //$http.get("https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=430da80c77c3bd48cc973feecfcf186d&tags=Kansas%20City&tag_mode=any&text=Kansas%20City,%20MO&privacy_filter=1&per_page=200&accuracy=11&safe_search=1&content_type=1&extras=geo&format=json&nojsoncallback=1")
            .success(function(data){

                //console.log(data);
                //farm-id,server-id,id,secret
                //https://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
                console.log(data)
                for(var i=0;i<200;i++) {
                    if(data.photos.photo[i].latitude!=0){
                        console.log("Found");
                        var row = [];
                        var url = "'https://farm"+data.photos.photo[i].farm+".staticflickr.com/"+data.photos.photo[i].server+"/"+data.photos.photo[i].id+"_"+data.photos.photo[i].secret+".jpg'";
                        row.push(url);
                        var lat1 = data.photos.photo[i].latitude;
                        row.push(lat1);
                        var lng1 = data.photos.photo[i].longitude;
                        row.push(lng1);
                        //locations.push("['https://farm"+data.photos.photo[i].farm+".staticflickr.com/"+data.photos.photo[i].server+"/"+data.photos.photo[i].id+"_"+data.photos.photo[i].secret+".jpg'"+","+data.photos.photo[i].latitude+","+data.photos.photo[i].longitude+"]");
                        locations.push(row);
                    }
                }
                console.log(locations);
                for (i = 0; i < locations.length; i++) {
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(locations[i][1], locations[i][2]),
                        map: map
                    });

                    google.maps.event.addListener(marker, 'click', (function(marker, i) {
                        return function() {
                            infowindow.setContent("<img src="+locations[i][0]+">");
                            infowindow.open(map, marker);
                        }
                    })(marker, i));
                }

            })

    }

});