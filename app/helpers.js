import {Box3, Vector3} from 'three-full';

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
        Math.random() * (max.x - min.x) + min.x + max.x,
        0,
        Math.random() * (max.y - min.y) + min.y + max.y
    );
}

export function randNum(min,max,bool) {
    let num = Math.floor(Math.random()*max) + min;
    if(bool || typeof bool === "undefined"){
        num *= Math.floor(Math.random()*2) === 1 ? 1 : -1;
    }
    return num;
}

export function parseSize(str) {
    return {
        width: str.split('*').shift(),
        height: str.split('*').pop()
    }
}

export function concatArray(arr) {
    if (Array.isArray(arr)) {
        return arr.reduce(function(done,curr){
            return done.concat(concatArray(curr));
        }, []);
    } else {
        return arr;
    }
}

export function parseData(data) {
    if (data.parts && data.parts.length) {
        return concatArray(
            data.parts.map((part) => {
                if (part.parts && part.parts.length) {
                    return parseData(part);
                }
                return part;
            })
        ).filter((part) => part.model.src_threejs && part.parent_id)
    }
}

export function getCenterPoint(mesh) {
    const geometry = mesh.geometry;
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter();
    mesh.localToWorld( center );
    return center;
}

export function calculateCanvasFramePosition(currentMesh, camera, width, height) {
    const absoluteCoords = new Vector3(
        currentMesh.absoluteCoords.x,
        currentMesh.absoluteCoords.y,
        currentMesh.absoluteCoords.z
    );
    const widthHalf = width / 2, heightHalf = height / 2;
    const meshBox = new Box3().setFromObject(currentMesh);
    const vFOV = camera.fov * Math.PI / 180;
    const meshHeight = 2 * Math.tan(vFOV / 2) * (absoluteCoords.distanceTo(camera.position));
    const meshWidth = meshHeight * camera.aspect;
    const fractionHeight = meshBox.getSize(new Vector3()).y / meshHeight;
    const fractionWidth = Math.max(meshBox.getSize(new Vector3()).x, meshBox.getSize(new Vector3()).z) / meshWidth;
    const pos = absoluteCoords.clone();

    pos.project(camera);
    pos.x = (pos.x * widthHalf) + widthHalf;
    pos.y = -(pos.y * heightHalf) + heightHalf;

    return {
        width: width * fractionWidth,
        height: height * fractionHeight,
        left: pos.x - (width * fractionWidth) / 2,
        top: pos.y - (height * fractionHeight) / 2
    }
}

export function filterUniqueItems(initialArray, value) {
    return initialArray.filter((text, index, arr) =>
        arr.map(mapObj => mapObj[value]).indexOf(text[value]) === index
    );
}
