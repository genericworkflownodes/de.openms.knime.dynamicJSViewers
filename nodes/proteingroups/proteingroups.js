(protgroup_namespace = function() {
	var input = {};
	var _value, _representation;
	var _data, _prot2Group;
	var _svg;
	var _selectedGroup, _selectedProt;
	
	input.init = function(representation, value, dependencyObjects){
		_value = value
		_representation = representation
		var groupTable = new kt()
		groupTable.setDataTable(representation.inObjects[0])
		var protTable = new kt()
		protTable.setDataTable(representation.inObjects[1])
		
		var groupIdx = getDataColumnID(representation.options.groups, representation.inObjects[0])
		var prot0Idx = getDataColumnID(representation.options.proteins0, representation.inObjects[0])
		var prot1Idx = getDataColumnID(representation.options.proteins1, representation.inObjects[1])
		var pepIdx = getDataColumnID(representation.options.peptides, representation.inObjects[1])
		
		_data = {};
		_prot2Group = {};
		
		for (var r = 0; r < groupTable.getNumRows(); r++) {
			var row = groupTable.getRows()[r];
			var group = row.data[groupIdx];
			var prots = row.data[prot0Idx].split(";");
			
			_data[group] = { name : group, proteins : {} };
			for (var i = 0; i < prots.length; i++) {
				var protein = prots[i];
				_data[group].proteins[protein] = { name : protein, peptides : []};
				_prot2Group[protein] = group;
			}
		}
		
		_selectedGroup = groupTable.getRows()[0].data[groupIdx];
		
		for (var r = 0; r < protTable.getNumRows(); r++) {
			var row = protTable.getRows()[r];
			var prots = row.data[prot1Idx].split(";");
			var pep = row.data[pepIdx];
			
			for (var i = 0; i < prots.length; i++) {
				var protein = prots[i];
				if (_data[_prot2Group[protein]].proteins[protein]) {
					_data[_prot2Group[protein]].proteins[protein].peptides.push(pep);
				}
			}
		}
		
		var groupTable = d3.select("body").append("table").attr("id", "groupTable");
		
		var div = d3.select("body").append("div").attr("id", "tablesDiv");
		var protTable = div.append("table").attr("id", "protTable");
		var pepTable = div.append("table").attr("id", "pepTable");
		
		var svgDiv = d3.select("body").append("div").attr("id", "svgDiv").style({bottom : "0px", right : "0px"});
		
		_svg = svgDiv.append("svg").style({width : "500px", height : "500px"});
		
		var drag = d3.behavior.drag();
		drag.on("drag", function() {
			var svg = d3.select("#svgDiv");
			var bottom = svg.style("bottom");
			var right = svg.style("right");
			right = parseInt(right.substring(0, right.length - 2));
			bottom = parseInt(bottom.substring(0, bottom.length - 2));
			
			svg.style({
				right : (right - d3.event.dx) + "px",
				bottom : (bottom - d3.event.dy) + "px"
			});
		});
		svgDiv.call(drag);
		
		groupTable.append("thead").append("tr").append("th").text("Group");
		protTable.append("thead").append("tr").append("th").text("Protein");
		pepTable.append("thead").append("tr").append("th").text("Peptide");
		
		groupTable.append("tbody");
		protTable.append("tbody");
		pepTable.append("tbody");
		update();
	};
	
	function nameToID(name) {
		return name.replace(/[^A-Za-z0-9]/g, "");
	}
	
	function updateSVG() {
		var proteins = d3.keys(_data[_selectedGroup].proteins);
		var peptides = d3.set();
		for (var i = 0; i < proteins.length; i++) {
			var prot = _data[_selectedGroup].proteins[proteins[i]];
			for (var j = 0; j < prot.peptides.length; j++) {
				peptides.add(prot.peptides[j]);
			}
		}
		peptides = peptides.values();
		
		var pepYPos ={};
		
		var o = d3.scale.ordinal()
		.domain(proteins).rangeBands([0, 500], 0.5);
		
		var pepO = d3.scale.ordinal()
		.domain(peptides).rangeBands([0, 500], 0.5);
		
		for (var i = 0; i < peptides.length; i++) {
			pepYPos[peptides[i]] = pepO.range()[i] + pepO.rangeBand() / 2;
		}
		
		var protData = _svg.selectAll("circle.prot").data(proteins, function(d) { return d; });
		
		protData.exit().remove();
		
		protData.enter().append("circle").attr("class", function(d) { return "highlight prot" + " prot-" + nameToID(d); })
		.attr("cx", o.rangeBand() / 2 + 5)
		.attr("cy", function(d, i) { return o.range()[i] + o.rangeBand() / 2 })
		.attr("r", o.rangeBand() / 2)
		.attr("stroke", "black")
		.attr("fill", "white")
		.on("mouseover", function(d) {
			d3.selectAll(".highlight").classed("highlighted", false);
			d3.selectAll(".prot-" + nameToID(d)).classed("highlighted", true);
		}).on("mouseout", function(d) {
			d3.selectAll(".highlight").classed("highlighted", false);
		})
		.append("title").text(function(d) { return d; });
		
		var o = d3.scale.ordinal()
		.domain(proteins).rangeBands([0, 500], 0.5);
		
		var pepData = _svg.selectAll("circle.pep").data(peptides, function(d) { return d; });
		
		pepData.exit().remove();
		
		pepData.enter().append("circle").attr("class", function(d) { return "highlight pep" + " pep-" + nameToID(d); })
		.attr("cx", 500 - pepO.rangeBand() / 2 - 5)
		.attr("cy", function(d, i) { return pepYPos[d]; })
		.attr("r", pepO.rangeBand() / 2)
		.attr("stroke", "black")
		.attr("fill", "white")
		.on("mouseover", function(d) {
			d3.selectAll(".highlight").classed("highlighted", false);
			d3.selectAll(".pep-" + nameToID(d)).classed("highlighted", true);
		}).on("mouseout", function(d) {
			d3.selectAll(".highlight").classed("highlighted", false);
		})
		.append("title").text(function(d) { return d; });
		
		var lineGroupData = _svg.selectAll("g").data(proteins, function(d) { return d; });
		
		lineGroupData.exit().remove();
		
		lineGroupData.enter().append("g").selectAll("line").data(function(d, i) {
			var protPeps = _data[_selectedGroup].proteins[d].peptides;
			var newData = [];
			for (var j = 0; j < protPeps.length; j++) {
				newData.push({ x1 : o.rangeBand() + 5, y1 : o.range()[i] + o.rangeBand() / 2, x2 : 500 - pepO.rangeBand() - 5, y2 : pepYPos[protPeps[j]] });
			}
			return newData;
		}).enter().append("line")
			.attr("x1", function(d) { return d.x1; })
			.attr("x2", function(d) { return d.x2; })
			.attr("y1", function(d) { return d.y1; })
			.attr("y2", function(d) { return d.y2; })
			.attr("stroke", "black");
	}
	
	function getScrollXY() {
	    var scrOfX = 0, scrOfY = 0;
	 
	    if( typeof( window.pageYOffset ) == 'number' ) {
	        //Netscape compliant
	        scrOfY = window.pageYOffset;
	        scrOfX = window.pageXOffset;
	    } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
	        //DOM compliant
	        scrOfY = document.body.scrollTop;
	        scrOfX = document.body.scrollLeft;
	    } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
	        //IE6 standards compliant mode
	        scrOfY = document.documentElement.scrollTop;
	        scrOfX = document.documentElement.scrollLeft;
	    }
	    return [ scrOfX, scrOfY ];
	}
	
	function update() {
		d3.select("#groupTable").select("tbody").selectAll("tr")
			.data(d3.keys(_data), function(d) { return d; }).enter()
			.append("tr").append("td").attr("class", "groupCell")
			.text(function(d) { return d; })
			.on("click", function(d) {
				_selectedGroup = d;
				_selectedProt = null;
				d3.selectAll(".selected").classed("selected", false);
				d3.select(this).classed("selected", true);
				d3.select("#tablesDiv").style("margin-top", (d3.select(this).node().getBoundingClientRect().top + getScrollXY()[1] - 8) + "px");
				update();
			});
		
		if (_selectedGroup) {
			protData = d3.select("#protTable").select("tbody").selectAll("tr").data(d3.keys(_data[_selectedGroup].proteins), function(d) { return d; });
			protData.exit().remove();
			protData.enter()
			.append("tr").append("td").attr("class", function(d) { return "highlight prot cell" + " prot-" + nameToID(d); })
			.text(function(d) { return d; })
			.on("click", function(d) {
				_selectedProt = d;
				d3.selectAll(".prot.selected").classed("selected", false);
				d3.select(this).classed("selected", true);
				update();
			}).on("mouseover", function(d) {
				d3.selectAll(".highlight").classed("highlighted", false);
				d3.selectAll(".prot-" + nameToID(d)).classed("highlighted", true);
			}).on("mouseout", function(d) {
				d3.selectAll(".highlight").classed("highlighted", false);
			});
			if (_selectedProt) {
				var pepData = d3.select("#pepTable")
					.select("tbody")
					.selectAll("tr")
					.data(_data[_selectedGroup].proteins[_selectedProt].peptides, function(d) { return d; });
				
				pepData.exit().remove();
				
				pepData.enter()
				.append("tr")
				.append("td")
				.attr("class", function(d) { return "highlight pep cell" + " pep-" + nameToID(d); })
				.text(function(d) { return d; })
				.on("mouseover", function(d) {
					d3.selectAll(".highlight").classed("highlighted", false);
					d3.selectAll(".pep-" + nameToID(d)).classed("highlighted", true);
				}).on("mouseout", function(d) {
					d3.selectAll(".highlight").classed("highlighted", false);
				});
			} else {
				d3.select("#pepTable").select("tbody").selectAll("tr").remove();
			}
			updateSVG();
		}
	}
	
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