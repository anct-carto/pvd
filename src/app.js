const loading = document.getElementById("loading");
const data_url = "https://docs.google.com/spreadsheets/d/1BHiW6bJky9cjkZDNz3bcBxrKqcZTq5YNswoNhqJGmYM/edit#gid=0"
let spreadsheet_res = [];
let tab = JSON.parse(sessionStorage.getItem("session_data"));
let page_status;




// ****************************************************************************
// ****************************************************************************

let searchBar = {
    template: `
            <div id="search-bar-container">
                <div class="input-group">
                    <span class="input-group-prepend">
                        <div class="input-group-text bg-white border-right-0">
                            <i class="fal fa-search form-control-icon"></i>
                        </div>
                    </span>
                    <input ref = "input" class="form-control shadow-none py-2 border-right-0 border-left-0"
                            id="search-field" type="search"
                            placeholder="Saisissez une adresse" 
                            v-model="inputAdress"
                            @keyup="onKeypress($event)" 
                            @keydown.down="onKeyDown"
                            @keydown.up="onKeyUp"
                            @keyup.enter="onEnter">
                    </div>
                    <div class="autocomplete-suggestions-conainter" v-if="isOpen">
                        <ul class = "list-group">
                            <li class="list-group-item" v-for="(suggestion, i) in suggestionsList"
                                v-on:click="onClickSuggest(suggestion)"
                                :class="{ 'is-active': i === index }">
                                {{ suggestion.properties.label }}
                            </li>
                        </ul>
                    </div>
            </div>`,
    data() {
        return {
            index:0,
            inputAdress:'',
            isOpen:false,
            suggestionsList:[],
        }
    },
    methods: {
        onKeypress(e) {
            this.isOpen = true;
            let val = this.inputAdress;
            if(val === '') {
                this.isOpen = false;                
            };
            if (val != undefined && val != '') {
                fetch(api_adresse.concat(val, "&autocomplete=1"))
                    .then(res => res.json())
                    .then(res => {
                        let data = [];

                        if(res && res.features) {
                            let features = res.features;
                            features.forEach(e => {
                                data.push(e)
                            });
                        }
                        this.suggestionsList = data
                    }, error => {
                        console.error(error);
                    });
            }
        },
        onKeyUp(e) {
            if (this.index > 0) {
                this.index = this.index - 1;
            }
        },
        onKeyDown(e) {
            if (this.index < this.suggestionsList.length) {
                this.index = this.index + 1;
            }
        },
        onEnter() {
            this.isOpen = !this.isOpen;
            this.inputAdress = this.suggestionsList[this.index].properties.label;

            suggestion = this.suggestionsList[this.index];

            // get address coordinates to pass to map
            let coordinates = suggestion.geometry.coordinates;
            let latlng_adress = [coordinates[1], coordinates[0]];

            // send data
            // directly
            map_component = this.$root.$refs.map;
            map_component.marker = latlng_adress;
            map_component.marker_tooltip = suggestion.properties.label;

            this.suggestionsList = [];
            this.index = -1;
        },
        onClickSuggest(suggestion) {            
            // reset search
            this.inputAdress = suggestion.properties.label;
            this.suggestionsList = [];
            this.isOpen = !this.isOpen;


            // get address coordinates to pass to map
            let coordinates = suggestion.geometry.coordinates;
            let latlng_adress = [coordinates[1], coordinates[0]];

            // send data
            // directly
            map_component = this.$root.$refs.map;
            map_component.marker = latlng_adress;
            map_component.marker_tooltip = suggestion.properties.label;
            // or with global store
            this.address_store.latlng = latlng_adress;
            this.address_store.label = suggestion.properties.label;
        },
        handleClickOutside(evt) {
            if (!this.$el.contains(evt.target)) {
              this.isOpen = false;
              this.index = -1;
            }
        }
    },
    mounted() {
        document.addEventListener("click", this.handleClickOutside);
    },
    destroyed() {
        document.removeEventListener("click", this.handleClickOutside);
    }

};


let introTemplate = {
    template: `
    <div>
        Présentation du programme Petites villes de demain
    </div>`
}

