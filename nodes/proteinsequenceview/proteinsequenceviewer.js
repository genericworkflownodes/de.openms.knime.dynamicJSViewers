(protseq_namespace = function() {
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
                .style("min-width", MIN_WIDTH + "px").text("FOO");
        layoutContainer = body.append("div").attr("id", "protein")
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
		    
		    window.Handlebars = dependencyObjects[1];
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
  		var pepIdx = getDataColumnID(_representation.options.peptides, _representation.inObjects[0])
  		var seqIdx = getDataColumnID(_representation.options.sequence, _representation.inObjects[0])
  		var accIdx = getDataColumnID(_representation.options.accession, _representation.inObjects[0])
  		seqtext = row.data[seqIdx]
  		seqname = row.data[accIdx]
  		peptext = row.data[pepIdx]
      // Create Sequence object (exported from sequence-viewer.js)
      var seq = new Sequence(seqtext, seqname);
      // Find locations of peptides
      var pepidxlist = [];
      var peplist = [];
      //peplist.push({start: 0, end: seqtext.length, color: "black", underscore: false});
      
      peptext.split(",").forEach( function (pep) {
         var start = seqtext.indexOf(pep);
      // Declare variables
      var pos = 0;
      var i = -1;
      var end = -1;
      
      // Search the string multiple times to find all
      // decrease search space each time
      // Think about skipping the whole peptide whenever found?
      while (true) {
        pos = seqtext.indexOf(pep, i + 1);
        i = pos;
        end = pos + pep.length;
        if (pos == -1){
        	break; 
        }
        pepidxlist.push({start: pos, end: end});
      }
      });
      
      pepidxlist.sort( function (a,b) {
       return a.start - b.start;
      });
      
      // Merge overlapping peptides
      var first = true;
      var lastidx = {start: seqtext.length, end: seqtext.length}
      var finallist = []
      pepidxlist.forEach( function (pepidx) {
       if (first) {
       	lastidx = pepidx;
       	first = false;
       } else {
       	if (pepidx.start <= lastidx.end+1) {
       		lastidx.end = pepidx.end;
       	} else {
       		finallist.push(lastidx);
       		lastidx = pepidx;
       	}
       }
      });
      finallist.push(lastidx);
      
      var lastend = -1;
      finallist.forEach( function (pepidx) {
       // if first start is not 0
       if ( pepidx.start > 0){
       	peplist.push({start: lastend+1, end: pepidx.start, color:"black", underscore: false});
       }
       peplist.push({start: pepidx.start, end: pepidx.end, color:"#69CC33", underscore: false});
       lastend = pepidx.end;
      });
      
      if (lastend <= seqtext.length){
       peplist.push({start: lastend, end: seqtext.length, color:"black", underscore: false});
      }
      
      layoutContainer.html("");
      
      // Render sequence to HTML
      seq.render('#protein', {
      'showLineNumbers': true,
      'wrapAminoAcids': true,
      'charsPerLine': 50,
      'toolbar': false,
      'search': true,
      'maxLines' : 20
      });
      
      seq.coverage(peplist);
      
      // Add legend
      var legend = [
        {name: "Identified peptides", color: "#69CC33", underscore: false}
      ];
      seq.addLegend(legend);
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
        var svg = d3.select("protein")[0][0];
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