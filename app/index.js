import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight,
    Raycaster,
    Object3D,
    Mesh,
    MeshPhongMaterial,
    MeshBasicMaterial,
    PlaneBufferGeometry,
    OBJLoader,
    MTLLoader,
    TextureLoader,
    BoxGeometry,
    Vector2,
    Vector3,
    RepeatWrapping,
    Box3,
    CanvasTexture
} from 'three-full';
import OrbitControls from './libs/OrbitControls';
import "../assets/styles/index.scss";
import {getAbsolutePosition, setUpMouseHander, setUpTouchHander} from './helpers';
import TWEEN from '@tweenjs/tween.js';
import {fabric} from 'fabric';

const textureList = [
    {
        src: '../assets/images/1.jpg',
        name: 'Texture 1'
    },
    {
        src: '../assets/images/2.jpg',
        name: 'Texture 2'
    }
];

class Configurator {
    constructor() {
        this.camera = {};
        this.canvas = null;
        this.world = null;
        this.ground = null;
        this.targetForDragging = null;
        this.intersects = [];
        this.groups = [];
        this.dragItem = null;
        this.width = null;
        this.height = null;
        this.textBox = {};
        this.defaultCameraPosition = new Vector3();

        this._doMouseDown = this._doMouseDown.bind(this);
        this._doMouseMove = this._doMouseMove.bind(this);
        this._doMouseUp = this._doMouseUp.bind(this);

        this._initScene();
    }

    _initScene() {
        const scene =           new Scene();
        const camera =          new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
        const renderer =        new WebGLRenderer({ antialias: true, alpha: true });
        const controls =        new OrbitControls(camera, renderer.domElement);
        const ambient =         new AmbientLight('#ffffff');
        const raycaster =       new Raycaster();
        const textureLoader =   new TextureLoader();

        renderer.setClearColor( 0x6495ED );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        this.targetForDragging = new Mesh(
            new BoxGeometry(10000,0.01,10000),
            new MeshBasicMaterial()
        );
        this.targetForDragging.material.visible = false;

        this.canvas = renderer.domElement;
        this.width = this.canvas.getBoundingClientRect().width;
        this.height = this.canvas.getBoundingClientRect().height;

        this.world = new Object3D();
        scene.add(this.world, ambient);

        this.renderer = renderer;
        this.scene = scene;
        this.raycaster = raycaster;
        this.camera.object = camera;
        this.camera.controls = controls;
        this.textureLoader = textureLoader;

        // const box = new Mesh(
        //     new BoxGeometry(200, 200, 200),
        //     new MeshPhongMaterial( {color:"yellow"} )
        // );
        // box.position.y = 100;
        // box.position.x = 300;
        // box.position.z = 300;
        //
        // const addBox = (x,z) => {
        //     const obj = box.clone();
        //     obj.position.x = x;
        //     obj.position.z = z;
        //     this.world.add(obj);
        // };
        //
        // addBox(-450,-170);
        // addBox(-180,450);
        //
        // this.world.add(box);
        this._setCameraOptions();
        this._addBasePlane();
        setUpMouseHander(this.canvas,this._doMouseDown,this._doMouseMove,this._doMouseUp);
        this._render();
    }

    _addBasePlane() {
        this.ground = new Mesh(new PlaneBufferGeometry(3000, 3000, 8, 8), new MeshBasicMaterial({color: 0x555555}));
        this.ground.position.y = 0;
        this.ground.rotation.x =  -Math.PI / 2;
        this.world.add(this.ground);
    }

    _setCameraOptions() {
        this.camera.object.position.set( 100, 400, 3000 );
        this.camera.object.lookAt(this.scene.position);
        this.camera.controls.rotateSpeed    = 1.0;
        this.camera.controls.zoomSpeed      = 1.0;
        this.camera.controls.enablePan      = false;
        this.camera.controls.enableDamping  = false;
        this.camera.controls.dampingFactor  = 0.1;
        this.camera.controls.rotateSpeed    = 0.5;
        this.camera.controls.staticMoving = true;
        this.camera.controls.minPolarAngle = Math.PI / 3;
        this.camera.controls.maxPolarAngle = Math.PI / 3;
        this.camera.controls.target.set(0, 0, 0);
    }

    _doMouseDown(x,y) {
        if (this.targetForDragging.parent === this.world) {
            this.world.remove(this.targetForDragging);  // I don't want to check for hits on targetForDragging
        }
        const a = 2*x/this.canvas.width - 1;
        const b = 1 - 2*y/this.canvas.height;
        this.raycaster.setFromCamera( new Vector2(a,b), this.camera.object );
        this.intersects = this.raycaster.intersectObjects( this.world.children, true );  // no need for recusion since all objects are top-level
        if (this.intersects.length === 0) {
            return false;
        }
        const item = this.intersects[0];
        const filteredGroup = this.groups.filter((group) => item.object.parent === group);
        let objectHit;

        if (filteredGroup.length > 0) {
            objectHit = item.object.parent;
        } else {
            objectHit = item.object;
        }

        if (objectHit === this.ground) {
            return false;
        }
        else {
            this.camera.controls.enabled = false;
            this.dragItem = objectHit;
            this.world.add(this.targetForDragging);
            this.targetForDragging.position.set(0,item.point.y,0);
            // this.renderer.render(this.scene, this.camera.object);
            return true;
        }
    }

