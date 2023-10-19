var noise = new SimplexNoise();
var vizInit = function () {

  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  var fileLabel = document.querySelector("h1.file");
  var fileLabel2 = document.querySelector("label.file");

  document.onload = function (e) {
    audio.play();
    play();
  }

  file.onchange = function () {
    fileLabel.classList.add('normal');
    fileLabel2.classList.add('normal');
    audio.classList.add('active');
    var files = this.files;

    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    play();
  }

  function play() {
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    var scene = new THREE.Scene();
    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(0, 0, 100);
    //camera.lookAt(scene.position);
    scene.add(camera);


    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 5);
    //var mapping = new THREE.TextureLoader().load('mapping.png');
    var material = new THREE.MeshNormalMaterial();


    // var normal = new THREE.MeshNormalMaterial();

    var ball = new THREE.Mesh(icosahedronGeometry, material);
    ball.position.set(0, 0, 0);
    group.add(ball);

    var smallers = new THREE.IcosahedronGeometry(3, 3);

    for (let i = 0; i < 0; i++) {
      var balls = new THREE.Mesh(smallers, material);
      balls.position.x = (Math.random() - 0.5) * 750
      balls.position.y = (Math.random() - 0.5) * 1000
      balls.position.z = (Math.random() - 0.5) * 750

      group.add(balls)
    }

    for (let i = 0; i < 8000; i++) {
      var smaller = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );

      smaller.position.x = (Math.random() - 0.5) * 750
      smaller.position.y = (Math.random() - 0.5) * 750
      smaller.position.z = (Math.random() - 0.5) * 750
      group.add(smaller);
    }

    scene.add(group);

    document.getElementById('out').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    render();

    function render() {
      analyser.getByteFrequencyData(dataArray);

      var lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
      var upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);


      var overallAvg = avg(dataArray);
      var lowerMax = max(lowerHalfArray);
      var lowerAvg = avg(lowerHalfArray);
      var upperMax = max(upperHalfArray);
      var upperAvg = avg(upperHalfArray);


      let colour = 15
      if (overallAvg < 60) {
        colour = 15
        document.body.style.backgroundColor = 'rgb(' + colour + ',' + colour + ',' + colour + ')';
      } else if (overallAvg > 60) {
        colour += (overallAvg / 2)
        document.body.style.backgroundColor = 'rgb(' + colour + ',' + colour + ',' + colour + ')';
      }

      var lowerMaxFr = lowerMax / lowerHalfArray.length / 1.85;
      var lowerAvgFr = lowerAvg / lowerHalfArray.length;
      var upperMaxFr = upperMax / upperHalfArray.length;
      var upperAvgFr = upperAvg / upperHalfArray.length / 1.85;

      makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

      group.rotation.y += 0.005;
      group.rotation.z += 0.002;
      group.rotation.x += -0.005;
      renderer.render(scene, camera);

      requestAnimationFrame(render);
    }



    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function makeRoughBall(mesh, bassFr, treFr) {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        var offset = mesh.geometry.parameters.radius;
        var amp = 7;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance = (offset + bassFr) + noise.noise3D(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) * amp * treFr;
        vertex.multiplyScalar(distance);
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    //small ball move function
    // function makeRoughGround(mesh, distortionFr) {
    //     mesh.geometry.vertices.forEach(function (vertex, i) {
    //         var amp = 2;
    //         var time = Date.now();
    //         var distance = (noise.noise2D(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) * distortionFr * amp;
    //         vertex.z = distance;
    //     });
    //     mesh.geometry.verticesNeedUpdate = true;
    //     mesh.geometry.normalsNeedUpdate = true;
    //     mesh.geometry.computeVertexNormals();
    //     mesh.geometry.computeFaceNormals();
    // }

    audio.play();
  };
}

window.onload = vizInit();

document.body.addEventListener('touchend', function (ev) { context.resume(); });

function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + (fr * delta);
}

function avg(arr) {
  var total = arr.reduce(function (sum, b) { return sum + b; });
  return (total / arr.length);
}

function max(arr) {
  return arr.reduce(function (a, b) { return Math.max(a, b); })
}