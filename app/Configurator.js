import {
    AmbientLight, Box3,
    BoxGeometry, CanvasTexture,
    Color,
    DoubleSide,
    Fog,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    MeshPhongMaterial,
    Object3D,
    OBJLoader,
    PerspectiveCamera,
    PlaneBufferGeometry,
    Raycaster,
    RepeatWrapping,
    Scene,
    SpotLight, Texture,
    TextureLoader, Vector2,
    Vector3,
    WebGLRenderer
} from "three-full";
import {
    getAbsolutePosition,
    parseData,
    parseSize,
    randNum,
    randomPointInDiapason,
    getCenterPoint,
    calculateCanvasFramePosition
} from "./helpers";
import Configurator2d from "./Configurator2d";
import OrbitControls from "./libs/OrbitControls";
import DragdropControls from "./DragdropControls";
import TWEEN from "@tweenjs/tween.js";
import {fabric} from "fabric";

// TODO: 1. Парсинг схемы и загрузка мешей, 5ч. DONE
// TODO: 2. Наложение портретов из схемы, 3ч.
// TODO: 3. Наложение текстов из схемы, 2ч.
// TODO: 4. Уменьшение асинхронных запросов на одинаковые файлы, 4ч. DONE
// TODO: 5. Драгдроп целого объекта из схемы, 4ч. DONE

export default class Configurator {
    constructor(data) {
        this.camera = {};
        this.canvas = null;
        this.world = null;
        this.ground = null;
        this.targetForDragging = null;
        this.intersects = [];
        this.groups = [];
        this.sceneGroups = {};
        this.dragItem = null;
        this.width = null;
        this.height = null;
        this.textBox = {};
        this.defaultCameraPosition = new Vector3();
        this.data = data;
        this.areaWidth = parseSize(this.data.size).width * 10;
        this.areaHeight = parseSize(this.data.size).height * 10;
        this.configurator2d = new Configurator2d();

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
        const ambient =         new AmbientLight(0xaaaaaa,1);
        const raycaster =       new Raycaster();
        const textureLoader =   new TextureLoader();
        const objLoader =       new OBJLoader();
        const spotLight =       new SpotLight(0xffffff);
        scene.background =      new Color( 0xcce0ff );
        scene.fog =             new Fog( 0xcce0ff, 5000, 10000 );
        spotLight.position.set( 0, 30000, 5000 );
        spotLight.intensity = 1;
        spotLight.castShadow = true;

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
        scene.add(this.world, ambient, spotLight);

        this.renderer = renderer;
        this.scene = scene;
        this.raycaster = raycaster;
        this.camera.object = camera;
        this.camera.controls = controls;
        this.textureLoader = textureLoader;
        this.objLoader = objLoader;

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
        this._addBasePlane().then(() => {
            const objLinks = parseData(this.data);
            console.log(objLinks);
            // const linksForLoad = objLinks.filter((link, index, arr) =>
            //     arr.map(mapObj => mapObj.model.src_threejs).indexOf(link.model.src_threejs) === index
            // ).map((part) => part.model.src_threejs);
            // const linksForLoad = objLinks.map((part) => part.model.src_threejs);
            // const loadNextFile = () => {
            //     if (index > linksForLoad.length - 1) return false;
            //     this.loadModel(linksForLoad[index]);
            //     index++;
            //     loadNextFile();
            // };
            //
            // loadNextFile();

            objLinks.forEach((part) => {
                this.loadModel(part);
            });

        });
        DragdropControls.setUpMouseHandler(this.canvas,this._doMouseDown,this._doMouseMove,this._doMouseUp, true);
        this._render();
    }

