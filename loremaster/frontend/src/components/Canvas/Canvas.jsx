import React, { Component } from 'react';
import axios from 'axios';
import FrontData from 'form-data';
import './Canvas.css';

const tool = {
    BRUSH : 'brush',
    ERASE : 'erase',
    FILL : 'fill',
    SQUARE : 'square'
}

const terrain = {
    BLANK : '#FFFFFF',
    GRASS : '#0C8F00',
    STONE : '#7A7A7A',
    SAND : '#D1CB92',
    DIRT: '#4D4924',
    WATER : '#1897F2',
    LAVA : '#FFB300'
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    let output = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    return output.toUpperCase();
}

function isTerrain(color){
    switch(color){
        case terrain.BLANK:
        case terrain.GRASS:
        case terrain.STONE:
        case terrain.SAND:
        case terrain.DIRT:
        case terrain.WATER:
        case terrain.LAVA:
            return true;
            break;

        default:
            return false;
            break;
    }
}

class Canvas extends Component{
    canvas = null;
    context = null;
    brushSize = null;

    constructor(props){
        super(props);
        this.state={
            isPainting : false,

            clicks : new Array(),
            prevClicks : new Array(),

            mapWidth : this.props.width,
            mapHeight : this.props.height,
            styleWidth : 0,
            styleHeight : 0,
            canvasName : this.props.canvasName,

            toolMode : tool.BRUSH,
            toolTerrain : terrain.GRASS,
            toolSize : 5,

            isDrawingSquare : false,
            squarePos1 : {x: 0, y: 0},
            squarePos2 : {x: 0, y: 0}
        };

        this.canvasOnClick = this.canvasOnClick.bind(this);
        this.canvasOnMove = this.canvasOnMove.bind(this);
        this.canvasOnUp = this.canvasOnUp.bind(this);
        this.canvasOnLeave = this.canvasOnLeave.bind(this);
        this.addClick = this.addClick.bind(this);
        this.fill = this.fill.bind(this);
        this.setTool = this.setTool.bind(this);
        this.setTerrain = this.setTerrain.bind(this);
        this.setToolSize = this.setToolSize.bind(this);
        this.refresh = this.refresh.bind(this);
        this.clear = this.clear.bind(this);
        this.undo = this.undo.bind(this);
        this.save = this.save.bind(this);
        this.cleanUpAntialiasing = this.cleanUpAntialiasing.bind(this);
    }

    /* Canvas Event Functions */

    async canvasOnClick(event){
        this.addClick(event.pageX - this.canvas.offsetLeft, event.pageY - this.canvas.offsetTop, false, this.state.toolMode, this.state.toolTerrain, this.state.toolSize);


        switch(this.state.toolMode){
            case tool.BRUSH:
            case tool.ERASE:
                this.state.isPainting = true;

                this.context.beginPath();

                if(this.state.toolMode == tool.BRUSH){
                    this.context.strokeStyle = this.state.toolTerrain;
                }
                else{
                    this.context.strokeStyle = terrain.BLANK;
                }
                this.context.lineJoin = "round";
                this.context.lineWidth = this.state.toolSize;

                this.context.moveTo(this.state.clicks[this.state.clicks.length - 1].xpos - .5, this.state.clicks[this.state.clicks.length - 1].ypos);

                this.context.lineTo(this.state.clicks[this.state.clicks.length - 1].xpos, this.state.clicks[this.state.clicks.length - 1].ypos);
                this.context.closePath();
                this.context.stroke();
                break;

            case tool.FILL:
                var imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

                this.cleanUpAntialiasing(imgData);
                var clickPos = ((Math.floor(this.state.clicks[this.state.clicks.length - 1].ypos) * this.canvas.width) + Math.floor(this.state.clicks[this.state.clicks.length - 1].xpos)) * 4;
                console.log("Length: " + imgData.data.length);
                console.log("Click Pos:" + clickPos);
                console.log(imgData.data.length - clickPos);
                this.fill(imgData, this.state.toolTerrain, imgData.data[clickPos], imgData.data[clickPos + 1], imgData.data[clickPos + 2], clickPos);

                this.context.putImageData(imgData, 0, 0);

                break;

            case tool.SQUARE:
                this.state.isDrawingSquare = true;
                this.state.squarePos1.x = this.state.clicks[this.state.clicks.length - 1].xpos;
                this.state.squarePos1.y = this.state.clicks[this.state.clicks.length - 1].ypos;
                break;

            default:
                console.log("ERROR: Invalid tool used on canvas");
                break;
        }
    }
    
