// The three.js scene: the 3D world where you put objects
import * as THREE from 'three'
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { FontLoader } from "three/examples/jsm/loaders/FontLoader"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry"
import {ImprovedNoise} from "three/examples/jsm/math/ImprovedNoise";
run_simulation()
async function run_simulation() {
  console.log("start loading rapier")
  await RAPIER.init();
  const scene = new THREE.Scene(); //threeJS
  let world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });//rapier
  // world.allowSleep = true -- fixy
  let physicObj = [];
  //CannonDebugger
  // The camera
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.y = 1.6;
 let now,then = 0
  // add random functions
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  const imgLoader = new THREE.TextureLoader()
  function loadImg(url, x, y) {
    let texture = imgLoader.load(url);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.repeat.set(x, y);
    return texture
  }
  function toRad(num) { return num * (Math.PI / 180) }
  // The renderer: something that draws 3D objects onto the canvas
  const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#c"), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xaaaaaa, 1);
  // Append the renderer canvas into <body>
  document.body.appendChild(renderer.domElement);
  // add canvas rescaling
  window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}
  // add sky
  const skyloader = new THREE.CubeTextureLoader();
  const skytexture = skyloader.load([
    'tex/sky/px.png',
    'tex/sky/nx.png',
    'tex/sky/py.png',
    'tex/sky/ny.png',
    'tex/sky/pz.png',
    'tex/sky/nz.png',
  ]);
  scene.background = skytexture;

  //add Controls
  const controls = new PointerLockControls(camera, renderer.domElement);
  scene.add(controls.getObject())
  // add eventListners
  var ft, lf, bk, rt, debug, sprint = false
  const instructions = renderer.domElement.addEventListener('click', function() {
    controls.lock();
  });
  renderer.domElement.addEventListener('keydown', keydown);
  renderer.domElement.addEventListener('keyup', keyup);
  //Attach listeners to functions
  var camPos = camera.position
  function keydown(e) {
    console.log(e.code)
    switch (e.code) {

      case 'ArrowUp':
      case 'KeyW':
        ft = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        lf = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        bk = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        rt = true;
        break;

      case 'ShiftRight':
      case 'ShiftLeft':
        sprint = !sprint
        break;
      case 'KeyT':
        debug = true;
        break;
      case 'KeyE':
        holdHold.start()
        break;
      case 'KeyC':
        let holde = new THREE.Object3D();
        holde.quaternion.copy(camera.quaternion);
        holde.position.copy(camera.position);
        holde.translateZ(-3)
        create(holde.position) //create a cube
        break;
    }
  }
  function keyup(e) {
    switch (e.code) {

      case 'ArrowUp':
      case 'KeyW':
        ft = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        lf = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        bk = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        rt = false;
        break;
    }
  }
  //  glb / gltf loader
  const glbloader = new GLTFLoader();
  function glbload(path,whendone){
    glbloader.load( path, function ( gltf ) {
	    whendone(gltf)
    }, undefined, function ( error ) {
	    console.error( error );
    } );
  }
  var sitting=false
  //boat and wood texture
  let woodTex=new THREE.MeshStandardMaterial({
        color: 0xffffff,map:loadImg("tex/floor/wood32.jpg",1,1)
  })
  let sten=new THREE.MeshStandardMaterial({
        color: 0xffffff,map:loadImg("tex/floor/wood32.jpg",1,1),colorWrite:false
  })
  
  glbload("tex/modals/rowboat.glb",function (gltf) {
    console.log('loaded boat',gltf)
    gltf.scene.position.setY(-.1)
    gltf.scene.children[0].material=woodTex
    gltf.scene.children[1].material=sten
    gltf.scene.children[2].material=woodTex
    gltf.scene.children[3].material=woodTex
    scene.add(gltf.scene)
    
  })
  
  var faar = 3
  // raycast and hold if hold
  var isHolding = false // if u ar holding sumtin
  let holding // what ur holding
  let target = new THREE.Object3D()
  class hold {
    constructor() { }
    cast() {
      raycaster.setFromCamera(new THREE.Vector2(), camera);
      const intersects = raycaster.intersectObjects(
        pickable.children);
      if (intersects.length) {
        return intersects[0].object
      }
      else { return false }
    }
    start() {
      let item = this.cast();
      if (item) {
        if (!isHolding) {// start holding
          isHolding = true
          holding = item
        } else {  // end holding 
          holding.physic.velocity.setZero()
          holding.physic.angularVelocity.setZero();
          isHolding = false
          holding = false
        }
      }
    }
    tick() { // run every frame to move holding item
      if (isHolding) {
        let tarPos = target.position;
        let holdPos = holding.physic;
        let cam = camera.position;
        holdPos.angularVelocity.set(0, 0, 0)
        target.quaternion.copy(camera.quaternion);
        target.position.copy(camera.position);
        target.translateZ(-3);
        target.lookAt(cam.x, tarPos.y, cam.z)
        holdPos.quaternion.copy(target.quaternion);

        holdPos.velocity.x = (tarPos.x - holdPos.position.x) * 6;
        holdPos.velocity.z = (tarPos.z - holdPos.position.z) * 6;
        holdPos.velocity.y = (tarPos.y - holdPos.position.y) * 6;

      }
    }

  }
  const holdHold = new hold()

  // objectDestroyer
  function removeObject3D(object3D) {
    if (!(object3D instanceof THREE.Object3D)) return false;

    // for better memory management and performance
    if (object3D.geometry) object3D.geometry.dispose();
    console.log("lol he gon")
    if (object3D.physic){
      object3D.physic.dispose=true
      world.removeRigidBody(object3D.physic)
                        
    }
    if (object3D.material) {
      if (object3D.material instanceof Array) {
        // for better memory management and performance
        object3D.material.forEach(material => material.dispose());
      } else {
        // for better memory management and performance
        object3D.material.dispose();
      }
    }
    object3D.removeFromParent(); // the parent might be the scene or another Object3D, but it is sure to be removed this way
    return true;
  }
  // create perlin noise object
  const perlin = new ImprovedNoise();
  // add object for pickables
  let pickable = new THREE.Object3D();
  scene.add(pickable);
  // add textures for floor
  let texture = loadImg('tex/floor/sea32.jpg', 40, 40);
  // the floor
  const cube = {
    // The geometry: the shape & size of the object
    geometry: new THREE.PlaneGeometry(300, 300, 150, 150),
    // The material: the appearance (color, texture) of the object
    material: new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture})
  };
  cube.mesh = new THREE.Mesh(cube.geometry, cube.material);
  scene.add(cube.mesh);
  //(geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true
  cube.mesh.geometry.verticesNeedUpdate = true;
  let position = cube.geometry.attributes.position.array;
  let heightmap = []
  cube.mesh.rotateX(toRad(270))
  cube.mesh.geometry.verticesNeedUpdate = true;

  //rapier  toRad(270)
  let importcoords = cube.mesh.geometry.attributes.position.array
  let dyna = RAPIER.RigidBodyDesc.fixed()
  let dyna2 = world.createRigidBody(dyna);
  let clDesc = RAPIER.ColliderDesc.cuboid(150, 0.1, 150)
  let cl = world.createCollider(clDesc, dyna2)
  cube.mesh.physic = dyna2   //final collider for mesh
  cube.mesh.physic.dispose=false
  cube.mesh.isPhysic = true


  // physics cube
  for (let fi = 0; fi < 60; fi++) { create(new THREE.Vector3(randInt(-150, 150), 3, randInt(-150, 150))) }
  create(new THREE.Vector3(0, 3, 0))
  function create(pos) {
    let texture4 = loadImg('tex/blocks/crat.jpg', 1, 1);
    let cube2 = {
      // The geometry: the shape & size of the object
      geometry: new THREE.BoxGeometry(1, 1, 1),
      // The material: the appearance (color, texture) of the object
      material: new THREE.MeshStandardMaterial({
        color: 0xffffff, map: texture4,
      })
    };
    cube2.mesh = new THREE.Mesh(cube2.geometry, cube2.material);
    scene.add(cube2.mesh);
    cube2.mesh.position.copy(pos)
    cube2.mesh.rotateY(randInt(1, 360))
    //rapierJS
    let dyna = RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z);
    let dyna2 = world.createRigidBody(dyna);
    let clDesc = RAPIER.ColliderDesc.cuboid(.5, .5, .5)
    let cl = world.createCollider(clDesc, dyna2)
    cube.mesh.physic = false
    cube2.mesh.physic = dyna2   //final collider for mesh
    cube2.mesh.isPhysic = true
    physicObj.push(cube2)
    pickable.add(cube2.mesh);
    return cube2
  } // font text load
  const loader = new FontLoader();

  loader.load('./tex/bigblue.json', function(font) {

    const geometry = new TextGeometry('sea', {
      font: font,
      size: 80,
      height: 5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 4,
      bevelSize: 4,
      bevelOffset: -1,
      bevelSegments: 2
    });
    let mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    let textMesh1 = new THREE.Mesh(geometry, mat);
    textMesh1.scale.set(0.01, 0.01, 0.01)
    textMesh1.position.set(-2, 3, -15)
    console.log(textMesh1); scene.add(textMesh1)

  });
  //add ambientLight
  const color = 0xFFFFFF;
  const intensity = 0.5;
  const light = new THREE.AmbientLight(color, intensity);
  scene.add(light);

  // add pointLight
  const light2 = new THREE.PointLight(color, intensity);
  light2.position.set(0, 10, 0);
  scene.add(light2);

  // mr grabby
  const raycaster = new THREE.Raycaster();
  let lookingAt = []
  function reset() {
    // restore the colors
    lookingAt.forEach((object) => {
      if (object.material) {
        object.material.emissive.setHex(0x000000);
        lookingAt.pop()
      }
    });
  }
  raycaster.far = faar
  function stare() {
    reset()
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const intersects = raycaster.intersectObjects(pickable.children);
    if (intersects.length) {
      if (intersects[0].object.material.emissive) {
        lookingAt.push(intersects[0].object)
        intersects[0].object.material.emissive.setHex(0x3d3d3d);
      }
    }
  }
  let a // bag for stopping NaN values
  let nowsec
  let new_fps,old_fps=30
  let speed = 0.000
  let time=0
  
  // RENDER LOOP -----------------------------!!!!!!!!!!!!!!!
  
  function render(now) {
    // calculate delta
     nowsec=now * 0.001
     let delta = nowsec - then;
     delta = delta || 5
     then = nowsec;
     new_fps=1/delta

     new_fps = old_fps * 0.9999 + new_fps * 0.0001
    // shift sea
     position = cube.geometry.attributes.position.array;
     heightmap=[]
  for (let i = 0; i < position.length; i += 3) {
    a= 0.72 * perlin.noise(position[i], position[i+1], now*0.00001*(new_fps))
    a = a || 0
    position[i + 2] = a
    heightmap.push(position[i +2])
  }
    cube.geometry.attributes.position.needsUpdate = true;
    cube.material.map.offset.add(new THREE.Vector2(0.00002*new_fps,0.00004*new_fps))
    // do a tick on holder holder
    holdHold.tick()
    world.step();

    for (let x = 0; x < physicObj.length; x++) {
      if (physicObj[x].mesh.physic.dispose){
        physicObj.splice(x, 1);
        continue
      }
      if (physicObj[x].mesh.isPhysic) {
        //rapier
        let t = physicObj[x].mesh.physic.translation();
        physicObj[x].mesh.position.set(t.x, t.y, t.z);
        let r = physicObj[x].mesh.physic.rotation();
        physicObj[x].mesh.quaternion.set(r.x, r.y, r.z, r.w);

        if (t.y < -10) { // remove item
          removeObject3D(physicObj[x].mesh)
          removeObject3D(physicObj[x])
        }
      } else { //grab physics
        /* fix later
        physicObj[x].mesh.physic.position.copy(physicObj[x].mesh.position)
        physicObj[x].mesh.physic.quaternion.copy(physicObj[x].mesh.quaternion)
        physicObj[x].mesh.physic.velocity.setZero()
        physicObj[x].mesh.physic.angularVelocity.setZero()
        */
      }
    } //stare highlight on pickable
    stare()
    // move player 
    if (!sitting) {
    if (ft) {
      controls.moveForward(speed*new_fps);
    }
    if (bk) {
      controls.moveForward(0 - speed*new_fps);
    }
    if (lf) {
      controls.moveRight(0 - speed*new_fps);
    }
    if (rt) {
      controls.moveRight(speed*new_fps);
    }
    if (sprint) {
      speed = 0.005
    } else {
      speed = 0.002
    }}

    // Render the scene and the camera
    renderer.render(scene, camera);

    // Rotate the cube every frame
    // Make it call the render() function about every 1/60 second
    requestAnimationFrame(render);
  }

  render();
};