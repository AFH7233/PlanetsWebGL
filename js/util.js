async function  readFile(fileName){
    var response =  await fetch(fileName);
    var data = await response.text();
    return data;
} 


function createShader(gl,text,type){
    var shader = gl.createShader(type);
    gl.shaderSource(shader,text);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function joinProgram(gl,vShader,fShader){
    var prog = gl.createProgram();
    gl.attachShader(prog,vShader);
    gl.attachShader(prog,fShader);
    gl.linkProgram(prog);

    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)){
        console.error(gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog); return null;
    }
    gl.deleteShader(fShader);
    gl.deleteShader(vShader);
    return prog;
}

function readObjects(objectData){
    const NEW_OBJECT = /^o\s/;
    const WHITESPACE_RE = /\s+/;

    const lines = objectData.split("\n");
    var meshes = [];
    var text = [];
    var insideObject = false;
    var name = "";
    var options = {};
    options.verts =  [];
    options.vertNormals = [];
    options.textures = [];

    for (let line of lines) {
        line = line.trim();
        if (NEW_OBJECT.test(line)) {
        
            if(text.length > 0){
                let mesh = new OBJ.Mesh(text.join("\n"),options);
                mesh.name = name;
                meshes.push(mesh);
            }
            const elements = line.split(WHITESPACE_RE);
            name =  elements[1];
            text = [];
            insideObject = true;
        } else if(insideObject){
            text.push(line);
        }
    }

    if(insideObject){
        let mesh = new OBJ.Mesh(text.join("\n"),options);
        mesh.name = name;
        meshes.push(mesh);
    }

    if(meshes.length == 0){
        let mesh = new OBJ.Mesh(objectData);
        meshes.push(mesh);
    }

    return meshes;

}

function customRotation(x){
    return function(velocidad){
        this.rotation =  this.rotation  > (2.0*Math.PI)? 0.0: this.rotation + velocidad*x*(((360/24.0)*2.0*Math.PI)/180.0);
    }
}

function customTranslation(x){
    return function(velocidad){
        this.rotation =  this.rotation  > (2.0*Math.PI)? 0.0: this.rotation + velocidad*x*(((360/365)/24.0)*2.0*Math.PI)/180.0;
    }
}

