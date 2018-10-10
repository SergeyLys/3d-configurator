import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    OrbitControls,
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
} from 'three-full';
import "../assets/styles/index.scss";
import {getAbsolutePosition, setUpMouseHander, setUpTouchHander} from './helpers';

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

        this._doMouseDown = this._doMouseDown.bind(this);
        this._doMouseMove = this._doMouseMove.bind(this);
        this._doMouseUp = this._doMouseUp.bind(this);

        this._initScene();
    }

    _initScene() {
        const scene =       new Scene();
        const camera =      new PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
        const renderer =    new WebGLRenderer({ antialias: true });
        const controls =    new OrbitControls(camera, renderer.domElement);
        const ambient =     new AmbientLight('#ffffff');
        const raycaster =   new Raycaster();

        renderer.setClearColor( 0x6495ED );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        this.targetForDragging = new Mesh(
            new BoxGeometry(10000,0.01,10000),
            new MeshBasicMaterial()
        );
        this.targetForDragging.material.visible = false;

        this.canvas = renderer.domElement;

        this.world = new Object3D();
        scene.add(this.world, ambient);

        this.renderer = renderer;
        this.scene = scene;
        this.raycaster = raycaster;
        this.camera.object = camera;
        this.camera.controls = controls;

        const box = new Mesh(
            new BoxGeometry(200, 200, 200),
            new MeshPhongMaterial( {color:"yellow"} )
        );
        box.position.y = 100;
        box.position.x = 300;
        box.position.z = 300;

        const addBox = (x,z) => {
            const obj = box.clone();
            obj.position.x = x;
            obj.position.z = z;
            this.world.add(obj);
        };

        addBox(-450,-170);
        addBox(-180,450);

        this.world.add(box);
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
        this.camera.controls.enabled = true;
    }

    loadModel(path) {
        const meshes = [];
        const loader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        const textureLoader = new TextureLoader();
        const group = new Object3D();
        const texture = textureLoader.load('../assets/images/1.jpg', function ( texture ) {

            texture.wrapS = texture.wrapT = RepeatWrapping;

        } );
        // mtlLoader.load('../assets/images/14.mtl', (materials) => {
        //     materials.preload();
            loader
                // .setMaterials(materials)
                .load(path, (object) => {
                object.traverse((mesh) => {
                    if (mesh instanceof Mesh) {
                        mesh.material = new MeshPhongMaterial({
                            map: texture
                        });
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

});
