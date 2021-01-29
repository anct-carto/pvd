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
                            placeholder="Saisissez un nom de commune" 
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
                                    {{ suggestion.lib_com }} ({{ suggestion.insee_dep }})
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
    computed: {
        data() {
            return spreadsheet_res
        }
    },
    methods: {
        onKeypress(e) {
            this.isOpen = true;
            let val = this.inputAdress;

            if(val === '') {
                this.isOpen = false;                
            };

            this.suggestionsList = '';

            if (val != undefined && val != '') {
                result = this.data.filter(e => {
                    return e.lib_com.toLowerCase().includes(val.toLowerCase())
                });
                this.suggestionsList = result.slice(0,5);
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
            this.inputAdress = this.suggestionsList[this.index].lib_com;
            
            suggestion = this.suggestionsList[this.index];
            
            this.suggestionsList = [];
            this.index = -1;
            
            this.$emit('searchResult',suggestion)
        },
        onClickSuggest(suggestion) {            
            // reset search
            this.inputAdress = suggestion.lib_com;
            
            this.suggestionsList = [];
            this.isOpen = !this.isOpen;

            this.$emit('searchResult',suggestion);
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
        
        <div>
            <h5><b>
                Révéler le potentiel des petites villes pour des territoires de cohésion au cœur de la relance.
                </b>
            </h5>
            <p>
                <b>Petites villes de demain</b> vise à améliorer les conditions de vie des habitants des petites communes et des territoires alentour, en accompagnant les collectivités dans des trajectoires dynamiques et respectueuses de l’environnement.
            </p>
            <p>
                Lancé le 1er octobre par Jacqueline Gourault, ministre de la cohésion des territoires et des relations avec les collectivités territoriales, le programme a pour objectif de donner aux maires de communes de moins de 20 000 habitants exerçant des fonctions de centralités les moyens de concrétiser leurs projets de territoire, sur toute la durée de leur mandat.
            </p>
            <p>
                Le programme Petites villes de demain est piloté par l’Agence nationale de la cohésion des territoires. Ce programme bénéficie de la mobilisation de différents ministères, et de l’implication de nombreux partenaires, notamment l’Association des petites villes de France. Les partenaires financiers s’investissent résolument : la Banque des territoires, l’Anah, le Cerema, et l’Ademe.
            </p>
            <p>
                <b>L’offre de services</b> du programme rassemble les outils et expertises apportés par l’ensemble des partenaires nationaux et locaux, et s’organise autour de <b>3 piliers</b> : 
                <ul>
                    <li>- Le <b>soutien en ingénierie</b> pour donner aux collectivités les moyens de définir et mettre en œuvre leur projet de territoire, en particulier par le renforcement des équipes (par exemple, avec une subvention d’un poste de chef de projet jusqu’à 75%), et l’apport d’expertises externes. </li>
                    <li>- Des <b>financements</b> sur des mesures thématiques ciblées mobilisées en fonction du projet de territoire et des actions à mettre en place. </li>
                    <li>- <b>L’accès à un réseau</b>, grâce au Club Petites villes de demain, pour favoriser le partage d’expériences entre pairs.</li>
                </ul>
            </p>
            <h5>Nous contacter</h5>
            <p>Vous êtes une collectivité et souhaitez amender ou ajouter des informations ? Ecrivez-nous à <a href='mailto:petitesvillesdedemain@anct.gouv.fr'>petitesvillesdedemain@anct.gouv.fr</a>
            <h5>En savoir plus sur le programme : </h5>
            <p>
            <a href='http://petitesvillesdedemain.anct.gouv.fr' target="_blank">petitesvillesdedemain.anct.gouv.fr</a>
            </p>
        </div>
    </div>`
};

let cardInfoTemplate = {
    props: ['subtitle', 'element'],
    template:`
        <p v-if="element">
            <span class="subtitle">{{ subtitle }}</span><br>
            <span class="element">{{ element }}</span><br>
        </p>
    `,
};

let radioSwitch = {
    template: `
    <div class="btn-group-vertical">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off">
        <label class="btn btn-outline-primary" for="btnradio1">Distribution nationale</label>
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
        <label class="btn btn-outline-primary" for="btnradio2">Répartition par échelon</label>
    </div>
    `,
}

let cardTemplate = {
    template:`
        <div class="card">
            <div class= "card-header">
                <span>{{ pvd.lib_com }} ({{ pvd.insee_dep }})</span>
            </div>
            <div class= "card-body">
                <info subtitle="Nombre d'habitants en 2017" :element="pvd.pop"></info>
                <info subtitle="Département" :element="pvd.lib_dep + ' (' + pvd.insee_dep + ')'"></info>
                <info subtitle="Région" :element="pvd.lib_reg"></info>
                <info subtitle="EPCI" :element="pvd.lib_epci"></info>
            </div>
        </div>`,
    props: ['pvd'],
    components: {
        'info':cardInfoTemplate,
    }
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
                <div v-if="!show">
                    <div class="sidebar-header">
                        <img src="img/pvd_logo.png" id="logo-programme"></img>
                    </div><br>
                    <search-group @searchResult="getResult"></search-group><br>
                    <text-intro></text-intro>
                </div>
                <div>
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
                <a href="https://agence-cohesion-territoires.gouv.fr/" target="_blank">
                    <img src="img/logo_anct.png" width="100%" style = 'padding-bottom: 5%; padding-top: 5%;'>
                </a>
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
        },
        getResult(result) {
            this.$emit('searchResult', result)
        }
    },
};

let marker;
let circle;



// init vue-leaflet
// let { LMap, LTileLayer, LControlZoom, LMarker, LCircleMarker, LGeoJson, LTooltip, LIcon } = Vue2Leaflet;

let leafletMap = {
    template: `
        <div>
            <leaflet-sidebar ref="sidebar" :fromParent="cardContent" @clearMap="removeClickedMarker()" @searchResult="onSearchResultReception"></leaflet-sidebar>
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
                radius:7,
                fillColor:"#e57d40",
                fillOpacity:.9,
                color:"white",
                weight:1.5
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
                    fillColor:"#e57d40",
                    color:"white",
                    opacity:0.85,
                    weight:7,
                }
            },
            geojson: {
                data:null,
                options:{
                    style: {
                        fillColor:"#BFCD9C",
                        color:"white",
                        weight:0.5,
                        opacity:1
                    },
                    interactive:false
                }
            },
            cardContent:null,
            layerGroup:null,
            dep_geom:null,
            reg_geom:null,
        }
    },
    components: {
        'leaflet-sidebar':leafletSidebar,
    },
    methods: {
        initMap() {
            this.map = L.map('mapid', this.mapOptions); // init map
            // attribution
            this.map.attributionControl
            .addAttribution("<a href = 'https://cartotheque.anct.gouv.fr/' target = '_blank'>ANCT</a>");
            
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

            const toggleLayer = L.control({position: 'topleft'});
            toggleLayer.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'leaflet-toggle-layer');
                div.innerHTML = radioSwitch.template;
                return div;
            };
            // toggleLayer.addTo(this.map)

            // prevent drag over the sidebar and the legend
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
        onSearchResultReception(e) {
            this.onClick(e);
            this.map.flyTo([e.latitude, e.longitude], 10, {duration: 1});
        },
        removeClickedMarker() {
            this.cardContent = '';
            this.map.removeLayer(this.layerGroup);
            this.map.flyTo(this.mapOptions.center, this.mapOptions.zoom, { duration: 1})
        },
        getPropSymbols(geom, insee_id, tooltipContent) {
            // geom : geojson object
            // insee_id: 

            // 1/ get unique insee_ids
            let ids = Array.from(new Set(spreadsheet_res.map(( { insee_id } ) => insee_id)));

            // 2/ count number of pvd per insee_id
            let data_nb_pvd = spreadsheet_res.reduce((total, value) => {
                total[value[insee_id]] = (total[value[insee_id]] || 0) + 1;
                return total;
            }, {});

            // 3/ get insee_id as key 
            data_nb_pvd = Object.keys(data_nb_pvd).map(key => {
                return { insee_id: key, nb:data_nb_pvd[key] }
            });

            // 4/ left join
            geom.features.forEach(e => {
                data_nb_pvd.forEach(d => {
                    if(e.properties[insee_id] == d.insee_id) {
                        for (var key of Object.keys(d)) {
                            e.properties[key] = d[key]
                        }
                    }
                })
            });

            // 5/ get max value for proportionnal symbols 
            let max = data_nb_pvd.reduce((a,b) => {
                return (a.nb > b.nb) ? a : b
            }).nb;
            
            // 6/ draw geojson
            geom_nb_pvd = new L.GeoJSON(geom, {
                pointToLayer: (feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius:Math.sqrt(feature.properties.nb)*(30/Math.sqrt(max)),
                    }).bindTooltip(
                        String(feature.properties[tooltipContent]).toUpperCase() + 
                        "<br>" + + feature.properties.nb + "<span class='leaflet-tooltip-info'> communes</span>",
                    this.tooltipOptions)
                    .on("click", e=> {
                        if(tooltipContent.match("reg")) {
                            this.map.flyTo(e.latlng,8, {duration:.5})
                        } else {
                            this.map.flyTo(e.latlng,9.5, {duration:.5})
                        }
                    });
                },
                onEachFeature: function(feature, layer) {
                    layer.on("mouseover", (e) => e.target.setStyle({fillOpacity:1}))
                         .on("mouseout", (e) => e.target.setStyle({fillOpacity:.5}));
                },
                style: {
                    fillColor:'#e57d40',
                    fillOpacity:.5,
                    weight:2,
                    color:'white'
                },
            });

            return geom_nb_pvd;
        },
        checkPageStatus() {
            if(page_status == undefined) {
                window.setTimeout(this.checkPageStatus,5);
            } else {
                // clusters
                let markers = L.markerClusterGroup();

                let reg_layer = L.layerGroup();
                let dep_layer = L.layerGroup();
                let pts_layer = L.layerGroup();

                reg_layer.addLayer(this.getPropSymbols(this.geom_reg, "lib_reg", "lib_reg"));
                dep_layer.addLayer(this.getPropSymbols(this.geom_dep, "insee_dep", "lib_dep"));

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
                    pts_layer.addLayer(marker)
                };
                map = this.map;
                map.addLayer(reg_layer)

                map.on("zoom", () => {
                    let zoom_level = map.getZoom();

                    // control layer to display 
                    switch (true) {
                        case (zoom_level <= 6.5):
                            map.addLayer(reg_layer);
                            map.removeLayer(dep_layer);
                            map.removeLayer(pts_layer);
                            break;
                            
                        case (zoom_level > 6.5 && zoom_level <9) :
                            map.addLayer(dep_layer);
                            map.removeLayer(reg_layer);
                            map.removeLayer(pts_layer);
                            break;
                        
                        case (zoom_level >= 9):
                            map.addLayer(pts_layer);
                            map.removeLayer(dep_layer);
                            map.removeLayer(reg_layer);
                            break;
                    }

                });

                
                setTimeout(() => {
                    this.sidebar.open('home');
                    // change center to get map offset when sidebar is open
                    this.mapOptions.center = this.map.getCenter();
                    new_center = this.map.getCenter();
                    this.mapOptions.center[1] = new_center.lng;
                    this.new_center
                }, 150);
            };
        },
        loadDepGeom() {
            promises = [];
            promises.push(fetch("data/geom_dep.geojson"));
            promises.push(fetch("data/geom_reg.geojson"));
            promises.push(fetch("data/cercles_drom.geojson"));
            promises.push(fetch("data/geom_ctr_dep.geojson"));
            promises.push(fetch("data/geom_ctr_reg.geojson"));
            promises.push(fetch("data/geom_epci.geojson"));
            promises.push(fetch("data/labels.geojson"));

            Promise.all(promises).then(async([a, b, c, d, e, f, g]) => {
                const aa = await a.json();
                const bb = await b.json();
                const cc = await c.json();
                const dd = await d.json();
                const ee = await e.json();
                const ff = await f.json();
                const gg = await g.json();
                return [aa, bb, cc, dd, ee, ff, gg]
            }).then(res => {
                let map = this.map;
                this.geom_dep = res[3];
                this.geom_reg = res[4];
                if(map) {
                    cercles_drom = new L.GeoJSON(res[2], {
                        interactive:false,
                        style: {
                            fillOpacity:0,
                            weight:1,
                            color:'white'
                        }
                    }).addTo(map);

                    geom_dep = new L.GeoJSON(res[0], this.geojson.options).addTo(map);

                    geom_reg = new L.GeoJSON(res[1], {
                        interactive:false,
                        style: {
                            fillOpacity:0,
                            weight:1.25,
                            color:'white'
                        }
                    }).addTo(map)


                    geom_epci = new L.GeoJSON(res[5], {
                        interactive:false,
                        style: {
                            fillOpacity:1,
                            fillColor:"rgba(156,185,77,.1)",
                            weight:0.2,
                            color:'white'
                        }
                    }).addTo(map)

                    labelReg = new L.GeoJSON(res[6], {
                        pointToLayer: function (feature, latlng) {
                          return L.marker(latlng,{
                            icon:createLabelIcon("labelClassReg", feature.properties.libgeom),
                            interactive: false,
                            className:"regLabels"
                          })
                        },
                        filter : function (feature, layer) {
                          return feature.properties.STATUT == "région";
                        },
                        className:"regLabels",
                        rendererFactory: L.canvas()
                      }).addTo(map);

            
                    labelDep = new L.GeoJSON(res[6], {
                        pointToLayer: function (feature, latlng) {
                          return L.marker(latlng,{
                            icon:createLabelIcon("labelClassDep", feature.properties.libgeom),
                            interactive: false
                          })
                        },
                        filter : function (feature, layer) {
                          return feature.properties.STATUT == "département";
                        },
                        className:"depLabels",
                        rendererFactory: L.canvas()
                      });

                      map.on('zoomend', function() {
                        let zoom = map.getZoom();
            
                        switch (true) {
                          case zoom < 8 :
                            labelDep.remove()
                            break;
                          case zoom >= 8 && zoom < 9:
                            labelDep.addTo(map);
                            break;
                        }
                      });

                    function createLabelIcon(labelClass,labelText){
                    return L.divIcon({
                        className: svgText(labelClass),
                        html: svgText(labelText)
                    })
                    };
                    function svgText(txt) {
                    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text x="0" y = "10">'
                    + txt + '</text></svg>';
                    }
                      
                }
            }).catch((err) => {
                console.log(err);
              });;
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
        this.checkPageStatus(); // remove loading spinner and load data
        // this.onClick(spreadsheet_res[1])
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
