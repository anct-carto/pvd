/*
    Carte interactive des communes Petites villes de demain
    Hassen Chougar / service cartographie - ANCT
    dependances : Leaflet 1.0.7, vue 2.7, bootstrap 5.2, papaparse 5.3.1
*/


const data_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOLYK3fGTi0MyoFY4iAz9zDsXFy7_t-dni9ijNBKnVZTW540K73BXDYCeUGJN80hXqCqscqX9xO19v/pub?output=csv"
let spreadsheet_res = [];
// let tab = JSON.parse(sessionStorage.getItem("session_data"));
let page_status;

// Chargement données globales ****************************************************************************

// source données
const dataUrl = "https://www.data.gouv.fr/fr/datasets/r/a43bb3ce-8dfb-4503-a9d2-a9c636273235"

// charge depuis session storage ou fetch
async function getData(path) {
    const sessionData = JSON.parse(sessionStorage.getItem("session_data1"));
    if(sessionData) {
        return sessionData
    } else {
        try {
            const data = await fetchCsv(path)
            sessionStorage.setItem('session_data1',JSON.stringify(data));
            return data
        } catch (error) {
            console.error(error)
        }
    }
}

// parse csv (ou tableau issu d'un tableau partagé) en json
function fetchCsv(data_url) {
    return new Promise((resolve,reject) => {
        Papa.parse(data_url, {
            download: true,
            header: true,
            complete: (res) => resolve(res.data.filter(e => e.insee_com != "")),
            error:(err) => reject(err)
        });
    })
}


// ****************************************************************************
// écran chargement 

class LoadingScreen {
    constructor() {
        this.state = {
            isLoading:false
        }
    }
    show() {
        this.state.isLoading = true
    }
    hide() {
        this.state.isLoading = false
    }
}

let loadingScreen = new LoadingScreen();


// écran de chargement
const Loading = {
    template: `
    <div id = "loading" class="w-100 h-100 d-flex flex-column justify-content-center align-items-center">
        <div class="row">
            <div class="spinner-border" role="status">
                <p class="sr-only">Loading...</p>
            </div>
        </div>
        <div class="row">
            <p>Chargement en cours ...</p>
        </div>
    </div>
    `
}

// ****************************************************************************

