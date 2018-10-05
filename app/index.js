import * as THREE from 'three-full';
import "../assets/styles/index.scss";

class Configurator {
    constructor() {
        this.camera = {};
        this._initScene();
        this._render();
    }

    _initScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const renderer = new THREE.WebGLRenderer();
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        const ambient = new THREE.AmbientLight('#ffffff');

        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        this.renderer = renderer;
        this.scene = scene;
        this.camera.object = camera;
        this.camera.controls = controls;
        this.camera.object.lookAt(this.scene.position);
        this.camera.controls.rotateSpeed    = 1.0;
        this.camera.controls.zoomSpeed      = 1.0;
        this.camera.controls.maxDistance    = 15;
        this.camera.controls.minDistance    = 7;
        this.camera.controls.enablePan      = false;
        this.camera.controls.enableDamping  = false;
        this.camera.controls.dampingFactor  = 0.1;
        this.camera.controls.rotateSpeed    = 0.5;
        this.camera.controls.target.set(0, 0, 0);

        this.scene.add(ambient);


    }

    _addEventListeners() {

    }

    loadModel(path) {
        const loader = new THREE.OBJLoader();
        loader.load(path, (object) => {
            object.traverse((mesh) => {
                if (mesh instanceof THREE.Mesh) {
                    mesh.material = new THREE.MeshPhongMaterial({
                        color: '#ff0000'
                    });
                    mesh.geometry.center();
                    this.scene.add(mesh);
                }
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
    app.loadModel("../assets/images/model.obj");

});
