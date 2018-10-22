import { Vector3 } from 'three-full';

export function getAbsolutePosition(mesh) {
    mesh.geometry.computeBoundingBox();
    const { boundingBox } = mesh.geometry;
    const position = new Vector3();
    position.subVectors(boundingBox.max, boundingBox.min);
    position.multiplyScalar(0.5);
    position.add(boundingBox.min);
    position.applyMatrix4(mesh.matrixWorld);
    return {x: position.x, y: position.y, z: position.z};
}

export function randomPointInDiapason(min, max) {
    return new Vector3(
        Math.random() * (max.x - min.x) + min.x,
        0,
        Math.random() * (max.y - min.y) + min.y
    );
}


export function setUpMouseHander (element, mouseDownFunc, mouseDragFunc, mouseUpFunc) {
    /*
           element -- either the element itself or a string with the id of the element
           mouseDownFunc(x,y,evt) -- should return a boolean to indicate whether to start a drag operation
           mouseDragFunc(x,y,evt,prevX,prevY,startX,startY)
           mouseUpFunc(x,y,evt,prevX,prevY,startX,startY)
       */
    if (!element || !mouseDownFunc || !(typeof mouseDownFunc === "function")) {
        throw "Illegal arguments in setUpMouseHander";
    }
    if (typeof element === "string") {
        element = document.getElementById(element);
    }
    if (!element || !element.addEventListener) {
        throw "first argument in setUpMouseHander is not a valid element";
    }
    let dragging = false;
    let startX, startY;
    let prevX, prevY;

    function doMouseDown(evt) {
        if (dragging) {
            return;
        }
        const r = element.getBoundingClientRect();
        const x = evt.clientX - r.left;
        const y = evt.clientY - r.top;
        prevX = startX = x;
        prevY = startY = y;
        dragging = mouseDownFunc(x, y, evt);
        if (dragging) {
            document.addEventListener("mousemove", doMouseMove);
            document.addEventListener("mouseup", doMouseUp);
        }
    }

    function doMouseMove(evt) {
        if (dragging) {
            let x;
            let y;
            if (mouseDragFunc) {
                const r = element.getBoundingClientRect();
                x = evt.clientX - r.left;
                y = evt.clientY - r.top;
                mouseDragFunc(x, y, evt, prevX, prevY, startX, startY);
            }
            prevX = x;
            prevY = y;
        }
    }

    function doMouseUp(evt) {
        if (dragging) {
            document.removeEventListener("mousemove", doMouseMove);
            document.removeEventListener("mouseup", doMouseUp);
            if (mouseUpFunc) {
                const r = element.getBoundingClientRect();
                const x = evt.clientX - r.left;
                const y = evt.clientY - r.top;
                mouseUpFunc(x, y, evt, prevX, prevY, startX, startY);
            }
            dragging = false;
        }
    }
    element.addEventListener("mousedown", doMouseDown);
    element.addEventListener("mouseup", doMouseUp);
}

export function setUpTouchHander (element, touchStartFunc, touchMoveFunc, touchEndFunc, touchCancelFunc) {
    /*
           element -- either the element itself or a string with the id of the element
           touchStartFunc(x,y,evt) -- should return a boolean to indicate whether to start a drag operation
           touchMoveFunc(x,y,evt,prevX,prevY,startX,startY)
           touchEndFunc(evt,prevX,prevY,startX,startY)
           touchCancelFunc()   // no parameters
       */
    if (!element || !touchStartFunc || !(typeof touchStartFunc === "function")) {
        throw "Illegal arguments in setUpTouchHander";
    }
    if (typeof element === "string") {
        element = document.getElementById(element);
    }
    if (!element || !element.addEventListener) {
        throw "first argument in setUpTouchHander is not a valid element";
    }
    let dragging = false;
    let startX, startY;
    let prevX, prevY;

    function doTouchStart(evt) {
        if (evt.touches.length !== 1) {
            doTouchEnd(evt);
            return;
        }
        evt.preventDefault();
        if (dragging) {
            doTouchEnd();
        }
        const r = element.getBoundingClientRect();
        const x = evt.touches[0].clientX - r.left;
        const y = evt.touches[0].clientY - r.top;
        prevX = startX = x;
        prevY = startY = y;
        dragging = touchStartFunc(x, y, evt);
        if (dragging) {
            element.addEventListener("touchmove", doTouchMove);
            element.addEventListener("touchend", doTouchEnd);
            element.addEventListener("touchcancel", doTouchCancel);
        }
    }

    function doTouchMove(evt) {
        if (dragging) {
            let x;
            let y;
            if (evt.touches.length !== 1) {
                doTouchEnd(evt);
                return;
            }
            evt.preventDefault();
            if (touchMoveFunc) {
                const r = element.getBoundingClientRect();
                x = evt.touches[0].clientX - r.left;
                y = evt.touches[0].clientY - r.top;
                touchMoveFunc(x, y, evt, prevX, prevY, startX, startY);
            }
            prevX = x;
            prevY = y;
        }
    }

    function doTouchCancel() {
        if (touchCancelFunc) {
            touchCancelFunc();
        }
    }

    function doTouchEnd(evt) {
        if (dragging) {
            dragging = false;
            element.removeEventListener("touchmove", doTouchMove);
            element.removeEventListener("touchend", doTouchEnd);
            element.removeEventListener("touchcancel", doTouchCancel);
            if (touchEndFunc) {
                touchEndFunc(evt, prevX, prevY, startX, startY);
            }
        }
    }
    element.addEventListener("touchstart", doTouchStart);
}