    canvasOnMove(event){
        if(this.state.isPainting && (this.state.toolMode == tool.BRUSH || this.state.toolMode == tool.ERASE)) {
            this.addClick(event.pageX - this.canvas.offsetLeft, event.pageY - this.canvas.offsetTop, true, this.state.toolMode, this.state.toolTerrain, this.state.toolSize);

            this.context.beginPath();

            if(this.state.toolMode == tool.BRUSH){
                this.context.strokeStyle = this.state.toolTerrain;
            }
            else{
                this.context.strokeStyle = terrain.BLANK;
            }
            this.context.lineJoin = "round";
            this.context.lineWidth = this.state.toolSize;

            this.context.moveTo(this.state.clicks[this.state.clicks.length - 2].xpos, this.state.clicks[this.state.clicks.length - 2].ypos);

            this.context.lineTo(this.state.clicks[this.state.clicks.length - 1].xpos, this.state.clicks[this.state.clicks.length - 1].ypos);
            this.context.closePath();
            this.context.stroke();
        }
    }
    
    canvasOnUp(event){
        this.state.isPainting = false;

        if(this.state.isDrawingSquare){
            this.addClick(event.pageX - this.canvas.offsetLeft, event.pageY - this.canvas.offsetTop, false, this.state.toolMode, this.state.toolTerrain, this.state.toolSize);

            this.state.squarePos2.x = this.state.clicks[this.state.clicks.length - 1].xpos;
            this.state.squarePos2.y = this.state.clicks[this.state.clicks.length - 1].ypos;

            this.square(this.state.squarePos1, this.state.squarePos2);

            this.state.isDrawingSquare = false;
        }
    }
    
    canvasOnLeave(){
        this.state.isPainting = false;
    }
    
    addClick(x, y, drag, toolMode, toolTerrain, toolSize){
        if(drag) {
            this.state.clicks.push({tool : toolMode, terrain: toolTerrain, size : toolSize, xpos : x * (this.canvas.width / this.state.styleWidth), ypos : y * (this.canvas.height / this.state.styleHeight), prev : this.state.clicks[this.state.clicks.length - 1]});
        }
        else {
            this.state.clicks.push({tool: toolMode, terrain: toolTerrain, size : toolSize, xpos :  x * (this.canvas.width / this.state.styleWidth), ypos : y * (this.canvas.height / this.state.styleHeight), prev : -1});
        }
    }

    /* Canvas Drawing Tools */

