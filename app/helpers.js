import { Vector3 } from 'three-full';

export const getAbsolutePosition = (mesh) => {
    mesh.geometry.computeBoundingBox();
    const { boundingBox } = mesh.geometry;
    const position = new Vector3();
    position.subVectors(boundingBox.max, boundingBox.min);
    position.multiplyScalar(0.5);
    position.add(boundingBox.min);
    position.applyMatrix4(mesh.matrixWorld);
    return {x: position.x, y: position.y, z: position.z};
};
