import * as THREE from 'three-full';
import "../assets/styles/index.scss";

class Configurator {
    constructor() {
        this.onDocumentMouseMove = this.onDocumentMouseMove.bind(this);
        this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
        this.onDocumentMouseUp = this.onDocumentMouseUp.bind(this);

        this.camera = {};
        this.selection = null;
        this.offset = new THREE.Vector3();
        this.objects = [];

        this._initScene();
        this._initDragControls();
        this._render();
        // this._addEventListeners();
    }

    _initScene() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const renderer = new THREE.WebGLRenderer();
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        const ambient = new THREE.AmbientLight('#ffffff');
        const raycaster = new THREE.Raycaster();

        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        this.renderer = renderer;
        this.scene = scene;
        this.raycaster = raycaster;
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
        document.addEventListener('mousedown', this.onDocumentMouseDown, false);
        document.addEventListener('mousemove', this.onDocumentMouseMove, false);
        document.addEventListener('mouseup', this.onDocumentMouseUp, false);

    }

    _addHelperPlane() {
        this.plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 8, 8), new THREE.MeshBasicMaterial({color: 0xffffff}));
        this.plane.material.visible = false;
        this.scene.add(this.plane);
    }

    _initDragControls() {
        const dragControls = new THREE.DragControls(this.objects, this.camera.object, this.renderer.domElement);
        dragControls.addEventListener('dragstart', (event) => {
            console.log(event);
            this.camera.controls.enabled = false;
        });
        dragControls.addEventListener('dragend', () => {
            this.camera.controls.enabled = true;
        });
    }

    onDocumentMouseDown(event) {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        const vector = new THREE.Vector3(mouseX, mouseY, 1);
        vector.unproject(this.camera.object);
        this.raycaster.set( this.camera.object.position, vector.sub( this.camera.object.position ).normalize() );
        let intersects = this.raycaster.intersectObjects(this.objects);
        if (intersects.length > 0) {
            this.camera.controls.enabled = false;
            this.selection = intersects[0].object;
            intersects = this.raycaster.intersectObject(this.plane);
            this.offset.copy(intersects[0].point).sub(this.plane.position);
        }
    }

    onDocumentMouseMove(event) {
        event.preventDefault();
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        const vector = new THREE.Vector3(mouseX, mouseY, 1);
        vector.unproject(this.camera.object);
        this.raycaster.set( this.camera.object.position, vector.sub( this.camera.object.position ).normalize() );
        if (this.selection) {
            const intersects = this.raycaster.intersectObject(this.plane);
            this.selection.position.copy(intersects[0].point.sub(this.offset));
        } else {
            const intersects = this.raycaster.intersectObjects(this.objects);
            if (intersects.length > 0) {
                this.plane.position.copy(intersects[0].object.position);
                this.plane.lookAt(this.camera.object.position);
            }
        }
    }

    onDocumentMouseUp() {
        this.camera.controls.enabled = true;
        this.selection = null;
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
                    this.objects.push(mesh);
                    this.scene.add(mesh);
                }
            });
        });
        // let object, material, radius;
        // const objGeometry = new THREE.SphereGeometry(1, 24, 24);
        // for (let i = 0; i < 50; i++) {
        //     material = new THREE.MeshPhongMaterial({color: Math.random() * 0xffffff});
        //     material.transparent = true;
        //     object = new THREE.Mesh(objGeometry.clone(), material);
        //     this.objects.push(object);
        //
        //     radius = Math.random() * 4 + 2;
        //     object.scale.x = radius;
        //     object.scale.y = radius;
        //     object.scale.z = radius;
        //
        //     object.position.x = Math.random() * 50 - 25;
        //     object.position.y = Math.random() * 50 - 25;
        //     object.position.z = Math.random() * 50 - 25;
        //
        //     this.scene.add(object);
        // }

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