    fill(imageData, terrain, red, green, blue, clickPos){
        var terrainRed = parseInt(terrain.substring(1, 3), 16);
        var terrainGreen = parseInt(terrain.substring(3, 5), 16);
        var terrainBlue = parseInt(terrain.substring(5, 7), 16);
        var lowerPos, lowerBound, higherPos, higherBound;
        var pixelStack = new Array();
        pixelStack.push(clickPos);

        for(var i = 0; i < pixelStack.length; i++){
            var pos = pixelStack[i];
            if(!(red == terrainRed && green == terrainGreen && blue == terrainBlue)){
                lowerPos = pos - 4;
                higherPos = pos + 4;
                lowerBound = pos - (pos % (this.canvas.width * 4));
                higherBound = pos + ((this.canvas.width * 4) - (pos % (this.canvas.width * 4)));


                imageData.data[pos] = terrainRed;
                imageData.data[pos + 1] = terrainGreen;
                imageData.data[pos + 2] = terrainBlue;
                imageData.data[pos + 3] = 255;

                while(lowerPos >= lowerBound && (imageData.data[lowerPos] == red && imageData.data[lowerPos + 1] == green && imageData.data[lowerPos + 2] == blue)){
                    imageData.data[lowerPos] = terrainRed;
                    imageData.data[lowerPos + 1] = terrainGreen;
                    imageData.data[lowerPos + 2] = terrainBlue;
                    imageData.data[lowerPos + 3] = 255;

                    if(imageData.data[lowerPos + (this.canvas.width * 4)] == red && imageData.data[lowerPos + (this.canvas.width * 4) + 1] == green && imageData.data[lowerPos + (this.canvas.width * 4) + 2] == blue){
                        pixelStack.push(lowerPos + (this.canvas.width * 4));
                    }

                    if(imageData.data[lowerPos - (this.canvas.width * 4)] == red && imageData.data[lowerPos - (this.canvas.width * 4) + 1] == green && imageData.data[lowerPos - (this.canvas.width * 4) + 2] == blue){
                        pixelStack.push(lowerPos - (this.canvas.width * 4));
                    }

                    lowerPos -= 4;
                }

                while(higherPos <= higherBound && (imageData.data[higherPos] == red && imageData.data[higherPos + 1] == green && imageData.data[higherPos + 2] == blue)){
                    imageData.data[higherPos] = terrainRed;
                    imageData.data[higherPos + 1] = terrainGreen;
                    imageData.data[higherPos + 2] = terrainBlue;
                    imageData.data[higherPos + 3] = 255;

                    if(imageData.data[higherPos + (this.canvas.width * 4)] == red && imageData.data[higherPos + (this.canvas.width * 4) + 1] == green && imageData.data[higherPos + (this.canvas.width * 4) + 2] == blue){
                        pixelStack.push(higherPos + (this.canvas.width * 4));
                    }

                    if(imageData.data[higherPos - (this.canvas.width * 4)] == red && imageData.data[higherPos - (this.canvas.width * 4) + 1] == green && imageData.data[higherPos - (this.canvas.width * 4) + 2] == blue){
                        pixelStack.push(higherPos - (this.canvas.width * 4));
                    }

                    higherPos += 4;
                }
            }
        }
    }

    square(pos1, pos2){
        this.context.beginPath();

        this.context.strokeStyle = this.state.toolTerrain;
        this.context.lineJoin = "round";
        this.context.lineWidth = this.state.toolSize;

        this.context.moveTo(pos1.x, pos1.y);
        this.context.lineTo(pos1.x, pos2.y);

        this.context.moveTo(pos1.x, pos2.y);
        this.context.lineTo(pos2.x, pos2.y);

        this.context.moveTo(pos2.x, pos2.y);
        this.context.lineTo(pos2.x, pos1.y);

        this.context.moveTo(pos2.x, pos1.y);
        this.context.lineTo(pos1.x, pos1.y);

        this.context.closePath();
        this.context.stroke();
    }

    /* Set Drawing Properties */

    setTool(tool){
        this.state.toolMode = tool;
    }

    setTerrain(terrain){
        this.state.toolTerrain = terrain;
    }

    setToolSize(size){
        this.state.toolSize = size;
    }

    /* Canvas Tools Misc */