    _addBasePlane() {
        const groundTexture = this.textureLoader.load( '../assets/images/grasslight-big.jpg' );
        groundTexture.wrapS = groundTexture.wrapT = RepeatWrapping;
        groundTexture.repeat.set( 25, 25 );
        groundTexture.anisotropy = 16;
        const groundMaterial = new MeshLambertMaterial( { map: groundTexture } );
        const meshGround = new Mesh( new PlaneBufferGeometry( 50000, 50000), groundMaterial );
        meshGround.position.y = - 10;
        meshGround.rotation.x = - Math.PI / 2;
        meshGround.receiveShadow = true;
        this.world.add( meshGround );

        const material = new MeshPhongMaterial({
            color : new Color(0xffffff),
            side : DoubleSide,
            shininess :0,
            map : this.textureLoader.load('../assets/images/grass.png'),
            bumpMap : this.textureLoader.load('../assets/images/grass.png'),
            bumpScale : -.05,
            transparent : true,
            depthTest : true,
            depthWrite : true,
            alphaTest : .25,
        });
        const group = new Object3D();
        let positionResolve;

        this.ground = new Mesh(
            new PlaneBufferGeometry(this.areaWidth, this.areaHeight, 8, 8),
            new MeshBasicMaterial({
                color: 0x555555,
                // transparent: true
                // map: this.textureLoader.load('../assets/images/ground.jpg')
            })
        );
        // this.ground.material.map.wrapS = RepeatWrapping;
        // this.ground.material.map.wrapT = RepeatWrapping;
        // this.ground.material.map.repeat.set(4, 4);
        // this.ground.visible = false;
        this.ground.position.x = this.areaWidth / 2;
        this.ground.position.y = 0;
        this.ground.position.z = this.areaHeight / 2;
        this.ground.rotation.x =  -Math.PI / 2;
        this.ground.geometry.computeBoundingBox();
        this.ground.dragable = false;
        const v0 = this.ground.geometry.boundingBox.min;
        const v1 = this.ground.geometry.boundingBox.max;

        // this.world.add(this.ground);


        this.objLoader.load('../assets/images/Grass.obj', (geometry) => {
            geometry.traverse((mesh) => {
                if (mesh instanceof Mesh) {
                    const meshBox = new Box3().setFromObject(mesh).getSize(new Vector3());
                    const len = Math.floor((this.areaWidth * this.areaHeight) / (meshBox.x * meshBox.y));
                    mesh.material = material;
                    for (let i = 0; i <= len; i++) {
                        const grassClone = mesh.clone();
                        const scaler = Math.random() * (1.5 - 0.5) + 0.5;
                        grassClone.position.copy(randomPointInDiapason(v0, v1));
                        grassClone.rotation.y = randNum(0,360,true) * Math.PI / 180;
                        grassClone.scale.set(scaler,scaler,scaler);

                        group.add(grassClone);
                    }
                }
            });

            Object.assign(group, {
                dragable: false,
                editable: false
            });

            this.groups.push(group);
            this.world.add(group);

            positionResolve();
        });

        return new Promise((resolve) => { positionResolve = resolve; });
    }

    _setCameraOptions() {
        this.camera.object.position.set( this.areaWidth/2, 400, 3000 );
        this.camera.object.lookAt(this.scene.position);
        this.camera.controls.rotateSpeed    = 1.0;
        this.camera.controls.zoomSpeed      = 1.0;
        this.camera.controls.enablePan      = false;
        this.camera.controls.enableDamping  = false;
        this.camera.controls.dampingFactor  = 0.1;
        this.camera.controls.rotateSpeed    = 0.5;
        this.camera.controls.staticMoving = true;
        this.camera.controls.minDistance = 1000;
        this.camera.controls.maxDistance = 7000;
        this.camera.controls.minPolarAngle = Math.PI / 3;
        this.camera.controls.maxPolarAngle = Math.PI / 3;
        this.camera.controls.target.set(this.areaWidth/2, 0, this.areaHeight/2);
    }

