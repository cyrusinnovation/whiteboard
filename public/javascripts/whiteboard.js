
var newCanvasLayer = function(elem) {
	var theCanvasLayer = {};
	var startingColor = 'red';
	var canvasElem = elem;
	var context = document.getElementById(elem.attr("id")).getContext("2d");
	context.strokeStyle = 'red';
	context.lineWidth = 5;
	context.lineCap = "round";
	var isDrawing = false;
	
	theCanvasLayer.startDrawingAt = function(xCoord, yCoord, color) {
		isDrawing = true;
		if(color) { //nasty. only when called by an event from another user
		    context.strokeStyle = color;
	    }
		context.beginPath();
	  	context.moveTo(xCoord, yCoord);
	  	context.lineTo(xCoord+2, yCoord+2);
	  	context.stroke();
	};
	
	theCanvasLayer.continueDrawingAt = function(xCoord, yCoord, color) {
		if(isDrawing) {
			context.lineTo(xCoord+2, yCoord+2);
			context.stroke();
		}
	}
	
	theCanvasLayer.stopDrawing = function() {
		context.stroke();
		isDrawing = false;
	}
	
	theCanvasLayer.setColor = function(color) {
		context.strokeStyle = color;
	}
	
	theCanvasLayer.penColor = function() {
		return context.strokeStyle;
	}
	
	theCanvasLayer.isActivelyDrawing = function() {
		return isDrawing;
	}
	
	theCanvasLayer.clear = function() {
		context.fillStyle = "#fff";
		context.fillRect(0, 0, 799, 500);
	}
	
	return theCanvasLayer;
}

var newUserCanvas = function(id, width, height) {
	var domID = "canvas_" + id;
	var wrapper = $("#canvas_wrapper");
	var canvasElem = $("<canvas id='" + domID + "' width='" + width + "' height='" + height + "'></canvas>");
	wrapper.append(canvasElem);
	return newCanvasLayer(canvasElem); 	
}

var newWhiteBoard = function() {
	var theWhiteboard = {};
	var otherLayers = {};
	var canvas = document.getElementById("my_canvas");
	var myLayer = newCanvasLayer($(canvas));
	var isDrawing = false;
	var socketToServer = io.connect();

	theWhiteboard.drawAt = function(x, y) {
		myLayer.continueDrawingAt(x, y);
		if(myLayer.isActivelyDrawing()){ 
			socketToServer.emit('drawing', x, y, myLayer.penColor);
		}
	};
	
	theWhiteboard.startDrawingAt = function(x, y){
	    myLayer.startDrawingAt(x, y)
		socketToServer.emit("start drawing", x, y, myLayer.penColor());
	}
	theWhiteboard.stopDrawing = function(){
		myLayer.stopDrawing();
		socketToServer.emit("stop drawing");
	}
	theWhiteboard.setPenColor = function(color){
		myLayer.setColor(color);
	};
	theWhiteboard.clear = function() {
		myLayer.clear();
		for(id in otherLayers){
			otherLayers[id].clear();
		}
	};
	
	function addLayerFor(id) {
		otherLayers[id] = newUserCanvas(id, canvas.width, canvas.height);	
	}
	
	socketToServer.on('start drawing', function(xCoord, yCoord, color, id) {
	  var userDrawing = otherLayers[id];
	  if(userDrawing) {
	  	userDrawing.startDrawingAt(xCoord, yCoord, color);
	  }
	});
	
	socketToServer.on('drawing', function(xCoord, yCoord, color, id){
		var userDrawing = otherLayers[id];
		if(userDrawing) {
		    userDrawing.continueDrawingAt(xCoord, yCoord);
		}
	});
	
	socketToServer.on('stop drawing', function(xCoord, yCoord, color, id) {
	  var userDrawing = otherLayers[id];
	  if(userDrawing) {
	  	userDrawing.stopDrawing();
	  }
	});
	
	socketToServer.on('user count', function(count){
		for(var i=1; i <= count; i++){
		  addLayerFor(i);
		}
	});
	
	socketToServer.on('user joined', function(userID) {
	    addLayerFor(userID)
	});
	
	
	return theWhiteboard;
}

$(document).ready(function() {
	var whiteboard = newWhiteBoard();

	$("#my_canvas").mousedown(function(e){
		whiteboard.startDrawingAt(e.layerX, e.layerY);
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