    refresh(){
        this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);
        this.context.fillStyle = terrain.BLANK;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for(var i = 0; i < this.state.clicks.length; i++) {

            switch(this.state.clicks[i].tool){
                case tool.BRUSH:
                case tool.ERASE:
                    this.context.beginPath();
                    if(this.state.clicks[i].tool == tool.BRUSH){
                        this.context.strokeStyle = this.state.clicks[i].terrain;
                    }
                    else{
                        this.context.strokeStyle = terrain.BLANK;
                    }
                    this.context.lineJoin = "round";
                    this.context.lineWidth = this.state.clicks[i].size;

                    if(this.state.clicks[i].prev != -1) {
                        this.context.moveTo(this.state.clicks[i].prev.xpos, this.state.clicks[i].prev.ypos);
                    }
                    else {
                        this.context.moveTo(this.state.clicks[i].xpos - .5, this.state.clicks[i].ypos);
                    }
                    
                    this.context.lineTo(this.state.clicks[i].xpos, this.state.clicks[i].ypos);
                    this.context.closePath();
                    this.context.stroke();
                    break;

                case tool.FILL:
                    var imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

                    this.cleanUpAntialiasing(imgData);
                    var clickPos = ((this.state.clicks[i].ypos * this.canvas.width) + this.state.clicks[i].xpos) * 4;
                    this.fill(imgData, this.state.clicks[i].terrain, imgData.data[clickPos], imgData.data[clickPos + 1], imgData.data[clickPos + 2], clickPos);

                    this.context.putImageData(imgData, 0, 0);
                    break;

                case tool.SQUARE:
                    let pos1 = {x: this.state.clicks[i].xpos, y: this.state.clicks[i].ypos};
                    let pos2 = {x: this.state.clicks[i+1].xpos, y: this.state.clicks[i+1].ypos};
                    this.square(pos1, pos2);
                    i++;
                    break;

                default:
                    console.log("ERROR: Invalid tool used on canvas");
                    break;
            }
            
        }
    }

    clear(){
        this.context.clearRect(0,0,this.context.canvas.width,this.context.canvas.height);
        this.context.fillStyle = terrain.BLANK;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.state.prevClicks = this.state.clicks.slice(0);
        this.state.clicks = new Array();
    }

    undo(){
        if(this.state.clicks.length > 0){
            while(this.state.clicks[this.state.clicks.length - 1].prev != -1)
            {
                this.state.clicks.pop();
                this.refresh();
            }
            this.state.clicks.pop();
            this.refresh();
        }
        else if(this.state.prevClicks.length > 0){
            this.state.clicks = this.state.prevClicks.slice(0);
            this.state.prevClicks = new Array();
            this.refresh();
        }
    }

    save(){
        axios({
            method: 'post',
            url: 'http://localhost:5001/chameleon/test',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify("test"),
        })
            .then(response => console.log(response.data));
    }

    cleanUpAntialiasing(imageData){
        for(let y = 0; y < this.canvas.height; y++){
            for(let x = 0; x < this.canvas.width; x++){
                if(!isTerrain(rgbToHex(imageData.data[(y * this.canvas.width + x) * 4], imageData.data[(y * this.canvas.width + x) * 4 + 1], imageData.data[(y * this.canvas.width + x) * 4 + 2]))){

                    if(x < this.canvas.width - 1 && isTerrain(rgbToHex(imageData.data[(y * this.canvas.width + x + 1) * 4], imageData.data[(y * this.canvas.width + x + 1) * 4 + 1], imageData.data[(y * this.canvas.width + x + 1) * 4 + 2]))){
                        imageData.data[(y * this.canvas.width + x) * 4] = imageData.data[(y * this.canvas.width + x + 1) * 4];
                        imageData.data[(y * this.canvas.width + x) * 4 + 1] = imageData.data[(y * this.canvas.width + x + 1) * 4 + 1];
                        imageData.data[(y * this.canvas.width + x) * 4 + 2] = imageData.data[(y * this.canvas.width + x + 1) * 4 + 2];
                    }

                    else if(x > 0 && isTerrain(rgbToHex(imageData.data[(y * this.canvas.width + x - 1) * 4], imageData.data[(y * this.canvas.width + x - 1) * 4 + 1], imageData.data[(y * this.canvas.width + x - 1) * 4 + 2]))){
                        imageData.data[(y * this.canvas.width + x) * 4] = imageData.data[(y * this.canvas.width + x - 1) * 4];
                        imageData.data[(y * this.canvas.width + x) * 4 + 1] = imageData.data[(y * this.canvas.width + x - 1) * 4 + 1];
                        imageData.data[(y * this.canvas.width + x) * 4 + 2] = imageData.data[(y * this.canvas.width + x - 1) * 4 + 2];
                    }

                    else if(y < this.canvas.height - 1 && isTerrain(rgbToHex(imageData.data[((y + 1) * this.canvas.width + x) * 4], imageData.data[((y + 1) * this.canvas.width + x) * 4 + 1], imageData.data[((y + 1) * this.canvas.width + x) * 4 + 2]))){
                        imageData.data[(y * this.canvas.width + x) * 4] = imageData.data[((y + 1) * this.canvas.width + x) * 4];
                        imageData.data[(y * this.canvas.width + x) * 4 + 1] = imageData.data[((y + 1) * this.canvas.width + x) * 4 + 1];
                        imageData.data[(y * this.canvas.width + x) * 4 + 2] = imageData.data[((y + 1) * this.canvas.width + x) * 4 + 2];
                    }

                    else{
                        imageData.data[(y * this.canvas.width + x) * 4] = imageData.data[((y - 1) * this.canvas.width + x) * 4];
                        imageData.data[(y * this.canvas.width + x) * 4 + 1] = imageData.data[((y - 1) * this.canvas.width + x) * 4 + 1];
                        imageData.data[(y * this.canvas.width + x) * 4 + 2] = imageData.data[((y - 1) * this.canvas.width + x) * 4 + 2];
                    }
                }
            }
        }
    }

    render(){
        return(
            <div className="Canvas" width="100%" height={this.state.height}>
                <div className="editorBar" width="1000rem" height="75rem">
                    <button className="btn btn-primary" onClick={() => {this.setTool(tool.BRUSH);}}>Brush</button>
                    <button className="btn btn-primary" onClick={() => {this.setTool(tool.FILL);}}>Fill</button>
                    <button className="btn btn-primary" onClick={() => {this.setTool(tool.SQUARE);}}>SQUARE</button>
                    <button className="btn btn-primary" onClick={() => {this.setTool(tool.ERASE);}}>Erase</button>
                    <button className="btn btn-primary" onClick={() => {this.setTerrain(terrain.GRASS);}}>Grass</button>
                    <button className="btn btn-primary" onClick={() => {this.setTerrain(terrain.STONE);}}>Stone</button>
                    <button className="btn btn-primary" onClick={() => {this.setTerrain(terrain.WATER);}}>Water</button>
                    <input type="range" min="10" max="30" defaultValue="10" class="slider" id="brush-size"/>
                    <button className="btn btn-primary" onClick={this.undo}>Undo</button>
                    <button className="btn btn-primary" onClick={this.refresh}>Refresh</button>
                    <button className="btn btn-primary" onClick={this.clear}>Clear</button>
                    <button className="btn btn-primary" onClick={this.save}>Save</button>
                </div>
                <canvas id={this.state.canvasName} onMouseDown={this.canvasOnClick} onMouseUp={this.canvasOnUp} onMouseMove={this.canvasOnMove} onMouseLeave={this.canvasOnLeave}></canvas>
            </div>
        );
    }

    componentDidMount(){
        this.canvas = document.querySelector("#" + this.state.canvasName);
        this.context = this.canvas.getContext("2d");
        this.brushSize = document.querySelector("#brush-size");

        this.canvas.width = 1920;
        this.canvas.height = 1080;
        this.canvas.style.width = "1600px";
        this.canvas.style.height = "900px";

        this.state.styleWidth = parseInt(this.canvas.style.width, 10);
        this.state.styleHeight = parseInt(this.canvas.style.height, 10);

        this.context.fillStyle = terrain.BLANK;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.brushSize.oninput = () => {this.setToolSize(this.brushSize.value);};
        this.context.imageSmoothingEnabled = false;
    }
}

export default Canvas;