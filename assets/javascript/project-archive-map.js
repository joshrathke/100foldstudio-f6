var map;

function initialize() {
    
    var styles = [
        {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{
                "color": "#77CCD6"
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [{
                "color": "#FFFFFF"
            }, {
            "weight": 1,
            }]
        }, {
            "featureType": "administrative",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "water",
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{
                "color": "#FFFFFF"
            }]
        }, {
            "featureType": "administrative",
            "elementType": "geometry.fill",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [{
                "visibility": "off"
            }]
        }
    ];
    
    var myOptions = {
        zoom: 2,
        center: new google.maps.LatLng(28.189403, -8.805191),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: styles,
        scrollwheel: false,
    };

    map = new google.maps.Map(document.getElementById('projects-map'), myOptions);
    
    // Initialize Map Markers Object
    var map_markers = {}
    
    $.each( map_project_data, function( index, value ) {
        var marker_position = new google.maps.LatLng(value['country_coords']['latitude'], value['country_coords']['longitude']);
        
        map_markers[index] = new CustomMarker( marker_position, map, {project_count: value['project_count'], country_name: value['country_name']} );
        
        google.maps.event.addListener(map_markers[index], "click", function (e) {
            
            // Remove any existing active classes
            $('.map-marker').removeClass('active');
            
            console.log(index);
            var_infobox.open(map, map_markers[index]);
            
            // Remove Active Class from all Markers Upon InfoBox Closure
            google.maps.event.addListener(var_infobox, 'closeclick', function() {
                $('.map-marker').removeClass('active'); 
            });
            
            // Change class of Map Marker When Active
            $(map_markers[index]['marker_div']).addClass('active');
            
            console.log(map_markers[index]);
        });
    });
    
    
    /**
     * This is probably going to have a be a function that retrieves the necessary
     * info from the provided array of projects.
     */
    
    var contentString =
          '<div class="project-map-modal">'+
                '<div class="row small-up-2">' +
                    '<div class="column">' +
                        '<img src="http://placehold.it/640x360">'+
                    '</div>'+
                    '<div class="column">' +
                        '<img src="http://placehold.it/640x360">'+
                    '</div>'+
                    '<div class="column">' +
                        '<img src="http://placehold.it/640x360">'+
                    '</div>'+
                    '<div class="column">' +
                        '<img src="http://placehold.it/640x360">'+
                    '</div>'+
                    '<div class="column">' +
                        '<img src="http://placehold.it/640x360">'+
                    '</div>'+
                    '<div class="column">' +
                        '<img src="http://placehold.it/640x360">'+
                    '</div>'+
                '</div>'+
          '</div>';
    
    //Set up a test array and try to differnet markers
    console.log(site_url.site_url);

    var var_infobox_props = {
         content: contentString,
        disableAutoPan: false,
        maxWidth: 0,
        pixelOffset: new google.maps.Size(20, -43),
        zIndex: null,
        boxClass: "project-map-modal-container",
        closeBoxMargin: "5px",
        closeBoxURL: site_url['site_url'] + "/wp-content/themes/100foldstudio.org/assets/images/close.png",
        infoBoxClearance: new google.maps.Size(1, 1),
        visible: true,
        pane: "floatPane",
        enableEventPropagation: false
    };

    var var_infobox = new InfoBox(var_infobox_props);

}

function CustomMarker(latlng, map, args) {
        this.latlng = latlng;	
        this.args = args;	
        this.setMap(map);	
    }

    CustomMarker.prototype = new google.maps.OverlayView();

    CustomMarker.prototype.draw = function() {

        var self = this;
        var marker_div = this.marker_div;

        if (!marker_div) {

            marker_div = this.marker_div = document.createElement('div');

            marker_div.className = 'map-marker';

            if (typeof(self.args.marker_id) !== 'undefined') {
                marker_div.dataset.marker_id = self.args.marker_id;
            }
            
            if (typeof(self.args.project_count) !== 'undefined') {
                var marker_string = '<div class="marker-content-container"><div class="closed-marker">' + self.args.project_count + ' Projects</div><div class="open-marker">' + self.args.country_name + '</div></div>';
                
                $(marker_div).html(marker_string);
            }

            google.maps.event.addDomListener(marker_div, "click", function(event) {			
                google.maps.event.trigger(self, "click");
            });

            var panes = this.getPanes();
            panes.overlayImage.appendChild(marker_div);
        }

        var point = this.getProjection().fromLatLngToDivPixel(this.latlng);

        if (point) {
            marker_div.style.left = (point.x - 15) + 'px';
            marker_div.style.top = (point.y - 38) + 'px';
        }
    };

    CustomMarker.prototype.remove = function() {
        if (this.marker_div) {
            this.marker_div.parentNode.removeChild(this.div);
            this.marker_div = null;
        }	
    };

    CustomMarker.prototype.getPosition = function() {
        return this.latlng;	
    };

google.maps.event.addDomListener(window, 'load', initialize);