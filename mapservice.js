require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/views/SceneView",
    "esri/layers/ElevationLayer",
    "esri/layers/BaseElevationLayer",
    "esri/Basemap",
    "esri/layers/TileLayer",
    "esri/layers/MapImageLayer",
    ], function(esriConfig,Map, MapView,FeatureLayer,SceneView, ElevationLayer, BaseElevationLayer, Basemap, TileLayer,MapImageLayer)  {

  esriConfig.apiKey = "AAPK56e3ac027f044c4089d8ceec232fc05dYaOuzVRzm8tMRqvzOvDvIEevbqJ85yppn9PacU6cy4duurJrVK9wo_8BcWO8i8bi";
  //创建基本高程图层子类
    const ExaggeratedElevationLayer = BaseElevationLayer.createSubclass({
        // 添加被使用的高程数据
        // 高程数据夸大程度

        properties: {
            exaggeration: 70
        },

        // 当图层被添加时（在视图呈现前）执行load
        load: function () {
            // TopoBathy3D 包含海洋和陆地的高程数据
            this._elevation = new ElevationLayer({
                url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/TopoBathy3D/ImageServer"
            });

            // 当高程图被加载后解析load
            this.addResolvingPromise(
                this._elevation.load().then(() => {
                    // 从高程服务中获取 瓦片图层, 空间参考 和全图扩展
                    this.tileInfo = this._elevation.tileInfo;
                    this.spatialReference = this._elevation.spatialReference;
                    this.fullExtent = this._elevation.fullExtent;
                })
            );

            return this;
        },

        // 提取视图中可见瓦片
        fetchTile: function (level, row, col, options) {
            // 调用高程图层中的 fetchTile()
            // 在视图中可视
            return this._elevation.fetchTile(level, row, col, options).then(
                function (data) {
                    const exaggeration = this.exaggeration;
                    // 设置夸大程度
                    // the width and the height of the tile in pixels,
                    // and the values of each pixel
                    for (let i = 0; i < data.values.length; i++) {
                        //与给定夸大值相乘
                        data.values[i] = data.values[i] * exaggeration;
                    }

                    return data;
                }.bind(this)
            );
        }
    });
    const elvbasemap = new Basemap({
        baseLayers: [
            new TileLayer({
                url: "https://tiles.arcgis.com/tiles/nGt4QxSblgDfeJn9/arcgis/rest/services/terrain_with_heavy_bathymetry/MapServer",
                copyright:
                    'Bathymetry, topography and satellite imagery from <a href="https://visibleearth.nasa.gov/view_cat.php?categoryID=1484" target="_blank">NASA Visible Earth</a> | <a href="http://www.aag.org/global_ecosystems" target="_blank">World Ecological Land Units, AAG</a> | Oceans, glaciers and water bodies from <a href="https://www.naturalearthdata.com/" target="_blank">Natural Earth</a>'
            })
        ]
    });

    const elevationLayer = new ExaggeratedElevationLayer();

    // Add the exaggerated elevation layer to the map's ground
    // in place of the default world elevation service
        //功能1：切换地图的底图


    var map = new Map({
        basemap: "gray"
    });

    var view = new MapView({
        container: "viewDiv01",
        map: map,
        center: [103.71511,34.09042],
        zoom: 3
    });

    document.getElementById("basemap01").addEventListener("click",function(){
        map.basemap= "gray";
    });



    document.getElementById("basemap02").addEventListener("click",function(){
        map.basemap= "national-geographic";
    });

    document.getElementById("basemap03").addEventListener("click",function(){
        map.basemap= "osm";
    });

//功能二：显示地图的比例尺，鼠标等坐标点等
      
      //添加DIV用于显示坐标等信息
    var coordsWidget = document.createElement("div");
    coordsWidget.id = "coordsWidget";
    coordsWidget.className = "esri-widget esri-component";
    coordsWidget.style.padding = "7px 15px 5px";
    view.ui.add(coordsWidget, "bottom-left");

    //显示经纬度、比例尺大小和尺度//
    function showCoordinates(pt) {
        var coords = "Lat/Lon " + pt.latitude.toFixed(3) + " " + pt.longitude.toFixed(3) +
            " | Scale 1:" + Math.round(view.scale * 1) / 1 ;
        coordsWidget.innerHTML = coords;
    }

    // 添加事件显示中心的坐标（在视图停止移动之后） //
    view.watch(["stationary"], function() {
        showCoordinates(view.center);
    });

    // 添加显示鼠标的坐标点//
    view.on(["pointer-down","pointer-move"], function(evt) {
        showCoordinates(view.toMap({ x: evt.x, y: evt.y }));
    });

  //添加图层
  // Trailheads Point feature layer
  var featureLayer01 = new FeatureLayer;
  featureLayer01.url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Earthquakes_Since1970/FeatureServer";

  // Trailheads Line feature layer


  // Trailheads Polygon feature layer
  var featureLayer03 = new FeatureLayer({
    url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer"
  });
  //左侧图层添加
    document.getElementById("basemap04").addEventListener("click",function(){
        map.add(featureLayer01);
    });

    document.getElementById("basemap06").addEventListener("click",function(){
        map.add(featureLayer03);
    });

  //移除图层
    document.getElementById("basemap04").addEventListener("dblclick", function () {
        map.remove(featureLayer01);
    });



    document.getElementById("basemap06").addEventListener("dblclick", function () {
        map.remove(featureLayer03);
    });


  //计算图层数量
  view.map.allLayers.on("change", function(event) {
    var num = event.target.length - 2;
    document.getElementById("Layers").textContent = "Layers： " + num;
  });

  // 显示第二块
    const map02 = new Map({
        basemap: elvbasemap,
        ground: {
            layers: [elevationLayer]
        }
    });

    const view2 = new SceneView({
        container: "viewDiv02",
        map: map02,
        zoom: 4,
        alphaCompositingEnabled: true,
        qualityProfile: "high",
        camera: {
            position: [103.71511,34.09042, 19921223.3],
            heading: 2.03,
            tilt: 0.13
        },
        environment: {
            background: {
                type: "color",
                color: [255, 252, 244, 0]
            },
            starsEnabled: false,
            atmosphereEnabled: false,
            lighting: {
                type: "virtual"
            }
        },
        constraints: {
            altitude: {
                min: 5000000
            }
        },
        popup: {
            dockEnabled: true,
            dockOptions: {
                position: "top-right",
                breakpoint: false,
                buttonEnabled: false
            },
            collapseEnabled: false
        },
        highlightOptions: {
            color: [255, 255, 255],
            haloOpacity: 0.5
        }
    });

    let exaggerated = true;

    document
        .getElementById("exaggerate")
        .addEventListener("click", (event) => {
            if (exaggerated) {
                map02.ground = "world-elevation";
                event.target.innerHTML = "Enable exaggeration";
                exaggerated = false;
            } else {
                map02.ground = {
                    layers: [elevationLayer]
                };
                event.target.innerHTML = "Disable exaggeration";
                exaggerated = true;
            }
        });


    //左右图层同步移动以及缩放
    function LinkMap02(deg) {
        view2.camera.position.longitude = view.center.x;
        view2.camera.position.latitude= view.center.y;
    }
    function catchAbortError(error) {
        if (error.name != "AbortError") {
            console.error(error);
        }
    }
    view.on(["pointer-down","pointer-move"], function(evt) {
        view2.goTo(LinkMap02(60)).catch(catchAbortError);
    });


    function LinkMap01() {
        const camera = view2.camera.clone();
        view.center.x = view2.camera.position.longitude;
        view.center.y = view2.camera.position.latitude;
        return camera;
    }
    view2.on(["pointer-down","pointer-move"], function(evt) {
        LinkMap01();
    });
      
  });