let cardTemplate = {
    template:`
        <div class="card">
            <div class= "card-header">
                <span>{{ pvd.lib_com }}</span>
            </div>
            <div class= "card-body">
                <ul>
                    <li>Département : {{ pvd.lib_dep }} ({{ pvd.insee_dep }})</li>         
                    <li>Région : {{ pvd.lib_reg }}</li>         
                    <li v-if="pvd.lib_epci">EPCI : {{ pvd.lib_epci }}</li>         
                    <li v-if="pvd.pop">Nombre d'habitants : {{ pvd.pop }}</li>         
                    <li v-if="pvd.nom_maire">Nom du Maire : {{ pvd.nom_maire }}</li>         
                    <li v-if="pvd.date_signature">Date de signature de la convention : {{ pvd.date_signature }}</li>         
                    <li v-if="pvd.mel_maire">Contact mairie : {{ pvd.mel_maire }}</li>
                    <li v-if="pvd.site_web">Site web mairie : {{ pvd.site_web }}</li>
                </ul>
            </div>
        </div>`,
    props: ['pvd'],
};

let leafletSidebar = {
    template: ` 
    <div id="sidebar" class="leaflet-sidebar collapsed">
        <!-- nav tabs -->
        <div class="leaflet-sidebar-tabs">
            <!-- top aligned tabs -->
            <ul role="tablist">
                <li><a href="#home" role="tab"><i class="fal fa-home"></i></a></li>
            </ul>
            <!-- bottom aligned tabs -->
            <ul role="tablist">
                <li><a href="#a-propos" role="tab"><i class="fal fa-question"></i></a></li>
                <li><a href="https://github.com/cget-carto/France-services" target="_blank"><i class="fas fa-github"></i></a></li>
            </ul>
        </div>
        <!-- panel content -->
        <div class="leaflet-sidebar-content">
            <div class="leaflet-sidebar-pane" id="home">
                <div class="leaflet-sidebar-header">
                    <span>Accueil</span>
                    <span class="leaflet-sidebar-close">
                        <i class="fal fa-step-backward"></i>
                    </span>
                </div>
                <div>
                    <h2>CECI EST UN PROTOTPYE EN COURS DE DÉVELOPPEMENT</h2>
                    <text-intro v-if="!show"></text-intro>
                    <!--<search-group></search-group><br>-->
                    <card :pvd="cardContent" v-if="show"></card><br>
                    <button id="back-btn" type="button" class="btn btn-primary" v-if="show" @click="onClick">
                        <i class="fa fa-chevron-left"></i>
                        Retour à l'accueil
                    </button>
                </div>
            </div>
            <div class="leaflet-sidebar-pane" id="a-propos">
                <h2 class="leaflet-sidebar-header">
                À propos
                    <span class="leaflet-sidebar-close">
                        <i class="fas fa-step-backward"></i>
                    </span>
                </h2>
                <img src="img/logo_anct.png" width="100%" style = 'padding-bottom: 5%; padding-top: 5%;'>
                <p>
                    <b>Source et administration des données :</b>
                    ANCT, programme Petites villes de demain
                </p>
                <p>
                    <b>Réalisation  et maintenance de l'outil :</b>
                    ANCT, <a href = 'https://cartotheque.anct.gouv.fr/cartes' target="_blank">Cartographes</a> du pôle Analyse & diagnostics territoriaux - 01/2021
                </p>
                <p>Technologies utilisées: Leaflet, Bootstrap, VueJS</p>
                <p>Le code source de cet outil est libre et consultable sur Github (accès via le bouton de la barre latérale).</p>
            </div>
        </div>
    </div>`,
    components: {
        'search-group':searchBar,
        card: cardTemplate,
        'text-intro':introTemplate
    },
    props: ['fromParent'],
    data() {
        return {
            show:false,
            cardContent:null,
        }
    },
    watch: {
        fromParent() {
            this.cardContent = this.fromParent;
            if(this.fromParent) {
                this.show = true;
            }
        },
    },
    computed: {
        filteredList() {
            // return this.fromParent.slice(0, this.nbResults)
        }
    },
    methods: {
        onClick() {
            this.cardContent = '';
            this.show = !this.show;
            this.$emit("clearMap", true) // tell parent to remove clicked marker layer
        }
    },
};

