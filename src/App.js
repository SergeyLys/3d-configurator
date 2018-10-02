import React from 'react';
import ReactDOM from 'react-dom';
import React3 from 'react-three-renderer';
import * as THREE from 'three-full';
import OBJLoader from './OBJLoader';

OBJLoader(THREE);


class App extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            cameraPosition: new THREE.Vector3(0, 0, 2000),
            meshPosition: new THREE.Vector3(0, 0, 0),
            lightPosition: new THREE.Vector3(300, 300, 2000),
            obj: 'assets/object.obj',
        };
        this.renderObjGraveObject = this.renderObjGraveObject.bind(this);

        this.THREE = THREE;
    }


    renderObjGraveObject() {
        const onProgress = (xhr) => {
            if (xhr.lengthComputable) {
                const percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        };
        const onError = (xhr) => {
            console.log(xhr)
        };
        const objLoader = new this.THREE.OBJLoader();
        const group = this.refs.group;

        return (
            objLoader.load(this.state.obj, object => {
                object.traverse((mesh) => {
                    if (mesh instanceof THREE.Mesh) {
                        const imgeLoader = new THREE.TextureLoader();
                        const texture = imgeLoader.load('assets/01_Gabrodiabaz.jpg');
                        // texture.repeat.set( 0.5, 0.5 );
                        mesh.geometry.attributes.uv2 = mesh.geometry.attributes.uv;
                        mesh.material = new THREE.MeshPhongMaterial({
                            // color: "#ff0000",
                            map: texture
                        });
                        mesh.geometry.center();
                        group.add(mesh);
                    }
                });
                // group.add(object);
                this.setState({object});
            }, onProgress, onError)
        )
    }


    componentDidMount() {
        this.renderObjGraveObject();

        const controls = new THREE.OrbitControls(this.refs.mainCamera,
            ReactDOM.findDOMNode(this.refs.react3));

        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;

        controls.noZoom = false;

        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;

        this.controls = controls;
    }

    componentWillUnmount() {
    }

    _onAnimate = () => {
        this.controls.update();
    };

    render() {
        return (<div>
            <React3
                mainCamera="camera"
                width={window.innerWidth}
                height={window.innerHeight}
                onAnimate={this._onAnimate}
                ref={"react3"}
                clearColor={'rgba(255, 255, 255, 255)'}
                antialias
            >
                <scene>
                    <perspectiveCamera
                        name="camera"
                        ref={"mainCamera"}
                        fov={75}
                        aspect={window.innerWidth / window.innerHeight}
                        near={0.1}
                        far={5000}
                        position={this.state.cameraPosition}
                    />
                    <ambientLight
                        color={'white'}
                        intensity={5}
                    />
                    <group
                        ref='group'
                        position={this.state.meshPosition}
                        castShadow
                        receiveShadow
                    />
                </scene>
            </React3>

        </div>);
    }
}

export default App;
