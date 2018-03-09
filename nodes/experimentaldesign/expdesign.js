(expdesign_namespace = function() {
	var input = {};
	var _value, _representation;
	var _data;
	
	// I think there are currently some problems with the order of dependency objects
	input.init = function(representation, value, dependencyObjects){
		_value = value
		_representation = representation
		// Use the KNIME Table (kt)
		var table = new kt()
		table.setDataTable(representation.inObjects[0])
		var annotatedTable = table
		_data = []
		var specIdx = getDataColumnID(representation.options.spectradata, representation.inObjects[0])

		for(var i = 0; i < table.getNumRows(); i++){
			var row = table.getRows()[i]
			_data.push({spectrumFiles:input.baseName(row.data[specIdx]),sample:'<input type="text" name="sample[]"/>',assay:'<input type="text" name="assay[]"/>',addStudyVariable:''})
		}
		
		// Setup html page
		var body = document.getElementsByTagName('body')[0];
		var html = "<h1>Experimental Design</h1>";
		
	    html += '<div class="container">\n';
	    html += '\t<div class="mydynatable" id="table"><table class="table table-striped box-shadow--6dp" id="local"><thead><th data-dynatable-no-sort=true>Spectrum Files</th><th data-dynatable-no-sort=true>Sample</th><th data-dynatable-no-sort=true>Assay</th><th data-dynatable-no-sort=true><button style="width: 170px; height: 25px" class="addColumn">Add Study Variable</button></th></thead><tbody></tbody></table></div>\n'
	    html += '<button id="btnGo">Submit</button></div>';

		body.innerHTML = html;
		
		window.Handlebars = dependencyObjects[1];
		
		// Creating table with dynatable
		$('#local').dynatable({
		dataset: {
			records: _data
		},
		features: {
		    paginate: false,
		    search: false,
		    recordCount: false,
		    perPageSelect: false
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
		
		// Add column button clicked -> popup to enter new col name
	    $("table button.addColumn").click(function () {
	        var $this = $(this), $table = $this.closest('table')
	        var columnName = window.prompt("Enter Column name\n", "");
	        
	        $('<th data-dynatable-no-sort=true>' + columnName +'</th>').insertBefore($table.find('tr').first().find('th:last'))
	        
	        var idx = $(this).closest('td').index() + 1;
	        $('<td><input type="text" name="col' + idx + '[]" value="" /</td>').insertBefore($table.find('tr:gt(0)').find('td:last'))
	    });
	    
	    //var outTable={'@class': 'org.knime.core.data.StringValue', value: 'val'};
	     var outTable={		'@class': 'org.knime.js.core.JSONDataTable',
	                   		id: 'annotatedTable',
	                   		rows:
	     							[
		     							 {
		     								 rowKey: "Row1",
		     								 data: ["wtf", "wtf2"]
			     						 }
	     							],
	     					spec:
	     						{
	     							'@class': 'org.knime.js.core.JSONDataTableSpec',
	     							numColumns: 2,
	     							numRows: 1,
	     							colTypes: ["STRING","STRING"],
	     							colNames: ["foo","bar"]
	     						}
	     			 };

	     //For adding rows
	    //_value.outTables.annotatedTable = {};
		//for (var i = 0; i < table.getNumRows(); i++) {
		//	var row = table.getRows()[i];
		//	_value.outTables.annotatedTable[row.rowKey] = row.data;
		//}

	    _value.tables['annotatedTable'] = outTable;
	    $('#btnGo').click(function(){
	            $('table').find('tr').not(':first').each(function(){
	                var id = this.cells[0].innerHTML;
	                //alert(id);
	                var row={};
	                $(this).find('input,select,textarea').each(function(){
	                    row[$(this).attr('name')]={'@class': "STRING", value: $(this).val()};
	                    //row[$(this).attr('name')].'@class' = "String";
	                });
	                
	                //outTable[{'@class': 'String', rowid: id}] = row;
	                outTable[id] = row;
	            });
	            alert(JSON.stringify(outTable));
	            _value.tables['annotatedTable'].table = outTable;
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
		
		// if (!('annotatedTable' in _value.tables)){
		// 	//alert(JSON.stringify(_value));
		// 	//var table = new kt();
		// 	//table.setDataTable(_representation.inObjects[0]);
		//      var outTable={		'@class': 'org.knime.js.core.JSONDataTable',
  //       		id: 'annotatedTable',
  //       		rows:
		// 				[
		// 					 {
		// 						 rowKey: "Row1",
		// 						 data: ["wtf", "wtf2"]
  // 						 }
		// 				],
		// 		spec:
		// 			{
		// 				'@class': 'org.knime.js.core.JSONDataTableSpec',
		// 				numColumns: 2,
		// 				numRows: 1,
		// 				colTypes: ["STRING","STRING"],
		// 				colNames: ["foo","bar"]
		// 			}
		//  };
		// 	_value.tables['annotatedTable'] = outTable;
		// }
		
		return _value;
	};
	
	input.baseName = function(str){
	   var base = new String(str).substring(str.lastIndexOf('/') + 1); 
	    if(base.lastIndexOf(".") != -1)       
	        base = base.substring(0, base.lastIndexOf("."));
	   return base;
	}
	
	return input;
}()
);