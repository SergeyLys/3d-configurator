import * as THREE from 'three-full';
import { EventsControls } from './EventControls';
import "../assets/styles/index.scss";
import {getAbsolutePosition} from './helpers';

class Configurator {
    constructor() {
        this.camera = {};

        this._initScene();
        this._addBasePlane();
        this._render();
    }

    _initScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 10000 );
        const renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        const ambient = new THREE.AmbientLight('#ffffff');
        const raycaster = new THREE.Raycaster();

        renderer.setClearColor( 0x6495ED );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        this.renderer = renderer;
        this.scene = scene;
        this.raycaster = raycaster;
        this.camera.object = camera;
        this.camera.controls = controls;
        this.camera.object.position.set( 100, 400, 3000 );
        this.camera.object.lookAt(this.scene.position);
        this.camera.controls.rotateSpeed    = 1.0;
        this.camera.controls.zoomSpeed      = 1.0;
        // this.camera.controls.maxDistance    = 15;
        // this.camera.controls.minDistance    = 7;
        this.camera.controls.enablePan      = false;
        this.camera.controls.enableDamping  = false;
        this.camera.controls.dampingFactor  = 0.1;
        this.camera.controls.rotateSpeed    = 0.5;
        this.camera.controls.staticMoving = true;
        this.camera.controls.minPolarAngle = Math.PI / 3;
        this.camera.controls.maxPolarAngle = Math.PI / 3;
        this.camera.controls.target.set(0, 0, 0);

        this.scene.add(ambient);


    }

    _addBasePlane() {
        this.plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(2500, 2500, 8, 8), new THREE.MeshBasicMaterial({color: 0x555555}));
        this.plane.position.y = 0;
        this.plane.rotation.x =  -Math.PI / 2;
        this.scene.add(this.plane);
    }

    loadModel(path) {
        const loader = new THREE.OBJLoader();
        const mtlLoader = new THREE.MTLLoader();
        const textureLoader = new THREE.TextureLoader();
        const that = this;
        mtlLoader.load('../assets/images/09.mtl', (materials) => {
            materials.preload();
            loader
                .setMaterials(materials)
                .load(path, (object) => {
                object.traverse((mesh) => {
                    if (mesh instanceof THREE.Mesh) {
                        const objectGroup = new THREE.Group();
                        mesh.material = new THREE.MeshPhongMaterial({
                            // color: '#ff0000',
                            map: textureLoader.load('../assets/images/01.jpg')
                        });
                        console.log(mesh.material);
                        mesh.absoluteCoords = getAbsolutePosition(mesh);
                        mesh.geometry.center();
                        mesh.position.y = mesh.absoluteCoords.y;
                        objectGroup.add(mesh);

                        this.scene.add(mesh);

                        this.EventsControls1 = new EventsControls( this.camera.object, this.renderer.domElement );
                        this.EventsControls1.map = this.plane;

                        this.EventsControls1.attachEvent( 'mouseOver', function () {

                            this.container.style.cursor = 'pointer';

                            that.camera.controls.enabled = false;
                            that.camera.controls.target0.copy( that.camera.controls.target );
                            that.camera.controls.position0.copy( that.camera.controls.object.position );

                        });

                        this.EventsControls1.attachEvent( 'mouseOut', function () {

                            this.container.style.cursor = 'auto';

                            that.camera.controls.reset();
                            that.camera.controls.target.copy( that.camera.controls.target0 );
                            that.camera.controls.object.position.copy( that.camera.controls.position0 );
                            that.camera.controls.update();
                            that.camera.controls.enabled = true;

                        });

                        this.EventsControls1.attachEvent( 'dragAndDrop', function () {

                            this.container.style.cursor = 'move';
                            this.focused.position.y = this.previous.y;

                        });

                        this.EventsControls1.attachEvent( 'mouseUp', function () {

                            this.container.style.cursor = 'auto';

                        });
                        this.EventsControls1.attach( mesh );
                    }
                });
            });
        });
    }

    _render() {
        const { camera, scene, renderer } = this;
        requestAnimationFrame(()=> {
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
    app.loadModel("../assets/images/09.obj");

});