    _doMouseDown(x,y) {
        if (this.targetForDragging.parent === this.world) {
            this.world.remove(this.targetForDragging);
        }
        const a = 2*x/this.canvas.width - 1;
        const b = 1 - 2*y/this.canvas.height;
        this.raycaster.setFromCamera( new Vector2(a,b), this.camera.object );
        this.intersects = this.raycaster.intersectObjects( this.world.children, true );
        if (this.intersects.length === 0) {
            return false;
        }
        const item = this.intersects[0];
        const itemsParent = item.object.parent;
        let objectHit;

        if (itemsParent && itemsParent.parentObjectId && this.sceneGroups[itemsParent.parentObjectId]) {
            objectHit = this.sceneGroups[itemsParent.parentObjectId];
        } else {
            objectHit = item.object;
        }
        
        if (!this.camera.controls.enabled || !objectHit.dragable) {
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
        const meshBox = new Box3().setFromObject(this.dragItem).getSize(new Vector3());
        const coords = new Vector3(locationX - meshBox.x/2, 0, locationZ - meshBox.z/2);
        const boundMax = this.ground.geometry.boundingBox.max;
        const boundMin = this.ground.geometry.boundingBox.min;

        this.world.worldToLocal(coords);
        a = Math.min(
            boundMax.x + boundMax.x - meshBox.x,
            Math.max(boundMin.x + boundMax.x, coords.x)
        );

        b = Math.min(
            boundMax.y + boundMax.y - meshBox.z,
            Math.max(boundMin.y + boundMax.y, coords.z)
        );
        this.dragItem.position.x = a;
        this.dragItem.position.z = b;
        // this.renderer.render(this.scene, this.camera.object);
    }

    _doMouseUp() {
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
                if (options.zoom) {
                    controls.setRadius(angle.zoom);
                }
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



    loadModel(part) {
        const meshes = [];
        const group = new Object3D();
        const constantsMaterials = {};
        const texture = this.textureLoader.load(part.material.src_threejs, function ( texture ) {
            texture.wrapS = texture.wrapT = RepeatWrapping;
        });
        const partPosition = new Vector3(
            part.model.default_position.x_threejs,
            part.model.default_position.y_threejs,
            part.model.default_position.z_threejs,
        );
        const partRotation = new Vector3(
            part.model.default_position.rotation_x,
            part.model.default_position.rotation_y,
            part.model.default_position.rotation_z,
        );
        this.sceneGroups[part.parent_id] = new Object3D();

        part.model.constant_materials.forEach((mat) => {
            const constantTexture = this.textureLoader.load(mat.material.src_threejs, ( tex ) => {
                tex.wrapS = tex.wrapT = RepeatWrapping;
            });
            Object.assign(constantsMaterials, {
                [mat.mashname]: constantTexture
            });
        });

        this.objLoader.load(part.model.src_threejs, (object) => {
            object.traverse((mesh) => {
                if (mesh instanceof Mesh) {
                    if (constantsMaterials[mesh.name]) {
                        mesh.material = new MeshPhongMaterial({
                            map: constantsMaterials[mesh.name],
                            transparent: true,
                            // color: "#ff0000"
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

            group.position.set(partPosition.x, partPosition.y, partPosition.z);
            group.rotation.set(partRotation.x, partRotation.y, partRotation.z);

            Object.assign(group, {
                dragable: true,
                editable: true,
                parentObjectId: part.parent_id
            });

            Object.assign(this.sceneGroups[part.parent_id], {
                dragable: true
            });

            if (part.texts.length) {
                const canvasForImage = this.configurator2d.addGroup(part.parent_id);

                part.texts.forEach((textItem) => {
                    const meshForTexture = group.getObjectByName(textItem.mobility_mashname);
                    if (meshForTexture) {
                        const {width, height, left, top} = calculateCanvasFramePosition(
                            meshForTexture, this.camera.object, this.width, this.height
                        );
                        const textureCanvas = this.configurator2d.createCanvasForTexture(meshForTexture, width, height, left, top);
                        console.log(this.configurator2d.canvases);
                    }

                    // canvas2dGroup.push()
                });
            }

            this.sceneGroups[part.parent_id].add(group);

            this.world.add(this.sceneGroups[part.parent_id]);
        });
    }



    editFrontText() {
        this.camera.controls.minPolarAngle = 0;
        this.camera.controls.maxPolarAngle = Infinity;
        this.camera.controls.enabled = false;
        this.defaultCameraPosition.x = this.camera.controls.target.x;
        this.defaultCameraPosition.y = this.camera.controls.target.y;
        this.defaultCameraPosition.z = this.camera.controls.getRadius();
        const stellaFront = this.world.getObjectByName('TextBox');

        this._setCameraPosition({
            polar: Math.PI / 2,
            zoom: getCenterPoint(stellaFront).z + 1500,
            x: getCenterPoint(stellaFront).x,
            y: getCenterPoint(stellaFront).y,
            azimuth: 0,
        }).then(() => {
            const {width, height, left, top} = calculateCanvasFramePosition(
                stellaFront, this.camera.object, this.width, this.height
            );
            if (stellaFront.material.isFilled) {
                stellaFront.material.map = new Texture();
                document.body.appendChild(this.textBox.canvas.wrapperEl);
                this.textBox.canvas.wrapperEl.style.left = left;
                this.textBox.canvas.wrapperEl.style.top = top;
                this.textBox.canvas.wrapperEl.style.width = width;
                this.textBox.canvas.wrapperEl.style.height = height;
                const textBox = this.textBox.canvas.getItemByName('TextBox');
                if (textBox) {
                    this.textBox.canvas.setActiveObject(textBox);
                    textBox.enterEditing();
                }
            } else {
                this._createCanvasForText(stellaFront, width, height, left, top);
            }
        });
    }

    setFrontText() {
        this.textBox.canvas.discardActiveObject();
        this.textBox.canvas.renderAll();
        const stellaFront = this.world.getObjectByName('TextBox');
        const { canvas } = this.textBox.canvas.contextContainer;
        stellaFront.material.map = new CanvasTexture(canvas);

        if (document.querySelector('.canvas-container')) {
            document.querySelector('.canvas-container').remove();
        }

        this._setCameraPosition({
            x: this.defaultCameraPosition.x,
            y: this.defaultCameraPosition.y,
            polar: Math.PI / 3,
            zoom: this.defaultCameraPosition.z
        }).then(() => {
            this.camera.controls.maxPolarAngle = Math.PI / 3;
            this.camera.controls.minPolarAngle = Math.PI / 3;
            this.camera.controls.enabled = true;
        });
    }

    setTexture(path) {
        this.textureLoader.load(path, ( texture ) => {

            texture.wrapS = texture.wrapT = RepeatWrapping;
            this.groups.forEach((group) => {
                group.children.forEach((mesh) => {
                    if (group.editable && mesh.name !== 'TextBox') {
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
