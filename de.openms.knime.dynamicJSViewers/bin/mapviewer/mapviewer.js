(mapviewer_namespace = function() {
    var input = {};
    var _data ={};
    var layoutContainer;
    var MIN_HEIGHT = 300, MIN_WIDTH = 400;
    var maxY = 0, minY = 0;
    var defaultFont = "sans-serif";
	  var defaultFontSize = 12;
    var _representation, _value;
    var table;
    
    var MISSING_VALUES_ONLY = "missingValuesOnly";
    var IGNORED_MISSING_VALUES = "ignoredMissingValues";
	  var NO_DATA_AVAILABLE = "noDataAvailable";
	  var NO_DATA_COLUMN = "noDataColumn";
    
    input.init = function(representation, value, dependencyObjects) {
      echarts = dependencyObjects[1];
    	// Store value and representation for later
        _value = value;
        _representation = representation;
        
        d3.select("html").style("width", "100%").style("height", "100%");
        d3.select("body").style("width", "100%").style("height", "100%").style("margin", "0").style("padding", "0");
        
        var body = d3.select("body");
        body.append("h2").attr("id", "tit")
                .style("min-width", MIN_WIDTH + "px").text("MS Map View");
        layoutContainer = body.append("div").attr("id", "mapview")
                .style("min-width", MIN_WIDTH + "px");
        layoutContainer.style("width", "100%")
            .style("height", "100%");
            
        table = new kt();
		    table.setDataTable(_representation.inObjects[0])
        
        var intIdx = getDataColumnID(_representation.options.intensities, _representation.inObjects[0])
  	    var rtIdx = getDataColumnID(_representation.options.rt, _representation.inObjects[0])
        var mzIdx = getDataColumnID(_representation.options.mz, _representation.inObjects[0])
        var datat = [];
        datat.push(["RT","MZ","Intensity"])
        for(var i = 0; i < table.getNumRows(); i++){
          var row = table.getRows()[i]
          var inty = JSON.parse(row.data[intIdx]);
          var mz = JSON.parse(row.data[mzIdx])
          for (var j = 0; j < inty.length; j++)
          {
            datat.push([row.data[rtIdx],mz[j],0.]);
            datat.push([row.data[rtIdx],mz[j],inty[j]]);
            datat.push([row.data[rtIdx],mz[j],0.]);
            //datat.push(["-","-","-"]);
            //datat.push([String(row.data[rtIdx]),mz[j],inty[j]]);
          }
          //datat.push(["-","-","-"]); // for line charts so the ends do not get connected
          
		    }

        drawChart(datat);
        drawControls();
    };
    
    drawControls = function() {		
		  if (!knimeService) {
			  // TODO: error handling?
			  //alert("NO KNIMESERVICE")
			  return;
		  }
	    
	    // -- Initial interactivity settings --
      if (knimeService.isInteractivityAvailable()) {
          //alert("Interactive")
          knimeService.subscribeToSelection(_representation.inObjects[0].id, selectionChanged);
      } else {
        //alert("Not Interactive!")
      }
	  };
	
		selectionChanged = function(data) {
		if (data.changeSet) {
			if (data.changeSet.added) {
					var addedId = data.changeSet.added[0];
					var row = table.getRows()[_data[addedId]];
					drawChart();
				}
			}
    };
    
    function drawChart(datat) {
      var chartDom = document.getElementById('mapview');
      var myChart = echarts.init(chartDom);
      var symbolSize = 1;
      option = {
          tooltip: {},
          grid3D: {
            axisPointer: {
                show: false
            },
            viewControl: {
              minBeta: -360,
              maxBeta: 360,
              alpha: 50,
              center: [50, 0, -10],
              distance: 10,
              minDistance: 0,
              zoomSensitivity: 5
            }
          },
          xAxis3D: {
              type: 'value'
          },
          temporalSuperSampling: {
              enable: true
          },
          visualMap: {
              show: false,
              dimension: 2,
              min: 0,
              max: 10000,
              inRange: {
                  color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
                  opacity: [0,1]
              }
          },
          yAxis3D: {type: 'value'},
          zAxis3D: {type: 'value'},
          dataset: {
              dimensions: [
                  'RT','MZ','Intensity'
              ],
              source: datat
          },
          series: [
              {
                  type: 'line3D',
                  //symbolSize: symbolSize,
                  //barSize: 0.05,
                  shading: 'color',
                  encode: {
                      x: 'RT',
                      y: 'MZ',
                      z: 'Intensity'
                      //tooltip: [0, 1, 2]
                  },
                  animation: false
              }
          ]
      };

      option && myChart.setOption(option);
    }
  
  function drawChartOld2() {
    var chartDom = document.getElementById('mapview');
    var myChart = echarts.init(chartDom);
    var option;

    var data = [];
    // Parametric curve
    for (var t = 0; t < 25; t += 0.001) {
        var x = (1 + 0.25 * Math.cos(75 * t)) * Math.cos(t);
        var y = (1 + 0.25 * Math.cos(75 * t)) * Math.sin(t);
        var z = t + 2.0 * Math.sin(75 * t);
        data.push([x, y, z]);
    }
    console.log(data.length);

    option = {
        tooltip: {},
        backgroundColor: '#fff',
        visualMap: {
            show: false,
            dimension: 2,
            min: 0,
            max: 30,
            inRange: {
                color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            }
        },
        xAxis3D: {
            type: 'value'
        },
        yAxis3D: {
            type: 'value'
        },
        zAxis3D: {
            type: 'value'
        },
        grid3D: {
            viewControl: {
                projection: 'orthographic'
            }
        },
        series: [{
            type: 'line3D',
            data: data,
            lineStyle: {
                width: 4
            }
        }]
    };
    option && myChart.setOption(option);
  }
  // Draws the chart. If resizing is true, there are no animations.
  function drawChartOld() {
    var chartDom = document.getElementById('mapview');
    var myChart = echarts.init(chartDom);
    var option;

    option = {
        xAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            data: [150, 230, 224, 218, 135, 147, 260],
            type: 'line'
        }]
    };

    option && myChart.setOption(option);
  }
	
	
	function getDataColumnID(columnName, dataTable) {
		var colID = null;
		for (var i = 0; i < dataTable.spec.numColumns; i++) {
			if (dataTable.spec.colNames[i] === columnName) {
				colID = i;
				break;
			}
		}
		return colID;
	}
	
	input.getSVG = function() {
    return "";
	};
	
	input.validate = function() {
		return true;
	};
	
	input.getComponentValue = function() {
		return _value;
	};
	
	return input;
}()
);