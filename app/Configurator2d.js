import {fabric} from "fabric";
import {CanvasTexture} from "three-full";

export default class Configurator2d {
    constructor() {
        this.canvases = {};
    }

    createTextInstance(value, position) {
        return new fabric.IText(value, {
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

    getImageFromURL(path, position) {
        let imageResolve;
        fabric.Image.fromURL(path, function (img) {
            const image = img.set({
                left: position.x,
                top: position.y,
            });
            imageResolve(image);
        });

        return new Promise((resolve) => { imageResolve = resolve; });
    }

    createCanvasForTexture(width, height) {
        const canvas = document.createElement('canvas');
        const fabricCanvas = new fabric.Canvas(canvas, { width, height });

        fabricCanvas.getItemByName = function(name) {
            return this.getObjects().filter(obj => obj.name === name)[0]
        };

        return fabricCanvas;
    }

}
