
var newWhiteBoard = function() {
	var theWhiteboard = {};
	var otherLayers = {};
	var canvas = document.getElementById("my_canvas");
	var context = canvas.getContext('2d');
	var isDrawing = false;
	context.strokeStyle = 'red';
	context.lineWidth = 5;
	context.lineCap = "round";
	var socketToServer = io.connect();

	theWhiteboard.drawAt = function(x, y) {
		if(isDrawing){
			colorCoordinate(x,y);
			socketToServer.emit('drawing', x, y, context.strokeStyle);
		}
	};
	
	function colorCoordinate(x, y) {
		if(!isDrawing){
			context.beginPath();
		    context.moveTo(x,y-5);
	    }  
		context.lineTo(x+2,y-5+2);
		context.stroke();
	}
	
	function newUserCanvas(id){
		var newLayer = {};
		newLayer.domID = "canvas_" + id;
		newLayer.isDrawing = false;
		newLayer.canvas = $("<canvas id='" + newLayer.domID + "' width='" + canvas.width + "' height='" + canvas.height + "'></canvas>");
		return newLayer;
	}
	
	function withColor(color, funcToCall){
	  	var origColor = context.strokeStyle;
		context.strokeStyle = color;
		funcToCall();
		context.strokeStyle = origColor	
	}
	theWhiteboard.startDrawingAt = function(x, y){
		isDrawing = true;
		context.beginPath();
		colorCoordinate(x,y);
		socketToServer.emit("start drawing", x, y, context.strokeStyle);
	}
	theWhiteboard.stopDrawing = function(){
		isDrawing = false;
		context.stroke();
		socketToServer.emit("stop drawing");
	}
	theWhiteboard.setPenColor = function(color){
		context.strokeStyle = color
	};
	theWhiteboard.clear = function() {
		context.fillStyle = "#fff";
		context.fillRect(0, 0, canvas.width, canvas.height);
	};
	
	socketToServer.on('start drawing', function(xCoord, yCoord, color, id) {
	  var userDrawing = otherLayers[id];
	  if(userDrawing) {
	  	userDrawing.isDrawing = true;
	  	userDrawing.context.beginPath();
	  	userDrawing.context.moveTo(xCoord, yCoord);
	  	userDrawing.context.lineTo(xCoord+2, yCoord+2);
	  	userDrawing.context.stroke();
	  }
	});
	
	socketToServer.on('drawing', function(xCoord, yCoord, color, id){
		var userDrawing = otherLayers[id];
		console.log("in the handler!");
		  if(userDrawing && userDrawing.isDrawing) {
			console.log("in the IF");
		  	userDrawing.context.lineTo(xCoord+2, yCoord+2);
		  	userDrawing.context.stroke();
		  }
	});
	
	socketToServer.on('stop drawing', function(xCoord, yCoord, color, id) {
	  var userDrawing = otherLayers[id];
	  if(userDrawing) {
	  	userDrawing.isDrawing = false;
	  	userDrawing.context.stroke();
	  }
	});
	
	socketToServer.on('user count', function(count){
		var wrapper = $("#canvas_wrapper");
		for(var i=1; i <= count; i++){
		  var nextUserLayer = newUserCanvas(i);
		  otherLayers[i] = nextUserLayer;
		  wrapper.append(nextUserLayer.canvas);
		  nextUserLayer.context = document.getElementById(nextUserLayer.domID).getContext("2d");
		  otherLayers[i] = nextUserLayer;	
		}
	});
	
	socketToServer.on('user joined', function(userID) {
	    var wrapper = $("#canvas_wrapper");
		var nextUserLayer = newUserCanvas(userID);
		wrapper.append(nextUserLayer.canvas);
		nextUserLayer.context = document.getElementById(nextUserLayer.domID).getContext("2d");
		otherLayers[userID] = nextUserLayer;	
	});
	
	
	socketToServer.on	
	return theWhiteboard;
}

$(document).ready(function() {
	var whiteboard = newWhiteBoard();

	$("#my_canvas").mousedown(function(e){
		whiteboard.startDrawingAt(e.layerX, e.layerY);
		whiteboard.drawAt(e.layerX, e.layerY);
	});
	$("#my_canvas").mouseup(function(){
		whiteboard.stopDrawing();
	});

	$("#my_canvas").mousemove(function(e) {
		whiteboard.drawAt(e.layerX, e.layerY);	
	});

	$("#clr > div").click(function(){
		whiteboard.setPenColor($(this).css("background-color"));
	});
 
	$("#clear").click(function(){
		whiteboard.clear();
	});
});