let marker;
let circle;



// init vue-leaflet
let { LMap, LTileLayer, LControlZoom, LMarker, LCircleMarker, LGeoJson, LTooltip, LIcon } = Vue2Leaflet;

let leafletMap = {
    template: `
        <div>
            <leaflet-sidebar ref="sidebar" :fromParent="cardContent" @clearMap="removeClickedMarker()"></leaflet-sidebar>
            <div id="mapid"></div>
        </div>`,
    data() {
        return {
            mapOptions: {
                zoom: 6,
                attribution: 'Fond cartographique &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy;, contributeurs <a href="http://openstreetmap.org">OpenStreetMap</a>',
                center: [46.413220, 1.219482],
                zoomSnap: 0.5,
                maxZoom:18,
                preferCanvas: true,
                zoomControl:false
            },
            data:null,
            map:null,
            sidebar:null,
            circleMarkerOptions: {
                radius:5,
                fillColor:"orange",
                fillOpacity:.9,
                color:"white",
                weight:1
            },
            tooltipOptions: {
                direction:"top",
                sticky:true,
                className:'leaflet-tooltip'
            },
            clickedMarker:{
                latlng:null,
                tooltip:null,
                tooltipOptions:{
                    permanent:true, 
                    direction:"top", 
                    className:'leaflet-tooltip-clicked'
                },
                options: {
                    radius:10,
                    fillOpacity:1,
                    fillColor:"orange",
                    color:"white",
                    opacity:0.85,
                    weight:7,
                }
            },
            geojson: {
                data:null,
                options:{
                    style: {
                        fillColor:"grey",
                        color:"white",
                        weight:0.5,
                        opacity:1
                    },
                    interactive:false
                }
            },
            cardContent:null,
            layerGroup:null
        }
    },
    components: {
        'leaflet-sidebar':leafletSidebar,
    },
    methods: {
        initMap() {
            this.map = L.map('mapid', this.mapOptions); // init map
            
            // zoom control, fullscreen & scale bar
            L.control.zoom({position: 'topright'}).addTo(this.map);
            L.control.fullscreen({
                position:'topright',
                forcePseudoFullScreen:true,
                title:'Afficher la carte en plein écran'
            }).addTo(this.map);
            L.control.scale({ position: 'bottomright', imperial:false }).addTo(this.map);

            // sidebar
            const sidebar = window.L.control.sidebar({
                autopan: true,
                closeButton: true, 
                container: "sidebar", 
                position: "left" 
            }).addTo(this.map);
            this.sidebar = sidebar;
            
            // prevent drag over the sidebar and the legend
            // preventDrag(legend, this.map)
            preventDrag(sidebar, this.map)
            
            
        },
        onClick(i) {
            lib_com = i.lib_com;
            let layer = L.layerGroup({}).addTo(this.map);
            this.layerGroup = layer;
            if(!marker) {
                marker = new L.marker([i.latitude, i.longitude]);
                circle = new L.circleMarker([i.latitude, i.longitude], this.clickedMarker.options).addTo(this.map)
                marker.bindTooltip(lib_com, this.clickedMarker.tooltipOptions);
            } else {
                marker.setLatLng([i.latitude, i.longitude])
                marker.setTooltipContent(lib_com)
                circle.setLatLng([i.latitude, i.longitude])
            };
            layer.addLayer(marker);
            layer.addLayer(circle);
            // send value to children
            this.cardContent = i;
            this.sidebar.open("home");
        },
        removeClickedMarker() {
            this.cardContent = '';
            this.map.removeLayer(this.layerGroup);
            this.map.setView(this.mapOptions.center, this.mapOptions.zoom)
        },
        checkPageStatus() {
            if(page_status == undefined) {
                window.setTimeout(this.checkPageStatus,5);
            } else {
                // clusters
                let markers = L.markerClusterGroup();
                // ajout données
                for(let i=0; i<spreadsheet_res.length; i++) {
                    e = spreadsheet_res[i];
                    let marker = L.circleMarker([e.latitude, e.longitude],this.circleMarkerOptions)
                        .bindTooltip(e.lib_com, this.tooltipOptions)
                            .on("mouseover", (e) => {
                            e.target.setStyle(this.clickedMarker.options)
                        }).on("mouseout",(e) => {
                            e.target.setStyle(this.circleMarkerOptions)
                        }).on("click", (e) => {
                            this.onClick(e.sourceTarget.content)
                        });
                    marker.content = e;
                    markers.addLayer(marker);
                }
                this.map.addLayer(markers);
                setTimeout(() => {
                    this.sidebar.open('home');
                }, 150);
            };
        },
        loadDepGeom() {
            // compute dep
            fetch("data/geom_dep.geojson")
            .then(res => res.json())
            .then(res => {
                this.geojson.data = res;
                if(this.map) {
                    new L.GeoJSON(res, this.geojson.options).addTo(this.map)
                }
            })
        },
        init() {
            Tabletop.init({
              key: data_url,
              callback: this.fetchSpreadsheetData,
              simpleSheet: true
            })
        },
        fetchSpreadsheetData(res) {
            fetch("data/geom_com2020.geojson")
                .then(res => res.json())
                .then(com_geom => {
                    com_geom = com_geom.features;            
                    // 1/ filtre
                    com_geom = com_geom.filter(e => {
                        if(res.filter(f => f.insee_com == e.properties.insee_com).length >0) {
                            return e
                        }
                    });
                    // 2 jointure
                    com_geom.forEach(e => {
                        res.forEach(d => {
                            if(e.properties.insee_com == d.insee_com) {
                                for (var key of Object.keys(d)) {
                                    e.properties[key] = d[key]
                                }
                            }
                        })
                    });
                    // 3 tableau final
                    com_geom.forEach(e => spreadsheet_res.push(e.properties))
                    sessionStorage.setItem("session_data", JSON.stringify(spreadsheet_res))
                    page_status = "loaded";
                    loading.remove();
            });
        }

    },
    mounted() {
        console.log(this.$parent);

        if(tab) {
            spreadsheet_res = tab;
            console.info("Loading from session storage");
            setTimeout(() => {                
                page_status = "loaded";
                loading.remove();
            }, 300);
        } else {
            this.init(); // load data
            console.info("Loading from drive");
        };
        this.initMap(); // load map
        this.loadDepGeom(); // load dep geojson
        this.checkPageStatus(); // remove loading spinner
    },
}