    _doMouseMove(x,y,evt,prevX,prevY) {
        let a = 2*x/this.canvas.width - 1;
        let b = 1 - 2*y/this.canvas.height;
        this.raycaster.setFromCamera( new Vector2(a,b), this.camera.object );
        this.intersects = this.raycaster.intersectObject( this.targetForDragging );
        if (this.intersects.length === 0) {
            return;
        }
        const locationX = this.intersects[0].point.x;
        const locationZ = this.intersects[0].point.z;
        const coords = new Vector3(locationX, 0, locationZ);
        this.world.worldToLocal(coords);
        a = Math.min(1500,Math.max(-1500,coords.x));
        b = Math.min(1500,Math.max(-1500,coords.z));
        this.dragItem.position.x = a;
        this.dragItem.position.z = b;
        // this.renderer.render(this.scene, this.camera.object);
    }

    _doMouseUp() {
        this.groups.forEach((group) => {
            group.children.forEach((mesh) => {
                mesh.absoluteCoords = getAbsolutePosition(mesh);
            });
        });
        this.camera.controls.enabled = true;
    }

    _setCameraPosition(options) {
        let frameId, positionResolve;
        const that = this, { controls } = this.camera;
        if (options.zoom && options.zoom < controls.minDistance) controls.minDistance = options.zoom;
        const angle = {
            azimuth: controls.getAzimuthalAngle(),
            polar: controls.getPolarAngle(),
            zoom: controls.getRadius(),
            positionX: controls.target.x,
            positionY: controls.target.y,
            positionZ: controls.target.z
        };
        const difference = controls.getAzimuthalAngle() - options.azimuth;
        if (difference > Math.PI || difference < -Math.PI) {
            if (options.azimuth < 0) {
                options.azimuth = Math.PI + (Math.PI - Math.abs(options.azimuth));
            } else if (options.azimuth > 0) {
                options.azimuth = -Math.PI - (Math.PI - Math.abs(options.azimuth));
            }
        }
        new TWEEN.Tween(angle)
            .to({
                azimuth: options.azimuth,
                polar: options.polar,
                zoom: options.zoom,
                positionX: options.x,
                positionY: options.y,
                positionZ: options.z,
                target: options.target
            }, options.duration || 1000)
            .start()
            .onUpdate(() => {
                if (options.zoom) controls.setRadius(angle.zoom);
                if (options.x !== undefined || options.y !== undefined || options.z !== undefined) {
                    controls.target.set(angle.positionX, angle.positionY, angle.positionZ);
                }
                controls.setAzimuthalAngle(angle.azimuth);
                controls.setPolarAngle(angle.polar);
                controls.update();
                this.renderer.render(this.scene, this.camera.object);
            })
            .onComplete(() => {
                window.cancelAnimationFrame(frameId);
                window.cancelAnimationFrame(that.frameId);
                if (options.zoom > 7) controls.minDistance = 7;
                if (typeof options.cb === 'function') options.cb();
                positionResolve();
            });
        function _animate(time) {
            frameId = window.requestAnimationFrame(_animate);
            TWEEN.update(time);
        }
        frameId = window.requestAnimationFrame(_animate);
        return new Promise((resolve) => { positionResolve = resolve; });
    }

    _getCenterPoint(mesh) {
        const geometry = mesh.geometry;
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter();
        mesh.localToWorld( center );
        return center;
    }

    _calculateCanvasFramePosition(currentMesh, camera, width, height) {
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
    };

    loadModel(path) {
        const meshes = [];
        const loader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        const group = new Object3D();
        const texture = this.textureLoader.load('../assets/images/1.jpg', function ( texture ) {

            texture.wrapS = texture.wrapT = RepeatWrapping;

        } );
        const textureTransparent = this.textureLoader.load('../assets/images/transparent.png', function ( tex ) {

            tex.wrapS = tex.wrapT = RepeatWrapping;

        } );
        // mtlLoader.load('../assets/images/14.mtl', (materials) => {
        //     materials.preload();
            loader
                // .setMaterials(materials)
                .load(path, (object) => {
                object.traverse((mesh) => {
                    if (mesh instanceof Mesh) {
                        if (mesh.name === 'TextBox') {

                            mesh.material = new MeshPhongMaterial({
                                // color: '#ff0000',
                                map: textureTransparent,
                                transparent: true,
                            });
                        } else {
                            mesh.material = new MeshPhongMaterial({
                                map: texture
                            });
                        }

                        mesh.absoluteCoords = getAbsolutePosition(mesh);

                        meshes.push(mesh);
                    }
                });

                meshes.forEach((mesh) => {
                    group.add(mesh);
                });
                group.position.set(0, 0, 0);

                this.groups.push(group);
                this.world.add(group);
            });
        // });
    }

