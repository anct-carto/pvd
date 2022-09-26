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