async function readSolarSystem(gl){

   
    var objects = [];
    var sunTextures = new Map();
    sunTextures.set("", {path: "Solar_System/Sun/2k_sun.jpg"} );
    objects[0] = await extractObjects(gl, [0,0,0], [0,1,0], "Solar_System/Sun/Sun.obj", sunTextures, 5.0, 1.0);
    objects[0].animation = customRotation(1/35);
    var sunDistance = -800*3.0;

    var mercuryTextures = new Map();
    mercuryTextures.set("Mercury", {path: "Solar_System/Mercury/2k_mercury.jpg"});
    var mercury = await extractObjects(gl, [sunDistance - 600,0,0], [0,1,0], "Solar_System/Mercury/Mercury.obj", mercuryTextures, 1/20);
    mercury.animation = customRotation(1/58.6462 );
    objects[1] = new Group3D([mercury], [0,0,0]);
    objects[1] .animation = customTranslation(1/0.241);

    var venusTextures = new Map();
    venusTextures.set("Venus", {path: "Solar_System/Venus/2k_venus_surface.jpg"});
   // venusTextures.set("Atmosphere", "Solar_System/Venus/2k_venus_atmosphere.jpg");
    var venus= await extractObjects(gl, [sunDistance  -1200,0,0], [0,-1,0], "Solar_System/Venus/Venus.obj", venusTextures, 100.0);
    venus.animation = customRotation(1/243);
    objects[2] = new Group3D([venus], [0,0,0]);
    objects[2].animation = customTranslation(1/0.6152);

    var earthTextures = new Map();
    earthTextures.set("Earth", {path: "Solar_System/Earth/2k_earth_daymap.jpg"} );
    //searthTextures.set("Atmosphere_Cube.001", "Solar_System/Earth/2k_earth_clouds.jpg");
    //earthTextures.set("Clouds_Cube.000", {path: "Solar_System/Earth/2k_earth_clouds.jpg", alpha: 0.3});
    var earth = await extractObjects(gl, [sunDistance -1700,0,0], [-1,1,0], "Solar_System/Earth/Earth.obj", earthTextures, 20.0);
    earth.animation = customRotation(-1);

    var moonTextures = new Map();
    moonTextures.set("Moon", {path: "Solar_System/Moon/2k_moon.jpg"});
    var moon = await extractObjects(gl, [80,80,0], [0,1,0], "Solar_System/Moon/Moon.obj", moonTextures, 5.0);
    moon.animation = customRotation(1/29);
    var moonOrbit = new Group3D([moon], [sunDistance -1700,0,0], [-1,1,0]);
    moonOrbit.animation = customTranslation(29.0);

    objects[3] = new Group3D([earth, moonOrbit], [0,0,0]);
    objects[3] .animation = customTranslation(1.0);


    var marsTextures = new Map();
    marsTextures.set("Mars", {path:"Solar_System/Mars/2k_mars.jpg"});
    var mars = await extractObjects(gl, [sunDistance - 2100,0,0], [-1,1,0], "Solar_System/Mars/Mars.obj", marsTextures, 12.0);
    mars.animation = customRotation(-1/1.02595675);
    objects[4] = new Group3D([mars], [0,0,0]);
    objects[4] .animation = customTranslation(1/1.8809);

    var jupTextures = new Map();
    jupTextures.set("Jupiter", {path: "Solar_System/Jupiter/2k_jupiter.jpg"});
    jupTextures.set("Rings", {path: "Solar_System/Jupiter/Jupiter_rings.png"});
    var jupiter= await extractObjects(gl, [sunDistance - 3800,0,0], [0.0,1,0.0], "Solar_System/Jupiter/Jupiter.obj", jupTextures, 30.0);
    var rings = jupiter.objectList[0];
    var ringOrbit = new Group3D([rings], [sunDistance - 3800,0,0], [0.0,1,0]);
    jupiter.objectList[0] = undefined;
    jupiter.objectList = jupiter.objectList.filter(e => e!=undefined);
    jupiter.animation = customRotation(-1/0.41007);
    objects[5] = new Group3D([jupiter,ringOrbit], [0,0,0]);
    objects[5] .animation = customTranslation(1/4332.59);


    var sturnTextures = new Map();
    sturnTextures.set("Saturn", {path: "Solar_System/Saturn/2k_saturn.jpg"});
    sturnTextures.set("Rings", {path: "Solar_System/Saturn/2k_saturn_ring_alpha.png"});
    var saturn = await extractObjects(gl, [sunDistance - 6500,0,0], [0,1,-0.24], "Solar_System/Saturn/Saturn.obj", sturnTextures, 25.0);
    var rings = saturn.objectList[1];
    var ringOrbit = new Group3D([rings], [sunDistance - 6500,0,0], [0.0,1,0]);
    saturn.objectList[1] = undefined;
    saturn.objectList = saturn.objectList.filter(e => e!=undefined);
    saturn.animation = customRotation(-1/0.426);
    objects[6] = new Group3D([saturn, ringOrbit], [0,0,0]);
    objects[6] .animation = customTranslation(1/29.4767123);


    var uranusTextures = new Map();
    uranusTextures.set("", {path: "Solar_System/Uranus/2k_uranus.jpg"});
    var uranus = await extractObjects(gl, [sunDistance - 8500,0,0], [-1,0,0], "Solar_System/Uranus/Uranus.obj", uranusTextures, 1.0);
    uranus.animation = customRotation(1/0.71833 );
    objects[7] = new Group3D([uranus], [0,0,0]);
    objects[7].animation = customTranslation(1/84 );


    var neptuneTextures = new Map();
    neptuneTextures.set("", {path: "Solar_System/Neptune/2k_neptune.jpg"});  
    var neptune = await extractObjects(gl, [sunDistance -10500,0,0], [-1,0.0,-1.2], "Solar_System/Neptune/Neptune.obj", neptuneTextures, 1.0);
    neptune.animation = customRotation(-1/ 	0.67125);
    objects[8] = new Group3D([neptune], [0,0,0], [0.4,1.0,0.0]);
    objects[8].animation = customTranslation(1/164.8);

    console.log(objects);
    return new Group3D(objects, [0,0,0]);
}


async function extractObjects(gl, position, axis, path, pathTextures, scale, ka){
    var textures = pathTextures || new Map();
    var text = await readFile(path);
    var meshes = readObjects(text);
    meshes = meshes.map(mesh =>{
        mesh.vertices = mesh.vertices.map(position => position*scale);
        return mesh;
    });
    let center = findCenter(meshes);
    var objects = meshes.map( (mesh, i)=>{
        OBJ.initMeshBuffers(gl, mesh);
 
        let texture = textures.has(mesh.name) ? loadTexture(gl, textures.get(mesh.name).path) : randomTexture(gl) ;
        let object = new Object3D(mesh, texture, [0,0,0], [0,0,0]);
        object.visible = textures.has(mesh.name) ? true : false;
        if(ka != undefined){
            object.ka = ka;
        }
        console.log(mesh.name);
        return object;
    });
    var finalPosition = [];
    vec3.add(finalPosition, center, position);
    return new Group3D(objects, position, axis, 0.0);
}

function findCenter(meshes){
    let vertex = [];
    meshes.forEach(mesh =>{
        for(let i=0; i < mesh.vertices.length; i+=3){
            vertex.push([mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2]]);
        }
    });

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for(let i=0; i < vertex.length; i++){
        minX = Math.min(minX, vertex[i][0]);
        minY = Math.min(minY, vertex[i][1]);
        minZ = Math.min(minZ, vertex[i][2]);

        maxX = Math.max(maxX, vertex[i][0]);
        maxY = Math.max(maxY, vertex[i][1]);
        maxZ = Math.max(maxZ, vertex[i][2]);
    }
    let center = [-(maxX  - minX)/2,-(maxY - minY)/2,-(maxZ  - minZ)/2];
    return center;
}