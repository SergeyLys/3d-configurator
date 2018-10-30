import {fabric} from "fabric";

export default class Configurator2d {
    constructor() {
        this.canvases = {};
    }

    createTextInstance(value, position) {
        return new fabric.Textbox(value, {
            name: 'TextBox',
            fontSize: 20,
            left: position.x,
            top: position.y,
            fontFamily: 'helvetica',
            fontWeight: '',
            originX: 'left',
            fill: "#ffffff",
            hasRotatingPoint: true,
            centerTransform: true,
            evented: true
        });
    }

    createCanvasForTexture(width, height) {
        const canvas = document.createElement('canvas');
        const fabricCanvas = new fabric.Canvas(canvas, { width, height });
        const pixelsPerMM = fabricCanvas.width / 400;
        const mHeight = pixelsPerMM * 1100;
        // fabricCanvas.wrapperEl.style.left = `${left}px`;
        // fabricCanvas.wrapperEl.style.top = `${top}px`;
        // fabricCanvas.wrapperEl.style.position = 'absolute';
        // currentElement.material.isFilled = true;


        fabricCanvas.getItemByName = function(name) {
            return this.getObjects().filter(obj => obj.name === name)[0]
        };
        // const checkbox = new fabric.Image()

        // const textBox = new fabric.Textbox(textValue, {
        //     name: 'TextBox',
        //     fontSize: 20,
        //     left: 0,
        //     top: 0,
        //     fontFamily: 'helvetica',
        //     fontWeight: '',
        //     originX: 'left',
        //     fill: "#ffffff",
        //     hasRotatingPoint: true,
        //     centerTransform: true,
        //     evented: true
        // });
        // fabricCanvas.getItemByName = function(name) {
        //     return this.getObjects().filter(obj => obj.name === name)[0]
        // };
        // fabricCanvas.centerObject(textBox);
        // fabricCanvas.add(textBox);
        // fabricCanvas.setActiveObject(textBox);
        // textBox.enterEditing();
        // fabricCanvas.renderAll();
        //
        // const canvasObject = this.getCanvas(canvasName);
        //
        // Object.assign(canvasObject, {
        //     parentCanvas: canvas,
        //     canvas: fabricCanvas,
        //     projectionHeight: mHeight,
        //     pixelsPerMM
        // });

        // document.body.appendChild(fabricCanvas.wrapperEl);

        // fabricCanvas.upperCanvasEl.addEventListener('click', () => {
        //     textBox.enterEditing();
        // });
        // currentElement.material.map = texture;

        return fabricCanvas;
    }
}
