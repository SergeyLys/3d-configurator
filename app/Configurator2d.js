import {fabric} from "fabric";

export default class Configurator2d {
    constructor() {
        this.canvases = {};
    }
    addGroup(groupName) {
        this.canvases[groupName] = [];
        return this.canvases[groupName];
    }
    addCanvas(groupName, canvasName) {
        this.canvases[groupName].push(canvasName);
    }
    getCanvas(canvasName) {
        return Object.keys(this.canvases).map((group) => {
            return group.filter((cnv) => {
                return cnv.name === canvasName
            }).length > 0
        });
    }

    _createCanvasForText(canvasName, width, height, left, top, textValue) {
        const canvas = document.createElement('canvas');
        const fabricCanvas = new fabric.Canvas(canvas, { width, height });
        const pixelsPerMM = fabricCanvas.width / 400;
        const mHeight = pixelsPerMM * 1100;
        fabricCanvas.wrapperEl.style.left = `${left}px`;
        fabricCanvas.wrapperEl.style.top = `${top}px`;
        fabricCanvas.wrapperEl.style.position = 'absolute';
        // currentElement.material.isFilled = true;

        // const checkbox = new fabric.Image()

        const textBox = new fabric.Textbox(textValue, {
            name: 'TextBox',
            fontSize: 20,
            left: 0,
            top: 0,
            fontFamily: 'helvetica',
            fontWeight: '',
            originX: 'left',
            fill: "#ffffff",
            hasRotatingPoint: true,
            centerTransform: true,
            evented: true
        });
        fabricCanvas.getItemByName = function(name) {
            return this.getObjects().filter(obj => obj.name === name)[0]
        };
        fabricCanvas.centerObject(textBox);
        fabricCanvas.add(textBox);
        fabricCanvas.setActiveObject(textBox);
        textBox.enterEditing();
        fabricCanvas.renderAll();

        const canvasObject = this.getCanvas(canvasName);

        Object.assign(canvasObject, {
            parentCanvas: canvas,
            canvas: fabricCanvas,
            projectionHeight: mHeight,
            pixelsPerMM
        });

        // document.body.appendChild(fabricCanvas.wrapperEl);

        // fabricCanvas.upperCanvasEl.addEventListener('click', () => {
        //     textBox.enterEditing();
        // });
        // currentElement.material.map = texture;
    }
}
