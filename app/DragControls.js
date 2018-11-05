import {EventDispatcher, Camera, Plane, Raycaster, Vector2, Vector3, Box3} from 'three-full';



var DragControls = function ( _objects, _camera, _domElement, sceneGroups, limits ) {

    if ( _objects instanceof Camera ) {

        console.warn( 'DragControls: Constructor now expects ( objects, camera, domElement )' );
        var temp = _objects; _objects = _camera; _camera = temp;

    }

    var _plane = new Plane(new Vector3(0, 1, 0), 0);
    var _raycaster = new Raycaster();

    var _mouse = new Vector2();
    var _offset = new Vector3();
    var _intersection = new Vector3();

    var _selected = null, _hovered = null;

    //

    var scope = this;

    function activate() {

        _domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
        _domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
        _domElement.addEventListener( 'mouseup', onDocumentMouseCancel, false );
        _domElement.addEventListener( 'mouseleave', onDocumentMouseCancel, false );
        _domElement.addEventListener( 'touchmove', onDocumentTouchMove, false );
        _domElement.addEventListener( 'touchstart', onDocumentTouchStart, false );
        _domElement.addEventListener( 'touchend', onDocumentTouchEnd, false );

    }

    function deactivate() {

        _domElement.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        _domElement.removeEventListener( 'mousedown', onDocumentMouseDown, false );
        _domElement.removeEventListener( 'mouseup', onDocumentMouseCancel, false );
        _domElement.removeEventListener( 'mouseleave', onDocumentMouseCancel, false );
        _domElement.removeEventListener( 'touchmove', onDocumentTouchMove, false );
        _domElement.removeEventListener( 'touchstart', onDocumentTouchStart, false );
        _domElement.removeEventListener( 'touchend', onDocumentTouchEnd, false );

    }

    function dispose() {

        deactivate();

    }

    function onDocumentMouseMove( event, object ) {

        event.preventDefault();

        var rect = _domElement.getBoundingClientRect();

        _mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
        _mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

        _raycaster.setFromCamera( _mouse, _camera );

        if ( _selected && scope.enabled ) {

            if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {
                const meshBox = new Box3().setFromObject(_selected).getSize(new Vector3());

                _selected.position.copy( _intersection.sub( _offset ) );
                if (_selected.position.x <= 0) {
                    _selected.position.x = 0;
                }
                if (_selected.position.x >= limits.x) {
                    _selected.position.x = limits.x;
                }
                console.log(_selected.position.z, meshBox, limits.z);
                if (_selected.position.z <= 0) {
                    _selected.position.z = 0;
                }
                if (_selected.position.z - meshBox.z >= limits.z) {
                    _selected.position.z = limits.z + meshBox.z;
                }
            }

            scope.dispatchEvent( { type: 'drag', object: _selected } );

            return;

        }

        _raycaster.setFromCamera( _mouse, _camera );

        var intersects = _raycaster.intersectObjects( _objects );

        if ( intersects.length > 0 ) {

            var object = intersects[ 0 ].object;

            // _plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), object.position );

            if ( _hovered !== object ) {

                scope.dispatchEvent( { type: 'hoveron', object: object } );

                _domElement.style.cursor = 'pointer';
                _hovered = object;

            }

        } else {

            if ( _hovered !== null ) {

                scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );

                _domElement.style.cursor = 'auto';
                _hovered = null;

            }

        }

    }

    function onDocumentMouseDown( event ) {

        event.preventDefault();

        _raycaster.setFromCamera( _mouse, _camera );

        var intersects = _raycaster.intersectObjects( _objects );

        if ( intersects.length > 0 ) {
            const item = intersects[0];
            const itemsParent = item.object.parent;
            let objectHit;

            if (itemsParent && itemsParent.parentObjectId && sceneGroups[itemsParent.parentObjectId]) {
                objectHit = sceneGroups[itemsParent.parentObjectId];
            } else {
                objectHit = item.object;
            }

            if (!objectHit.dragable) {
                return false;
            }

            _selected = objectHit;

            if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

                _offset.copy( _intersection ).sub( _selected.position );

            }

            _domElement.style.cursor = 'move';

            scope.dispatchEvent( { type: 'dragstart', object: _selected } );

        }


    }

    function onDocumentMouseCancel( event ) {

        event.preventDefault();

        if ( _selected ) {

            scope.dispatchEvent( { type: 'dragend', object: _selected } );

            _selected = null;

        }

        _domElement.style.cursor = 'auto';

    }

    function onDocumentTouchMove( event ) {

        event.preventDefault();
        event = event.changedTouches[ 0 ];

        var rect = _domElement.getBoundingClientRect();

        _mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
        _mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

        _raycaster.setFromCamera( _mouse, _camera );

        if ( _selected && scope.enabled ) {

            if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

                _selected.position.copy( _intersection.sub( _offset ) );

            }

            scope.dispatchEvent( { type: 'drag', object: _selected } );

            return;

        }

    }

    function onDocumentTouchStart( event ) {

        event.preventDefault();
        event = event.changedTouches[ 0 ];

        var rect = _domElement.getBoundingClientRect();

        _mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
        _mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

        _raycaster.setFromCamera( _mouse, _camera );

        var intersects = _raycaster.intersectObjects( _objects );

        if ( intersects.length > 0 ) {

            _selected = intersects[ 0 ].object;

            _plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _selected.position );

            if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

                _offset.copy( _intersection ).sub( _selected.position );

            }

            _domElement.style.cursor = 'move';

            scope.dispatchEvent( { type: 'dragstart', object: _selected } );

        }


    }

    function onDocumentTouchEnd( event ) {

        event.preventDefault();

        if ( _selected ) {

            scope.dispatchEvent( { type: 'dragend', object: _selected } );

            _selected = null;

        }

        _domElement.style.cursor = 'auto';

    }

    activate();

    // API

    this.enabled = true;

    this.activate = activate;
    this.deactivate = deactivate;
    this.dispose = dispose;

    // Backward compatibility


    this.on = function ( type, listener ) {

        console.warn( 'DragControls: on() has been deprecated. Use addEventListener() instead.' );
        scope.addEventListener( type, listener );

    };

    this.off = function ( type, listener ) {

        console.warn( 'DragControls: off() has been deprecated. Use removeEventListener() instead.' );
        scope.removeEventListener( type, listener );

    };

    this.notify = function ( type ) {

        console.error( 'DragControls: notify() has been deprecated. Use dispatchEvent() instead.' );
        scope.dispatchEvent( { type: type } );

    };

};

DragControls.prototype = Object.create( EventDispatcher.prototype );
DragControls.prototype.constructor = DragControls;

export { DragControls }
