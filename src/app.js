let data_url = "https://docs.google.com/spreadsheets/d/1BHiW6bJky9cjkZDNz3bcBxrKqcZTq5YNswoNhqJGmYM/edit#gid=0"
let spreadsheet_res = [];
const loading = document.getElementById("loading")
let page_status;

function init() {
    Tabletop.init({
      key: data_url,
      callback: fetchSpreadsheetData,
      simpleSheet: true
    })
  };

function fetchSpreadsheetData(res) {
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
            // for(let i =0; i < 100; i++) {
            //     spreadsheet_res.push(com_geom[i].properties)
            // }
            com_geom.forEach(e => spreadsheet_res.push(e.properties))
            sessionStorage.setItem("session_data", JSON.stringify(spreadsheet_res))
            loading.remove();
            page_status = "loaded"
            if(sessionStorage.getItem("session_data")) {
                tab = JSON.parse(sessionStorage.getItem("session_data"))
            }
    });
};

init();

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
                    <li v-if="pvd.lib_epci">EPCI : {{ pvd.lib_reg }}</li>
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
                    <button id ="back-btn" type="button" class="btn btn-primary" v-if="show" @click="show=false">
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
                    <b>Source des données :</b>
                    ANCT, programme Petites villes de demain
                </p>
                <p>
                    <b>Réalisation :</b>
                    ANCT, <a href = 'https://cartotheque.anct.gouv.fr/cartes' target="_blank">Cartographes</a> du pôle Analyse & diagnostics territoriaux - 01/2021
                </p>
                <p>Technologies utilisées: LeafletJS, Bootstrap, VueJS, Vue2Leaflet, TurfJS, API Adresse / Base adresse nationale</p>
                <p>Le code source de cet outil est consultable sur Github (accès direct par le bouton dédié sur la barre latérale).</p>
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
            cardContent:null
        }
    },
    watch: {
        fromParent() {
            this.show = true;
            this.cardContent = this.fromParent;
        },
    },
    computed: {
        filteredList() {
            // return this.fromParent.slice(0, this.nbResults)
        }
    },
};

let marker;


// init vue-leaflet
let { LMap, LTileLayer, LControlZoom, LMarker, LCircleMarker, LGeoJson, LTooltip, LIcon } = Vue2Leaflet;

let leafletMap = {
    template: `
        <div>
            <leaflet-sidebar ref="sidebar" :fromParent="cardContent"></leaflet-sidebar>
            <div id="mapid"></div>
        </div>`,
    data() {
        return {
            mapOptions: {
                zoom: 6,
                attribution: 'Fond cartographique &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy;, contributeurs <a href="http://openstreetmap.org">OpenStreetMap</a>',
                // enableTooltip: true,
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
                tooltipOptions:{permanent:true, direction:"top", className:'leaflet-clicked-tooltip'},
                options: {
                    radius:8,
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
        }
    },
    components: {
        LMap,
        LTileLayer,
        LControlZoom,
        LCircleMarker,
        LMarker,
        LGeoJson,
        LTooltip,
        LIcon,
        'leaflet-sidebar':leafletSidebar,
    },
    methods: {
        initMap() {
            this.map = L.map('mapid', this.mapOptions);
            
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
            this.cardContent = i;
            if(!marker) {
                marker = new L.marker([i.latitude, i.longitude]).addTo(this.map)
            } else {
                marker.setLatLng([i.latitude, i.longitude])
            }
            this.sidebar.open("home");
            this.clickedMarker.latlng = [i.latitude, i.longitude];
            this.clickedMarker.tooltip = i.lib_com;
        },
        checkPageStatus() {
            if(page_status == undefined) {
                window.setTimeout(this.checkPageStatus,100);
            } else {
                this.sidebar.open('home');

                // clusters
                var markers = L.markerClusterGroup();
                for(let i =0; i < spreadsheet_res.length; i++) {
                    e = spreadsheet_res[i];
                    let marker = L.circleMarker([e.latitude, e.longitude],this.circleMarkerOptions);
                    marker.content = e;
                    marker.bindTooltip(e.lib_com, this.tooltipOptions);
                    markers.addLayer(marker);
                }
                this.map.addLayer(markers);

                markers.on("click", (e) => {
                    this.onClick(e.sourceTarget.content)
                });
            }
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
        }
    },
    mounted() {
        this.initMap();
        this.loadDepGeom();
        init();
        this.checkPageStatus();
    },

}



// ****************************************************************************
// ****************************************************************************


// instance vue
let vm = new Vue({
    el: '#app',
    data() {
        return {

        }
    },
    components: {
        'leaflet-map': leafletMap,
        // 'search-group': search_group_template
    },
});

// fonctions

function onEachFeature(feature, layer) {
    var v = this;
    console.log(this);
  
    layer.on('mouseover', function (e) {
        console.log("yes");
        e.target.setStyle({
            radius:15
        });
    });
    layer.on('mouseout', function (e) {
        e.target.setStyle({
            radius:5
        });
    });
};

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

function joinData(df1,df2) {
    let joined_data = df2.filter(e => {
      return e.insee_com == df1.properties.insee_com
    })
    delete df1.properties.insee_com;
    return joined_data;
  };