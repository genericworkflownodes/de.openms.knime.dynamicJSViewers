(spectrum_namespace = function() {
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
    	// Store value and representation for later
        _value = value;
        _representation = representation;
        
        d3.select("html").style("width", "100%").style("height", "100%");
        d3.select("body").style("width", "100%").style("height", "100%").style("margin", "0").style("padding", "0");
        
        var body = d3.select("body");
        body.append("h2").attr("id", "tit")
                .style("min-width", MIN_WIDTH + "px").text("Fragmentspectrum");
        layoutContainer = body.append("div").attr("id", "lorikeet")
                .style("min-width", MIN_WIDTH + "px");
        layoutContainer.style("width", 300 + "px")
            .style("height", 400 + "px");
            
        table = new kt();
		    table.setDataTable(_representation.inObjects[0])
        
        for(var i = 0; i < table.getNumRows(); i++){
			    var row = table.getRows()[i]
			    //_data[row.id]={pep:row.data[pepIdx],prot:row.data[accIdx],seq:row.data[seqIdx]}
			    _data[row.rowKey]=i;
		    }

        drawChart(table.getRows()[0]);
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
					drawChart(row);
				}
			}
	};
	
  // Draws the chart. If resizing is true, there are no animations.
  function drawChart(row) {
    var intIdx = getDataColumnID(_representation.options.intensities, _representation.inObjects[0])
  	var seqIdx = getDataColumnID(_representation.options.sequence, _representation.inObjects[0])
  	var mzIdx = getDataColumnID(_representation.options.mz, _representation.inObjects[0])

    var sequence = row.data[seqIdx];
    var varMods = [];
    // TODO parse mods from another column
    // modification index = 14; modification mass = 16.0; modified residue = 'M'
    varMods[0] = {index: 14, modMass: 16.0, aminoAcid: 'M'};
    // mass to be added to the N-terminus
    var ntermMod = 164.07;
    
    var peaks = [];

    var int = JSON.parse(row.data[intIdx]);
    var mz = JSON.parse(row.data[mzIdx]);
    for (i=0; i < int.length; i++) {
      peaks.push([mz[i],int[i]]);
    }
    
    //debug
    //alert(JSON.stringify(peaks))
    
    // peaks in the scan: [m/z, intensity] pairs. E.g.
    /* var peaks = [
    [283.751526,6.493506],
    [287.601379,11.096813],
    [295.031097,2.801403]
    ]
    
    /* render the spectrum with the given options */
    $("#lorikeet").text("") // reset first otherwise it is appended
    	$("#lorikeet").specview({sequence: sequence, 
    								scanNum: 2441,
    								charge: 2,
    								precursorMz: 1012.1,
    								fileName:'sh_1617_JX_070209p_KO410_run1',
    								//staticMods: staticMods, 
    								variableMods: varMods, 
    								ntermMod: ntermMod, 
                                    showInternalIonOption: true,
                                    showMHIonOption: true,
                                    showAllTable: true,
    								//ctermMod: ctermMod,
    								peaks: peaks
    								});
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
        var svg = d3.select("lorikeet")[0][0];
        return (new XMLSerializer()).serializeToString(svg);
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