// composant "barre de recherche"
const SearchBar = {
    template: `
            <div id="search-bar-container">
                <div class="input-group">
                    <input ref = "input" class="form-control shadow-none py-2 border-right-0 border-left-0"
                            id="search-field" type="search"
                            placeholder="Rechercher une commune ..." 
                            v-model="inputAdress"
                            @keyup="onKeypress($event)" 
                            @keydown.down="onKeyDown"
                            @keydown.up="onKeyUp"
                            @keyup.enter="onEnter">
                    </div>
                    <div class="autocomplete-suggestions-conainter" v-if="isOpen">
                        <ul class = "list-group">
                            <li class="list-group-item" v-for="(suggestion, i) in suggestionsList"
                                @click="onClickSuggest(suggestion)"
                                @mouseover="onMouseover(i)"
                                @mouseout="onMouseout(i)"
                                :class="{ 'is-active': i === index }">
                                    {{ suggestion.lib_com }} ({{ suggestion.insee_com }})
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
            codeName:'insee_com',
            libName:'lib_com'
        }
    },
    watch: {
        inputAdress() {
            if (!this.inputAdress) {
                this.isOpen = !this.isOpen;
                this.index = 0;
                this.suggestionsList = [];
            }
        }
    },
    async mounted() {
        document.addEventListener("click", this.handleClickOutside);
        document.addEventListener("keyup", (e) => {
            if(e.key === "Escape") {
                this.isOpen = false;
                this.index = -1;

            }
        });
        this.data = await getData(dataUrl)
    },
    destroyed() {
        document.removeEventListener("click", this.handleClickOutside);
    },
    methods: {
        onKeypress() {
            this.isOpen = true;
            let val = this.inputAdress;

            if(val === '') {
                this.isOpen = false;                
            };

            this.suggestionsList = '';

            if (val != undefined && val != '') {
                result = this.data.filter(e => {
                    return e[this.libName].toLowerCase().replace(/-/g," ").includes(val.toLowerCase())
                });
                this.suggestionsList = result.slice(0,6);
            }
        },
        onKeyUp() {
            if (this.index > 0) {
                this.index = this.index - 1;
            };
        },
        onKeyDown() {
            if (this.index < this.suggestionsList.length) {
                this.index = this.index + 1;
            }
        },
        onMouseover(e) {
            this.index = e;
        },
        onMouseout() {
            this.index = -1;
        },
        onEnter() {
            if(this.suggestionsList[this.index]) {
                this.inputAdress = this.suggestionsList[this.index][this.libName];
                
                suggestion = this.suggestionsList[this.index];
                this.$emit('searchResult',suggestion)

                this.suggestionsList = [];
                this.isOpen = !this.isOpen;
                this.index = -1;                
            }
        },
        onClickSuggest(suggestion) {            
            event.stopPropagation()
            // reset search
            this.inputAdress = suggestion[this.libName];
            
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
};

// ****************************************************************************


const IntroTemplate = {
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

// ****************************************************************************


const CardInfoTemplate = {
    props: ['subtitle', 'element'],
    template:`
        <p v-if="element">
            <span class="subtitle">{{ subtitle }}</span><br>
            <span class="element">{{ element }}</span><br>
        </p>
    `,
};

const RadioSwitch = {
    template: `
    <div class="btn-group-vertical">
        <input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off">
        <label class="btn btn-outline-primary" for="btnradio1">Distribution nationale</label>
        <input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
        <label class="btn btn-outline-primary" for="btnradio2">Répartition par échelon</label>
    </div>
    `,
}

const CardTemplate = {
    template:`
        <div class="card">
            <div class= "card-header">
                <span>{{ obs.lib_com }} ({{ obs.insee_dep }})</span>
            </div>
            <div class= "card-body">
                <info subtitle="Nombre d'habitants en 2017" :element="obs.pop"></info>
                <info subtitle="Département" :element="obs.lib_dep + ' (' + obs.insee_dep + ')'"></info>
                <info subtitle="Région" :element="obs.lib_reg"></info>
                <info subtitle="EPCI" :element="obs.lib_epci"></info>
            </div>
        </div>`,
    props: ['obs'],
    components: {
        'info':CardInfoTemplate,
    }
};

// ****************************************************************************


const LeafletSidebar = {
    template: ` 
    <div id="sidebar" class="leaflet-sidebar collapsed">
        <!-- nav tabs -->
        <div class="leaflet-sidebar-tabs">
            <!-- top aligned tabs -->
            <ul role="tablist">
                <li><a href="#home" role="tab"><i class="fal fa-home"></i></a></li>
                <li><a href="#download" role="tab"><i class="fal fa-download"></i></a></li>
                <li><a href="#a-propos" role="tab"><i class="fal fa-question"></i></a></li>
            </ul>
            <!-- bottom aligned tabs -->
            <ul role="tablist">
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
                <div v-if="!show" class="sidebar-body">
                    <div class="sidebar-header">
                        <img src="img/pvd_logo.png" id="logo-programme"></img>
                    </div><br>
                    <search-group @searchResult="getResult"></search-group><br>
                    <text-intro></text-intro>
                </div>
                <div>
                    <card :obs="cardContent" v-if="show"></card><br>
                    <button id="back-btn" type="button" class="btn btn-primary" v-if="show" @click="onClick">
                        <i class="fa fa-chevron-left"></i>
                        Retour à l'accueil
                    </button>
                </div>
            </div>
            <div class="leaflet-sidebar-pane" id="download">
                <div class="leaflet-sidebar-header">
                    <span>Téléchargement</span>
                    <span class="leaflet-sidebar-close">
                        <i class="fal fa-step-backward"></i>
                    </span>
                </div>
                <h5 style="font-family:'Marianne-Extrabold'">
                    Télécharger les données
                </h5>
                <p>
                    La liste des communes bénéficiaires est disponible sur 
                    <a href='https://www.data.gouv.fr/fr/datasets/programme-petites-villes-de-demain/' target="_blank">data.gouv.fr</a>.
                </p>
                <h5 style="font-family:'Marianne-Extrabold'">
                    Télécharger les cartes
                </h5>
                <p>
                    L'ensemble des cartes régionales et départementales est disponible sur la 
                    <a href='https://cartotheque.anct.gouv.fr/cartes?filters%5Bquery%5D=pvd&current_page=1&category=&page_size=20/' target="_blank">cartothèque de l'ANCT</a>.
                </p>
            </div>
            <div class="leaflet-sidebar-pane" id="a-propos">
                <h2 class="leaflet-sidebar-header">
                    À propos
                    <span class="leaflet-sidebar-close">
                        <i class="fas fa-step-backward"></i>
                    </span>
                </h2>
                <a href="https://agence-cohesion-territoires.gouv.fr/" target="_blank">
                    <img src="img/logo_anct.png" width="100%" style = 'padding-bottom: 5%;'>
                </a>
                <p>
                    <b>Source et administration des données :</b>
                    ANCT, programme Petites villes de demain
                </p>
                <p>
                    <b>Réalisation  et maintenance de l'outil :</b>
                    ANCT, pôle Analyse & diagnostics territoriaux - <a href = 'https://cartotheque.anct.gouv.fr/cartes' target="_blank">Service cartographie</a>
                </p>
                <p>Technologies utilisées : Leaflet, Bootstrap, VueJS</p>
                <p>Le code source de cet outil est libre et consultable sur <a href="https://www.github.com/anct-carto/pvd" target="_blank">Github</a>.</p>
            </div>
        </div>
    </div>`,
    components: {
        'search-group':SearchBar,
        card: CardTemplate,
        'text-intro':IntroTemplate
    },
    props: ['sourceData'],
    data() {
        return {
            show:false,
            cardContent:null,
        }
    },
    watch: {
        sourceData() {
            this.cardContent = this.sourceData;
            this.cardContent ? this.show = true : this.show = false
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

// //////////////////////////////////////////////


const LeafletMap = {
    template: `
        <div>
            <sidebar 
                ref="sidebar" 
                :sourceData="cardContent" 
                @clearMap="clearMap()" 
                @searchResult="onSearchResultReception">
            </sidebar>
            <div id="mapid"></div>
    </div>`,
    components: {
        'sidebar':LeafletSidebar,
    },
    data() {
        return {
            config:{
                map:{
                    container:'mapid',
                    tileLayer:'',
                    attribution:"<a href = 'https://cartotheque.anct.gouv.fr/' target = '_blank'>ANCT</a>",
                    zoomPosition:'topright',
                    scalePosition:'bottomright',
                    initialView:{
                        zoomControl:false,
                        zoom: 6,
                        center: [46.413220, 1.219482],
                        zoomSnap: 0.05,
                        minZoom:4.55,
                        maxZoom:18,
                        preferCanvas:true,
                    }
                },
                sidebar:{
                    container: "sidebar",
                    autopan: true,
                    closeButton: true,
                    position: "left",
                },
            },
            styles:{
                basemap:{
                    dep:{
                        interactive:false,
                        style: {
                            fillColor:"#c0cf8b",
                            fillOpacity:1,
                            color:"white",
                            weight:0.5,
                            opacity:1,
                        },
                    },
                    reg:{
                        interactive:false,
                        style: {
                            fillOpacity:0,
                            weight:1.25,
                            color:'white'
                        },
                    },
                    epci:{
                        interactive:false,
                        style: {
                            fillColor:"#a2b74c",
                            fillOpacity:1,
                            color:"white",
                            weight:0.25,
                            opacity:1,
                        },
                    },
                    drom:{
                        interactive:false,
                        style: {
                            fillOpacity:0,
                            weight:0.5,
                            color:'#293173'
                        },
                    }
                },
                categories:{
                    colors:['#f69000'],
                    values:["pvd"],
                    labels:["Petites villes de demain"],
                },
                features:{
                    default:{
                        radius:5,
                        fill:true,
                        fillOpacity:1,
                        color:"white",
                        weight:1,
                    },
                    clicked:{
                        radius:10,
                        fillOpacity:1,
                        color:"white",
                        opacity:0.75,
                        weight:7,
                    },
                },
                tooltip:{
                    default:{
                        direction:"top",
                        sticky:true,
                        className:'leaflet-tooltip',
                        opacity:1,
                        offset:[0,-15],
                    },
                    clicked:{
                        direction:"top",
                        className:'leaflet-tooltip-clicked',
                        permanent:true,
                        offset:[0,-15],
                    },
                }
            },
            cardContent:null,
        }
    },
    components: {
        'sidebar':LeafletSidebar,
    },
    computed: {
        map() {
            const map = L.map(this.config.map.container, this.config.map.initialView);
            map.attributionControl.addAttribution(this.config.map.attribution);            
            // zoom control, scale bar, fullscreen 
            L.control.zoom({position: this.config.map.zoomPosition}).addTo(map);
            L.control.scale({ position: this.config.map.scalePosition, imperial:false }).addTo(map);
            L.control.fullscreen({
                position:'topright',
                forcePseudoFullScreen:true,
                title:'Afficher la carte en plein écran'
            }).addTo(map);
            // au clic, efface la recherche
            map.on("click",() => {
                event.stopPropagation();
                this.clearMap();
            })
            // au zoom efface le calque (résolution d'un bug)
            map.on("zoomend", () => this.hoveredLayer.clearLayers())
            return map;            
        },
        sidebar() {
            const sidebar = window.L.control.sidebar(this.config.sidebar).addTo(this.map);
            // prevent drag over the sidebar and the legend
            preventDrag(sidebar, this.map);
            return sidebar
        },
        // calques : habillage, marqueurs, étiquettes, marqueur sélectionné
        baseMapLayer() {
            return L.layerGroup({className: 'basemap-layer',interactive:false}).addTo(this.map)
        },
        labelLayer() {
            return L.layerGroup({className: 'label-layer',interactive:false}).addTo(this.map)
        },
        comLayer() {
            return L.layerGroup({className: 'com-layer',interactive:false}).addTo(this.map)
        },
        hoveredLayer() {
            return L.layerGroup({ className: 'hovered-layer' }).addTo(this.map);
        },
        pinLayer() {
            return L.layerGroup({ className: 'pin-layer' }).addTo(this.map);
        },
        propSymbolsDepLayer() {
            return L.layerGroup({}).addTo(this.map);
        },
        propSymbolsRegLayer() {
            return L.layerGroup({}).addTo(this.map);
        },
    },
    async mounted() {
        loadingScreen.show() // pendant le chargement, active le chargement d'écran
        await this.createBasemap(); // créé les géométries d'habillage !!! ne fonctionne pas avec les tuiles vectorielles !!!!
        this.displayToponym(); // affiche les toponymes d'habillage

        this.data = await getData(dataUrl); // charge les données
        this.comGeom = await this.loadGeom("data/centroide-fr-drom-4326-style1-com.geojson") // charge les géométries de travail 
        // this.joinedData = this.joinGeom(this.data,this.comGeom,"insee_com")
        this.joinedData = this.comGeom.features.filter(e => this.data.map(e => e.insee_com).includes(e.properties.insee_com))
        this.createFeatures(this.joinedData); // affiche les géométries de travail

        loadingScreen.hide() // enlève le chargement d'écran

        //////////////////////////////////////////////////

        // NE FONCTIONNE PAS CAR PROPRIETES INITIALES PERDUES .... 
        
        // cercles prop à l'échelle des départements 
        let nbPvdPerDep = countBy(geojsonToJson(this.joinedData),"insee_dep");
        let depGeomCtr = getCentroid(await this.loadGeom("data/fr-drom-4326-pur-style1-dep.geojson"));
        let GeomNbPvdPerDep = this.joinGeom(nbPvdPerDep,depGeomCtr,"insee_dep");
        this.propSymbols(GeomNbPvdPerDep,"nb","insee_dep","insee_dep").addTo(this.propSymbolsRegLayer);

        // cercles prop à l'échelle des regions 
        // let nbPvdPerReg = countBy(geojsonToJson(this.joinedData),"insee_reg");
        // let regGeomCtr = getCentroid(await this.loadGeom("data/fr-drom-4326-pur-style1-reg.geojson"));
        // let GeomNbPvdPerReg = this.joinGeom(nbPvdPerReg,regGeomCtr,"insee_reg");
        // this.propSymbols(GeomNbPvdPerReg,"nb","insee_reg","insee_reg").addTo(this.propSymbolsRegLayer);
    },
    methods: {
        async loadGeom(file) {
            const res = await fetch(file);
            const data = await res.json();
            return data
        },
        // créer le fond de carte (limite dép/reg/ ce que tu veux bref)
        async createBasemap() {
            const depGeom = await this.loadGeom("data/fr-drom-4326-pur-style1-dep.geojson");
            const regGeom = await this.loadGeom("data/fr-drom-4326-pur-style1-reg.geojson");
            const epciGeom = await this.loadGeom("data/fr-drom-4326-pur-style1-epci.geojson");
            const cerclesDromGeom = await this.loadGeom("data/cercles_drom.geojson");

            new L.GeoJSON(depGeom, this.styles.basemap.dep).addTo(this.baseMapLayer);
            new L.GeoJSON(regGeom, this.styles.basemap.reg).addTo(this.baseMapLayer);
            // new L.GeoJSON(epciGeom, this.styles.basemap.epci).addTo(this.baseMapLayer);
            new L.GeoJSON(cerclesDromGeom,this.styles.basemap.drom).addTo(this.baseMapLayer);
        },
        displayToponym() {
            this.loadGeom("data/labels.geojson").then(labelGeom => {
                // déclaration des objets "map" et "layer" comme constantes obligatoire sinon inconnu dans le zoomend avec "this"
                const map = this.map;
                const labelLayer = this.labelLayer;
                
                LToponym(labelGeom,"région").addTo(labelLayer);
                const labelDep = LToponym(labelGeom,"département");
                const labelCan = LToponym(labelGeom,"canton");

                // ajout/suppression étiquettes reg ou dep en fonction du zoom
                map.on('zoomend', function() {
                    let zoom = map.getZoom();
                    switch (true) {
                      case zoom <= 6 :
                        [labelDep,labelCan].forEach(layer => layer.removeFrom(labelLayer))
                        break;
                      case zoom > 6 && zoom <=9:
                        labelDep.addTo(labelLayer);
                        labelCan.removeFrom(labelLayer);
                        break;
                      case zoom > 9 :
                        labelCan.addTo(labelLayer);
                        break;
                    }
                });
            })
        },
        // jointure entre attributs et géométries
        joinGeom(attributs,geometries,id) {
            let arr2Map = attributs.reduce((acc, curr) => {
                acc[curr[id]] = {properties:curr}
                return acc;
            }, {});
            let combined = geometries.features.map(d => Object.assign(d, [arr2Map[d.properties[id]]]));
            combined = combined.filter(e => attributs.map( e => e[id]).includes(e.properties[id]));
            return combined
        },
        createFeatures(geomData) {
            const styleDefault = this.styles.features.default;
            const styleTooltipDefault = this.styles.tooltip.default;
            const getColor = (e) => this.getColor(e);

            for(let i=0;i<geomData.length;i++) {
                let marker = new L.GeoJSON(geomData[i], {
                    filter:(feature) => this.data.map(e=>e.insee_com).includes(feature.properties.insee_com),
                    pointToLayer: function (feature, latlng) {
                        let circleMarker = L.circleMarker(latlng, styleDefault);
                        circleMarker.setStyle({fillColor:getColor("pvd")});
                        circleMarker.bindTooltip(feature.properties.lib_com,styleTooltipDefault);
                        return circleMarker
                    },
                }).on("mouseover", (e) => {
                    e.target.setStyle(this.styles.features.clicked)
                }).on("mouseout",(e) => {
                    e.target.setStyle(styleDefault)
                }).on("click", (e) => {
                    L.DomEvent.stopPropagation(e);
                    this.onClick(e.sourceTarget.feature.properties.insee_com)
                });
                marker.addTo(this.comLayer);
            }
            setTimeout(() => this.sidebar.open('home'), 100);
        },
        onClick(code) {
            // vide la couche si pleine
            this.pinLayer.clearLayers();
            
            // // envoie les infos de l'élément sélectionné au composant "fiche"
            let content = this.data.find(e => e.insee_com == code);
            this.cardContent = content;

            // retrouve la géométrie
            let coordsResult = this.comGeom.features.find(e => e.properties.insee_com == code).geometry.coordinates.reverse();

            // style à appliquer
            let glow = new L.circleMarker(coordsResult,this.styles.features.clicked).addTo(this.pinLayer);
            let circle = new L.circleMarker(coordsResult,this.styles.features.default).addTo(this.pinLayer);
            circle.bindTooltip(content.lib_com,this.styles.tooltip.default).openTooltip()
            circle.setStyle({fillColor:this.getColor("pvd")});
            glow.setStyle({fillColor:this.getColor("pvd")});

            this.sidebar.open("home");
        },
        stylishTooltip(marker) {
            return `<span style="background-color:${this.getColor("pvd")}">${marker.lib_com}</span>`
        },
        onSearchResultReception(result) {
            this.onClick(result.insee_com);
        },
        clearMap() {
            this.cardContent = null;
            this.pinLayer.clearLayers();
        },
        flyToBoundsWithOffset(layer) {
            // cette fonction est utile pour faire décaler le centre de la carte sur le côté droit si le panneau est ouvert
            let offset = document.querySelector('.leaflet-sidebar-content').getBoundingClientRect().width;
            this.map.flyToBounds(layer, { paddingTopLeft: [offset, 0] });
        },
        getColor(type) {
            // cette fonction est utile pour récupérer la bonne couleur de chaque modalité préalablement déterminée
            let color;
            this.styles.categories.values.forEach((v,i) => {
                if(v === type) color = this.styles.categories.colors[i]
            })
            return color
        },
        propSymbols(geom,nbCol,id,lib) {
            const max = geom.reduce((a,b) => {
                return (a.properties[nbCol] > b.properties[nbCol]) ? a : b
            }).properties.nb;

            return new L.GeoJSON(geom, {
                style: {
                    fillColor:'#e57d40',
                    fillOpacity:.5,
                    weight:2,
                    color:'white'
                },
                pointToLayer: (feature, latlng) => {
                    return L.circleMarker(latlng, {
                        radius:Math.sqrt(feature.properties[nbCol])*(35/Math.sqrt(max)),
                    })
                    .bindTooltip(`${String(feature.properties[lib]).toUpperCase()}<br>
                    ${feature.properties[nbCol]} <span class='leaflet-tooltip-info'> communes</span>
                    `)
                    // .on("click", e => this.onClickOnPropSymbols(e, insee_id, tooltipContent));
                },
                onEachFeature: function(feature, layer) {
                    layer.on("mouseover", (e) => e.target.setStyle({fillOpacity:1}))
                         .on("mouseout", (e) => e.target.setStyle({fillOpacity:.5}));
                },
            });
        },
    },
}

// init vue-leaflet
// let { LMap, LTileLayer, LControlZoom, LMarker, LCircleMarker, LGeoJson, LTooltip, LIcon } = Vue2Leaflet;


const LeafletMap1 = {
    template: `
        <div>
            <leaflet-sidebar ref="sidebar" :fromParent="cardContent" @clearMap="removeClickedMarker()" @searchResult="onSearchResultReception"></leaflet-sidebar>
            <div id="mapid"></div>
        </div>`,
    data() {
        return {
            // //////////////////////////////////////////////
            config:{
                map:{
                    container:'mapid',
                    tileLayer:'',
                    attribution:"<a href = 'https://cartotheque.anct.gouv.fr/' target = '_blank'>ANCT</a>",
                    zoomPosition:'topright',
                    scalePosition:'bottomright',
                    initialView:{
                        zoom: 6,
                        center: [46.413220, 1.219482],
                        // zoomSnap: 0.05,
                        minZoom:4.55,
                        maxZoom:18,
                        preferCanvas:true,
                    }
                },
                sidebar:{
                    container: "sidebar",
                    autopan: true,
                    closeButton: true,
                    position: "left",
                },
            },
            styles:{
                basemap:{
                    dep:{
                        interactive:false,
                        style: {
                            fillColor:"#BFCD9C",
                            color:"white",
                            weight:0.5,
                            opacity:1
                        },
                    },
                    reg:{
                        interactive:false,
                        style: {
                            fillOpacity:0,
                            weight:1.25,
                            color:'white'
                        },
                    },
                    epci:{
                        interactive:false,
                        style:{
                            fillOpacity:1,
                            fillColor:"rgba(156,185,77,.1)",
                            weight:0.2,
                            color:'white',
                        }
                    },
                    drom:{
                        interactive:false,
                        style: {
                            fillOpacity:0,
                            weight:0.5,
                            color:'#293173'
                        },
                    }
                },
                categories:{
                    colors:['#f69000','#239ad7',"#469c8b","#e0255b","#42b066","blue","#f18541","#b43070","red",'#293173',"#616db0","#42b066"],
                    values:["pvd", "ti","crte","acv", "ami","fabp","habinclus","cite","cde","fs","passnum","amm"],
                    labels:[],
                },
                features:{
                    default:{
                        fill:true,
                        fillColor:'#5770be',
                        fillOpacity:0.5,
                        color:"white",
                        weight:0.25,
                    },
                    clicked:{
                        radius:10,
                        fillOpacity:1,
                        color:"white",
                        opacity:0.75,
                        weight:7,
                    },
                },
                tooltip:{
                    default:{
                        direction:"top",
                        sticky:true,
                        className:'leaflet-tooltip',
                        opacity:1,
                        offset:[-10,-35],
                        permanent:true
                    },
                    clicked:{
                        direction:"top",
                        className:'leaflet-tooltip-clicked',
                    },
                }
            },
            cardContent:null,
            // //////////////////////////////////////////////
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
            dep_geom:null,
            reg_geom:null,
        }
    },
    components: {
        'leaflet-sidebar':LeafletSidebar,
    },
    computed: {
        map() {
            const map = L.map(this.config.map.container, this.config.map.initialView);
            map.attributionControl.addAttribution(this.config.map.attribution);            
            // zoom control, scale bar, fullscreen 
            L.control.zoom({position: this.config.map.zoomPosition}).addTo(map);
            L.control.scale({ position: this.config.map.scalePosition, imperial:false }).addTo(map);
            L.control.fullscreen({
                position:'topright',
                forcePseudoFullScreen:true,
                title:'Afficher la carte en plein écran'
            }).addTo(map);
            // au clic, efface la recherche
            map.on("click",() => {
                event.stopPropagation();
                this.clearMap();
            })
            // au zoom efface le calque (résolution d'un bug)
            map.on("zoomend", () => this.hoveredLayer.clearLayers())
            return map;            
        },
        sidebar() {
            const sidebar = window.L.control.sidebar(this.config.sidebar).addTo(this.map);
            // prevent drag over the sidebar and the legend
            preventDrag(sidebar, this.map);
            return sidebar
        },
        maskLayer() {
            return L.layerGroup({ className: 'mask-layer' }).addTo(this.map);
        },
        pinLayer() {
            return L.layerGroup({ className: 'pin-layer' }).addTo(this.map);
        }
    },
    mounted() {
        loadingScreen.show() // pendant le chargement, active le chargement d'écran
        if(tab) {
            spreadsheet_res = tab;
            console.info("Loading from session storage");
            setTimeout(() => {                
                page_status = "loaded";
                loadingScreen.hide() // enlève le chargement d'écran
            }, 300);
        } else {
            this.init(); // load data
            console.info("Loading from drive");
        };
        // this.initMap(); // load map
        this.loadDepGeom(); // load dep geojson
        this.checkPageStatus(); // remove loading spinner and load data

        // loadingScreen.hide() // enlève le chargement d'écran
    },
    methods: {
        onClick(i) {
            lib_com = i.lib_com;
            if(!marker) {
                marker = new L.marker([i.latitude, i.longitude]);
                circle = new L.circleMarker([i.latitude, i.longitude], this.clickedMarker.options).addTo(this.map)
                marker.bindTooltip(lib_com, this.clickedMarker.tooltipOptions);
            } else {
                marker.setLatLng([i.latitude, i.longitude])
                marker.setTooltipContent(lib_com)
                circle.setLatLng([i.latitude, i.longitude])
            };
            this.pinLayer.addLayer(marker);
            this.pinLayer.addLayer(circle);
            // send value to children
            this.cardContent = i;
            this.sidebar.open("home");
        },
        onSearchResultReception(e) {
            this.onClick(e);
            this.maskLayer.clearLayers();
            this.map.flyTo([e.latitude, e.longitude], 10, {duration: 1});
        },
        removeClickedMarker() {
            this.cardContent = '';
            this.pinLayer.clearLayers();
            this.maskLayer.clearLayers();
            this.map.flyTo(this.mapOptions.center, this.mapOptions.zoom, { duration: 1});
        },
        flyToBoundsWithOffset(layer) {
            offset = document.querySelector('.leaflet-sidebar-content').getBoundingClientRect().width;
            this.map.flyToBounds(layer, { paddingTopLeft: [offset, 0] });
        },
        getPropSymbols(geom, insee_id, tooltipContent) {
            // geom : geojson object
            // insee_id : id of the feature 
            // tooltipContent : column used for the insee_id of the feature 

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
                        radius:Math.sqrt(feature.properties.nb)*(35/Math.sqrt(max)),
                    }).bindTooltip(
                        String(feature.properties[tooltipContent]).toUpperCase() + 
                        "<br>" + + feature.properties.nb + "<span class='leaflet-tooltip-info'> communes</span>",
                    this.tooltipOptions)
                    .on("click", e=> {
                        this.onClickOnPropSymbols(e, insee_id, tooltipContent)
                        // this.flyToBoundsWithOffset(e)
                        // if(tooltipContent.match("reg")) {
                        //     this.map.flyTo(e.latlng,8, {duration:.5})
                        // } else {
                        //     this.map.flyTo(e.latlng,9.5, {duration:.5})
                        // }
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
        onClickOnPropSymbols(e, insee_id, tooltipContent) {
            // clear content displayed on card
            this.cardContent = '';
            this.pinLayer.clearLayers(); // clear pin layer of previous search
            this.maskLayer.clearLayers(); 

            // get the value to filter geom features
            let id = e.sourceTarget.feature.properties[insee_id];

            // get the correct geometry(dep ou reg) based on tooltip content
            tooltipContent.match("reg") ? geom = this.geom_reg : geom = this.geom_dep;
            let geomBounds = geom.features.filter(d => {
                return d.properties[insee_id] === id
            });

            // this.cardContent = spreadsheet_res.filter(e => {
            //     return e[insee_id] == id
            // });

            this.flyToBoundsWithOffset(new L.GeoJSON(geomBounds));
            
            let mask = L.mask(geomBounds, { color: 'red', fillColor: "rgba(0,0,0,.25)" });
            this.maskLayer.addLayer(mask);
            // this.map.on("zoomend", () => {
            //     this.maskLayer.clearLayers();
            // });
        },
        checkPageStatus() {
            if(page_status == undefined) {
                window.setTimeout(this.checkPageStatus,5);
            } else {

                let reg_layer = L.layerGroup();
                let dep_layer = L.layerGroup();
                let pts_layer = L.layerGroup();

                reg_layer.addLayer(this.getPropSymbols(this.geom_ctr_reg, "lib_reg", "lib_reg"));
                dep_layer.addLayer(this.getPropSymbols(this.geom_ctr_dep, "insee_dep", "lib_dep"));

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

                map.on("zoom", zoomLayerControl);

                function zoomLayerControl() {
                    let zoom_level = map.getZoom();

                    // control layer to display 
                    switch (true) {
                        case (zoom_level <= 6.5):
                            map.addLayer(reg_layer);
                            map.removeLayer(dep_layer);
                            map.removeLayer(pts_layer);
                            break;

                        case (zoom_level > 6.5 && zoom_level < 9):
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
                };

                
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
        async loadGeom(file) {
            const res = await fetch(file);
            const data = await res.json();
            return data
        },
        async createBasemap() {
            const depGeom = await this.loadGeom("data/fr-drom-4326-pur-style1-dep.geojson");
            const regGeom = await this.loadGeom("data/fr-drom-4326-pur-style1-reg.geojson");
            const epciGeom = await this.loadGeom("data/fr-drom-4326-pur-style1-epci.geojson");
            const cerclesDromGeom = await this.loadGeom("data/cercles_drom.geojson");

            new L.GeoJSON(depGeom, this.styles.basemap.dep).addTo(this.baseMapLayer);
            new L.GeoJSON(regGeom, this.styles.basemap.reg).addTo(this.baseMapLayer);
            new L.GeoJSON(epciGeom, this.styles.basemap.epci).addTo(this.baseMapLayer);
            new L.GeoJSON(cerclesDromGeom,this.styles.basemap.drom).addTo(this.baseMapLayer);
        },
        loadDepGeom() {
            promises = [];
            promises.push(fetch("data/fr-drom-4326-pur-style1-dep.geojson"));
            promises.push(fetch("data/fr-drom-4326-pur-style1-reg.geojson"));
            promises.push(fetch("data/cercles_drom.geojson"));
            promises.push(fetch("data/geom_ctr_dep.geojson"));
            promises.push(fetch("data/geom_ctr_reg.geojson"));
            promises.push(fetch("data/fr-drom-4326-pur-style1-epci.geojson"));
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
                this.geom_dep = res[0]
                this.geom_reg = res[1]
                this.geom_ctr_dep = res[3];
                this.geom_ctr_reg = res[4];

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

                    };
                    function createLabelIcon(labelClass,labelText) {
                        return L.divIcon({
                        className: svgText(labelClass),
                        html: svgText(labelText)
                    })
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
            Papa.parse(data_url, {
                download: true,
                header: true,
                complete: (results) => this.fetchSpreadsheetData(results.data)
            });
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
                    loadingScreen.hide() // enlève le chargement d'écran
                });
        }

    },
}



// ****************************************************************************
// ****************************************************************************

const App = {
    template: 
        `<div>
            <loading id="loading" v-if="state.isLoading"></loading>
            <leaflet-map ref="map"></leaflet-map>
        </div>
    `,
    components: {
        'leaflet-map':LeafletMap,
        'loading':Loading,
    },
    data() {
        return {
            state:loadingScreen.state 
        }
    }
}

// instance vue
new Vue({
    el: '#app',
    components: {
        'app': App,
    },
});


// ****************************************************************************
// ****************************************************************************


// Fonctions universelles (utiles dans tous les projets)

// empêcher déplacement de la carte en maintenant/glissant le pointeur de souris sur sidebar
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

// création d'étiquette de repères (chef lieux par ex) 
function LToponym(sourceData,statut) {
    return new L.GeoJSON(sourceData, {
        pointToLayer: (feature,latlng) => L.marker(latlng, {
            icon:createLabelIcon("labelClass", feature.properties.libgeom),
            interactive: false,
            className:"regLabels"
        }),
        filter:(feature) => feature.properties.STATUT == statut,
        className:"labels",
        rendererFactory: L.canvas()
      })
}

function createLabelIcon(labelClass,labelText) {
    return L.divIcon({
        className: svgText(labelClass),
        html: svgText(labelText)
    })
}

function svgText(txt) {
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text x="0" y = "10">'
        + txt + '</text></svg>';
}


// calculer le centroide d'une géométrie (nécessite d'avoir leaflet en dépendance)
function getCentroid(geom) {
    let layer = L.geoJSON(geom)
    let features = [];
    
    layer.eachLayer(e => {
        props = e.feature.properties;
        latlng = e.getBounds().getCenter();
        features.push({
            type:"Feature",
            properties:props,
            geometry:{
                coordinates:[latlng.lng,latlng.lat],
                type:"Point",
            }
        })
    });

    let featureCollection = {
            type:'FeatureCollection',
            features:features 
    };

    return featureCollection;
}

// calculer le nombre d'entités disposant d'un même identifiant unique
function countBy(data,id) {
    let globalCount = data.reduce((total, value) => {
        total[value[id]] = (total[value[id]] || 0) + 1;
        return total;
    }, {});

    // 3/ get insee_id as key 
    globalCount = Object.keys(globalCount).map(key => {
        return { [id]: key, nb:globalCount[key] }
    });

    return globalCount
}

function geojsonToJson(geom) {
    let final = [];
    geom.forEach(e => final.push(e.properties))
    return final
}