    _createCanvasForText(currentElement, width, height, left, top) {
        const canvas = document.createElement('canvas');
        const fabricCanvas = new fabric.Canvas(canvas, { width, height });
        const pixelsPerMM = fabricCanvas.width / 400;
        const mHeight = pixelsPerMM * 1100;
        fabricCanvas.wrapperEl.style.left = `${left}px`;
        fabricCanvas.wrapperEl.style.top = `${top}px`;
        fabricCanvas.wrapperEl.style.position = 'absolute';
        currentElement.material.isFilled = true;

        // const checkbox = new fabric.Image()

        const textBox = new fabric.Textbox("", {
            fontSize: 20,
            left: 0,
            top: 0,
            fontFamily: 'helvetica',
            fontWeight: '',
            originX: 'left',
            fill: "#ffffff",
            hasRotatingPoint: true,
            centerTransform: true,
        });
        fabricCanvas.centerObject(textBox);
        fabricCanvas.add(textBox);
        fabricCanvas.setActiveObject(textBox);
        textBox.enterEditing();
        fabricCanvas.renderAll();


        Object.assign(this.textBox, {
            parentCanvas: canvas,
            canvas: fabricCanvas,
            projectionHeight: mHeight,
            pixelsPerMM
        });

        document.body.appendChild(fabricCanvas.wrapperEl);
        this.camera.controls.enabled = false;

        // fabricCanvas.upperCanvasEl.addEventListener('click', () => {
        //     textBox.enterEditing();
        // });
        // currentElement.material.map = texture;
    }

    editFrontText() {
        this.camera.controls.minPolarAngle = 0;
        this.camera.controls.maxPolarAngle = Infinity;
        this.defaultCameraPosition.x = this.camera.controls.target.x;
        this.defaultCameraPosition.y = this.camera.controls.target.y;
        this.defaultCameraPosition.z = this.camera.controls.getRadius();
        const stellaFront = this.world.getObjectByName('TextBox');

        this._setCameraPosition({
            polar: 1.5,
            zoom: 1500,
            x: this._getCenterPoint(stellaFront).x,
            y: this._getCenterPoint(stellaFront).y,
            azimuth: 0,
        }).then(() => {
            const {width, height, left, top} = this._calculateCanvasFramePosition(
                stellaFront, this.camera.object, this.width, this.height
            );
            if (stellaFront.material.isFilled) {
                stellaFront.material.map = new CanvasTexture();
                document.body.appendChild(this.textBox.canvas.wrapperEl);
            } else {
                this._createCanvasForText(stellaFront, width, height, left, top);
            }
        });
    }

    setFrontText() {
        const stellaFront = this.world.getObjectByName('TextBox');
        const { canvas } = this.textBox.canvas.contextContainer;
        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;
        stellaFront.material.map = texture;
        this.camera.controls.maxPolarAngle = Math.PI / 3;
        this.camera.controls.minPolarAngle = Math.PI / 3;
        this.camera.controls.enabled = true;
        if (document.querySelector('.canvas-container')) {
            document.querySelector('.canvas-container').remove();
        }

        this._setCameraPosition({
            x: this.defaultCameraPosition.x,
            y: this.defaultCameraPosition.y,
            polar: Math.PI / 3,
            zoom: this.defaultCameraPosition.z
        });
    }

    setTexture(path) {
        this.textureLoader.load(path, ( texture ) => {

            texture.wrapS = texture.wrapT = RepeatWrapping;
            this.groups.forEach((group) => {
                group.children.forEach((mesh) => {
                    if (mesh.name !== 'TextBox') {
                        mesh.material.map = texture;
                    }
                });
            });

        } );
    }

    _render() {
        const { camera, scene, renderer } = this;
        requestAnimationFrame(() => {
            this._render();
        });
        if (camera && scene && renderer) {
            renderer.render(scene, camera.object);
            camera.controls.update();
        }
    };
}

window.addEventListener('load', () => {
    const app = new Configurator();
    app.loadModel("../assets/images/23.obj");

    document.getElementById('setCamFront').addEventListener('click', () => {
        app.editFrontText();
        document.getElementById('applyText').style.display = 'block';
    });
    document.getElementById('applyText').addEventListener('click', (e) => {
        app.setFrontText();
        e.target.style.display = 'none';
    });

    const textureControls = document.querySelector('.texture-controls');
    textureList.forEach((item) => {
        const button = document.createElement('button');
        button.innerText = item.name;
        button.addEventListener('click', () => {
            app.setTexture(item.src);
        });
        textureControls.appendChild(button);
    });
});
