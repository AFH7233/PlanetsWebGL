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
    return function(){
        this.rotation[1] =  this.rotation[1]  > (2.0*Math.PI)? 0.0: this.rotation[1] + ((2.0*Math.PI)/180.0)*x;
    }
}


async function readSolarSystem(gl){

   
    var objects = [];
    var sunTextures = new Map();
    sunTextures.set("", "Solar_System/Sun/2k_sun.jpg");
    objects[0] = await extractObjects(gl, [0,0,0], [0,180,0], "Solar_System/Sun/Sun.obj", sunTextures, 5.0);
    objects[0].animation = customRotation(0.01);
    var sunDistance = -800*3.0;

    var mercuryTextures = new Map();
    mercuryTextures.set("", "Solar_System/Mercury/2k_mercury.jpg");
    objects[1] = await extractObjects(gl, [sunDistance - 800,0,0], [0,0,0], "Solar_System/Mercury/Mercury.obj", mercuryTextures, 1/40);
    objects[1].animation = customRotation(1);

    var venusTextures = new Map();
    venusTextures.set("Venus", "Solar_System/Venus/2k_venus_surface.jpg");
   // venusTextures.set("Atmosphere", "Solar_System/Venus/2k_venus_atmosphere.jpg");
    objects[2] = await extractObjects(gl, [sunDistance  -1000,0,0], [0,0,0], "Solar_System/Venus/Venus.obj", venusTextures, 30.0);
    objects[2].animation = customRotation(0.5);

    var earthTextures = new Map();
    earthTextures.set("Earth", "Solar_System/Earth/2k_earth_daymap.jpg");
    /*earthTextures.set("Atmosphere_Cube.001", "Solar_System/Earth/2k_earth_clouds.jpg");
    earthTextures.set("Clouds_Cube.000", "Solar_System/Earth/2k_earth_clouds.jpg");*/
    objects[3] = await extractObjects(gl, [sunDistance -1200,0,0], [0,45,0], "Solar_System/Earth/Earth.obj", earthTextures, 8.0);
    objects[3].animation = customRotation(1/5);

    
    var marsTextures = new Map();
    marsTextures.set("Mars", "Solar_System/Mars/2k_mars.jpg");
    objects[4] = await extractObjects(gl, [sunDistance - 1400,0,0], [0,0,0], "Solar_System/Mars/Mars.obj", marsTextures, 8.0);
    objects[4].animation = customRotation(1/7);


    var jupTextures = new Map();
    jupTextures.set("Jupiter", "Solar_System/Jupiter/2k_jupiter.jpg");
    jupTextures.set("Rings", "Solar_System/Jupiter/Jupiter_rings.png");
    objects[5] = await extractObjects(gl, [sunDistance - 2800,0,0], [0,0,0], "Solar_System/Jupiter/Jupiter.obj", jupTextures, 30.0);
    objects[5].animation = customRotation(1/7);


    var sturnTextures = new Map();
    sturnTextures.set("Saturn", "Solar_System/Saturn/2k_saturn.jpg");
    sturnTextures.set("Rings", "Solar_System/Saturn/2k_saturn_ring_alpha.png");
    objects[6] = await extractObjects(gl, [sunDistance - 5500,0,0], [0,0,0], "Solar_System/Saturn/Saturn.obj", sturnTextures, 25.0);
    objects[6].animation = customRotation(1/7);


    var uranusTextures = new Map();
    uranusTextures.set("", "Solar_System/Uranus/2k_uranus.jpg");
    objects[7] = await extractObjects(gl, [sunDistance - 8500,0,0], [0,0,0], "Solar_System/Uranus/Uranus.obj", uranusTextures, 1.0);
    objects[7].animation = customRotation(1/7);


    var neptuneTextures = new Map();
    neptuneTextures.set("", "Solar_System/Neptune/2k_neptune.jpg");  
    objects[8] = await extractObjects(gl, [sunDistance -10500,0,0], [0,0,0], "Solar_System/Neptune/Neptune.obj", neptuneTextures, 1.0);
    objects[8].animation = customRotation(1/7);

    console.log(objects);
    return new Group3D(objects, [0,0,0], [0,0,0]);
}


async function extractObjects(gl, position, rotation, path, pathTextures, scale){
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
 
        let texture = textures.has(mesh.name) ? loadTexture(gl, textures.get(mesh.name)) : randomTexture(gl) ;
        let object = new Object3D(mesh, texture, [0,0,0], [0,0,0]);
        object.visible = textures.has(mesh.name) ? true : false;
        
        console.log(mesh.name);
        return object;
    });
    var finalPosition = [];
    vec3.add(finalPosition, center, position);
    return new Group3D(objects, position, rotation);
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