// ****************************************************************************
// ****************************************************************************


// instance vue
let vm = new Vue({
    el: '#app',
    components: {
        'leaflet-map': leafletMap,
    },
    methods: {

    },
});


// ****************************************************************************
// ****************************************************************************
// fonctions


function preventDrag(div, map) {
    // Disable dragging when user's cursor enters the element
    div.getContainer().addEventListener('mouseover', function () {
        map.dragging.disable();
    });

    // Re-enable dragging when user's cursor leaves the element
    div.getContainer().addEventListener('mouseout', function () {
        map.dragging.enable();
    });
};


//   Canvas marker (test)

                // let ciLayer = L.canvasIconLayer({}).addTo(this.map);
                // icon = L.icon({
                //     iconUrl: './img/icon_pvd.png',
                //     iconSize: [15, 15],
                //     iconAnchor: [10, 0]
                // });
                // markers = [];
                // for(let i in spreadsheet_res) {
                //     e = spreadsheet_res[i]
                //     marker = L.marker([e.latitude, e.longitude],  {icon: icon});
                //     marker.bindTooltip(e.lib_com, this.tooltipOptions)
                //     marker.on("click", (e) => {
                //         alert("oucou");
                //     })
                //     markers.push(marker)
                // }
                // ciLayer.addLayers(markers)
                // ciLayer.addEventListener("click", e => {
                //     console.log(e);
                //     this.onClick(e.sourceTarget.content)

                // })
