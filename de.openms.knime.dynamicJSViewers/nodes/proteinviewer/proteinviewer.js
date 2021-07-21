(protview_namespace = function() {
	var input = {};
	var _value, _representation;
	var _data;
	
	input.init = function(representation, value, dependencyObjects){
		_value = value
		_representation = representation
		var table = new kt()
		table.setDataTable(representation.inObjects[0])
		_data = []
		var pepIdx = getDataColumnID(representation.options.peptides, representation.inObjects[0])
		var seqIdx = getDataColumnID(representation.options.sequence, representation.inObjects[0])
		var accIdx = getDataColumnID(representation.options.accession, representation.inObjects[0])

		for(var i = 0; i < table.getNumRows(); i++){
			var row = table.getRows()[i]
			_data.push({pep:row.data[pepIdx],prot:row.data[accIdx],seq:row.data[seqIdx]})
		}
		
		// Setup html page
		var body = document.getElementsByTagName('body')[0];
		var html = "<h1>Inferred proteins</h1>";
		
	    html += '<div class="container">\n';
	    html += '\t<div class="mydynatable" id="table"><table class="table table-striped box-shadow--6dp" id="local"><thead><th>prot</th><th>pep</th><th style="display: none">seq</th></thead><tbody></tbody></table></div>\n'
	    html += '\t<div class="protein" id="protein"></div>\n';
	    html += '</div>';

		body.innerHTML = html;
		
		window.Handlebars = dependencyObjects[1];
		
		// Creating table with dynatable
		$('#local').dynatable({
		dataset: {
			records: _data
		},
		features: {
		    paginate: true,
		    search: true,
		    recordCount: false,
		    perPageSelect: true
		},
		inputs: {
		      paginationClass: 'pagination',
		      paginationActiveClass: 'active',
		      paginationDisabledClass: 'disabled'
		}
		});

		// Hover event
		$('tr').not(':first').hover(
		  function () {
		    $(this).css("background","#D6FFFF");
		  }, 
		  function () {
		    $(this).css("background","");
		  }
		);

	
		// Click event
		$('#local tbody').on('click', 'tr', function () {
		   $('#local tbody .selected').removeClass('selected'); // remove existing selections
		   
		   $('td', this).toggleClass('selected'); // toggle new selection

		   // Extract info from this row:
		   var seqname = $('td', this).eq(0).text();
	        var seqtext = $('td', this).eq(2).text();
	        var peptext = $('td', this).eq(1).text();

	        // Create Sequence object (exported from sequence-viewer.js
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
			    };
			    pepidxlist.push({start: pos, end: end});
			  };
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
		   };

		   //Debug:
		   //var alertstr= "";
		   //finallist.forEach( function (pepidx) {
		   //	alertstr += "("+ pepidx.start+ "," + pepidx.end + "), ";
		   //});
		   //alert(alertstr);

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
		});
	};
	
	
	
	function getDataColumnID(columnName, dataTable) {
		var colID = null;
		for (var i = 0; i < dataTable.spec.numColumns; i++) {
			if (dataTable.spec.colNames[i] === columnName) {
				colID = i;
				break;
			};
		};
		return colID;
	};
	
	input.getSVG = function() {
		return null;
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