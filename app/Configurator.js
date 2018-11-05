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
    WebGLRenderer,
} from "three-full";
import {
    getAbsolutePosition,
    parseData,
    parseSize,
    randNum,
    randomPointInDiapason,
    getCenterPoint,
    calculateCanvasFramePosition,
    filterUniqueItems
} from "./helpers";
import Configurator2d from "./Configurator2d";
import OrbitControls from "./libs/OrbitControls";
import UIController from "./UIController";
import TWEEN from "@tweenjs/tween.js";
import { DragControls } from './DragControls';

// TODO: 1. Парсинг схемы и загрузка мешей 5ч. DONE
// TODO: 2. Наложение текстов и портретов из схемы 12ч. DONE
// TODO: 3. Уменьшение асинхронных запросов на одинаковые файлы 4ч. DONE
// TODO: 4. Драгдроп целого объекта из схемы 4ч. DONE
// TODO: 5. Редактирование портретов и текстов 4ч. DONE

export default class Configurator {
    constructor(data) {
        this.camera = {};
        this.canvas = null;
        this.world = null;
        this.ground = null;
        this.targetForDragging = null;
        this.intersects = [];
        this.editableMeshes = [];
        this.meshesForDrag = [];
        this.sceneGroups = {};
        this.width = null;
        this.height = null;
        this.defaultCameraPosition = new Vector3();
        this.data = data;
        this.areaWidth = parseSize(this.data.size).width * 10;
        this.areaHeight = parseSize(this.data.size).height * 10;
        this.configurator2d = new Configurator2d();
        this.isMeshEditing = false;

        this._doMouseDown = this._doMouseDown.bind(this);

        document.addEventListener('mousedown', (e) => {
            this._doMouseDown(e, e.pageX, e.pageY);
        });
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
            objLinks.forEach((part) => {
                this.loadModel(part);
            });
            

            const dragControls = new DragControls(
                this.meshesForDrag,
                this.camera.object,
                this.renderer.domElement,
                this.sceneGroups,
                this.ground.position
            );

            dragControls.addEventListener( 'dragstart', ( e ) => {
                // e.preventDefault()
                this.camera.controls.enabled = false;
            });

            dragControls.addEventListener( 'dragend', ( e ) => {
                // e.preventDefault()
                this.camera.controls.enabled = true;

            });

            // document.addEventListener('mousedown', () => {
            //     console.log('mousedown');
            // });
        });
        // DragdropControls.setUpMouseHandler(this.canvas,this._doMouseDown,this._doMouseMove,this._doMouseUp, true);
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

            // this.groups.push(group);
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

    _doMouseDown(e, x,y) {
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
        if (this.editableMeshes.filter((mesh) => mesh === item.object).length && !this.isMeshEditing) {

            UIController.showButton('edit', () => {
                this.editMesh(item.object);
                UIController.removeButton('edit');
                this.isMeshEditing = true;
                UIController.showButton('apply', () => {
                    this.completeEditingMesh(item.object);
                    UIController.removeButton('apply');
                    this.isMeshEditing = false;

                });
            });

        } else if (e.target === this.renderer.domElement && (UIController.getButton('apply') || UIController.getButton('edit'))){
            UIController.removeButton('apply');
            UIController.removeButton('edit');
            this.isMeshEditing = false;

        }
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
                        });
                    } else {
                        mesh.material = new MeshPhongMaterial({
                            map: texture
                        });
                    }
                    part.mesh_id = mesh.id;
                    part.texts.forEach((t) => {
                        if (t.mobility_mashname === mesh.name) {
                            t.mesh_id = mesh.id;
                        }
                    });
                    part.portraits.forEach((p) => {
                        if (p.mobility_mashname === mesh.name) {
                            p.mesh_id = mesh.id;
                        }
                    });
                    mesh.part_id = part.id;
                    mesh.part_parent_id = part.parent_id;
                    mesh.absoluteCoords = getAbsolutePosition(mesh);
                    mesh.absoluteCoords.x += partPosition.x;
                    mesh.absoluteCoords.y += partPosition.y;
                    mesh.absoluteCoords.z += partPosition.z;
                    meshes.push(mesh);
                }
            });

            group.position.set(partPosition.x, partPosition.y, partPosition.z);
            group.rotation.set(partRotation.x, partRotation.y, partRotation.z);

            meshes.forEach((mesh) => {
                group.add(mesh);
                this.meshesForDrag.push(mesh);
            });

            Object.assign(group, {
                dragable: true,
                editable: true,
                parentObjectId: part.parent_id
            });

            Object.assign(this.sceneGroups[part.parent_id], {
                dragable: true
            });


            this.applySurfaceAttribute(group, part);

            this.sceneGroups[part.parent_id].add(group);
            this.world.add(this.sceneGroups[part.parent_id]);
        });
    }

    applySurfaceAttribute(group, part) {
        const objectGroupForCanvases = this.configurator2d.canvases[part.parent_id]
            ? this.configurator2d.canvases[part.parent_id]
            : this.configurator2d.canvases[part.parent_id] = {};
        const filteredTexts = filterUniqueItems(part.texts, 'mobility_mashname');
        const filteredPortraits = filterUniqueItems(part.portraits, 'mobility_mashname');
        const attributesArray = [...filteredTexts, ...filteredPortraits];

        attributesArray.forEach((attribute) => {
            const meshForTexture = group.getObjectById(attribute.mesh_id);
            if (meshForTexture && !meshForTexture.material.isFilled) {
                const {width, height} = part.model.constant_sizes.find((sizeItem) =>
                    sizeItem.meshName === attribute.mobility_mashname
                );
                const canvasesSubGroup = objectGroupForCanvases[part.id]
                    ? objectGroupForCanvases[part.id]
                    : objectGroupForCanvases[part.id] = {};
                const fabricCanvas = canvasesSubGroup[attribute.mesh_id]
                    ? canvasesSubGroup[attribute.mesh_id]
                    : canvasesSubGroup[attribute.mesh_id] = this.configurator2d.createCanvasForTexture(width, height);
                part.texts.forEach((tI) => {
                    if (tI.mobility_mashname === meshForTexture.name) {
                        const text = this.configurator2d.createTextInstance(tI.value, {
                            x: tI.position.x_threejs,
                            y: tI.position.y_threejs,
                        });
                        fabricCanvas.add(text);
                        fabricCanvas.renderAll();
                        if (!this.editableMeshes.length || !this.editableMeshes.filter((mesh) => mesh === meshForTexture).length) {
                            this.editableMeshes.push(meshForTexture);
                        }
                    }
                });

                part.portraits.forEach((pI) => {
                    if (pI.mobility_mashname === meshForTexture.name) {
                        this.configurator2d.getImageFromURL(pI.model.src_threejs, {
                            x: pI.position.x_threejs,
                            y: pI.position.y_threejs,
                        }).then((portrait) => {
                            fabricCanvas.add(portrait);
                            fabricCanvas.renderAll();
                            meshForTexture.material.map = new CanvasTexture(fabricCanvas.contextContainer.canvas);
                            meshForTexture.material.isFilled = true;
                            if (!this.editableMeshes.length || !this.editableMeshes.filter((mesh) => mesh === meshForTexture).length) {
                                this.editableMeshes.push(meshForTexture);
                            }
                        });
                    }
                });

                meshForTexture.material.map = new CanvasTexture(fabricCanvas.contextContainer.canvas);
                meshForTexture.material.isFilled = true;
            }
        });
    }

    editMesh(mesh) {
        this.camera.controls.minPolarAngle = 0;
        this.camera.controls.maxPolarAngle = Infinity;
        this.camera.controls.enabled = false;
        this.defaultCameraPosition.x = this.camera.controls.target.x;
        this.defaultCameraPosition.y = this.camera.controls.target.y;
        this.defaultCameraPosition.z = this.camera.controls.getRadius();
        mesh.absoluteCoords = getAbsolutePosition(mesh);

        this._setCameraPosition({
            polar: Math.PI / 2,
            zoom: getCenterPoint(mesh).z + 1500,
            x: getCenterPoint(mesh).x,
            y: getCenterPoint(mesh).y,
            azimuth: 0,
        }).then(() => {
            const {width, height, left, top} = calculateCanvasFramePosition(
                mesh, this.camera.object, this.width, this.height
            );
            const fabricCanvas = this.configurator2d.canvases[mesh.part_parent_id][mesh.part_id][mesh.id];
            mesh.material.map = new Texture();
            document.body.appendChild(fabricCanvas.wrapperEl);
            fabricCanvas.wrapperEl.style.position = 'absolute';
            fabricCanvas.wrapperEl.style.left = `${left}px`;
            fabricCanvas.wrapperEl.style.top = `${top}px`;
            fabricCanvas.wrapperEl.style.width = `${width}px`;
            fabricCanvas.wrapperEl.style.height = `${height}px`;
            fabricCanvas.lowerCanvasEl.style.transform = `scale(${width / fabricCanvas.width}, ${height / fabricCanvas.height})`;
            fabricCanvas.upperCanvasEl.style.transform = `scale(${width / fabricCanvas.width}, ${height / fabricCanvas.height})`;
            fabricCanvas.lowerCanvasEl.style.transformOrigin = 'left top';
            fabricCanvas.upperCanvasEl.style.transformOrigin = 'left top';
        });
    }

    completeEditingMesh(mesh) {
        const fabricCanvas = this.configurator2d.canvases[mesh.part_parent_id][mesh.part_id][mesh.id];
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
        const { canvas } = fabricCanvas.contextContainer;
        mesh.material.map = new CanvasTexture(canvas);

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
