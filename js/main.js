window.onload = main;


async function main(){
    var gl = initGLContext();
    
    var shaderText	= await readFile("shaders/vertex_shader.glsl");
    var vertexShader = createShader(gl, shaderText, gl.VERTEX_SHADER);

    shaderText = await readFile("shaders/fragment_shader.glsl");
    var fragmentShader = createShader(gl, shaderText, gl.FRAGMENT_SHADER);

    var program = joinProgram(gl,vertexShader,fragmentShader);
    const programInfo = {
        program: program,
        attributes: {
            vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),
            textureCoord: gl.getAttribLocation(program, 'aTextureCoord')
        },
        uniforms: {
            projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
            cameraMatrix: gl.getUniformLocation(program, 'uCameraMatrix'),
            lightPos: gl.getUniformLocation(program, 'lightPos'),
            uSampler: gl.getUniformLocation(program, 'uSampler'),
            ka: gl.getUniformLocation(program, 'ka'),
            kd: gl.getUniformLocation(program, 'kd'),
        },
      };

    var group = await readSolarSystem(gl);

    function render() {
    
        drawScene(gl, programInfo, group)
    
        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
}



function initGLContext() {
    const canvas = document.querySelector("#glCanvas");
    var gl = canvas.getContext("webgl2");
  
    if (gl === null) {
      alert("El navegador no soporta webgl");
      return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    return gl;
}

function drawScene(gl, programInfo, group) {
    gl.clearColor(0.0, 0.0, 0.0, 0.5);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);     
    gl.depthFunc(gl.LEQUAL); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var fov =  50 + Number(document.getElementById("fov").value);
    const fieldOfView = fov * Math.PI / 180;   
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100000.0;
    const projectionMatrix = mat4.create();
    const cameraMatrix = mat4.create();

    var cameraX = 4000;
    var cameraZ = 12000;

    mat4.perspective(projectionMatrix,
                    fieldOfView,
                    aspect,
                    zNear,
                    zFar);
    var superior = document.getElementById("superior").checked;
    var groupIndex =  Number(document.getElementById("planetaIndex").value);

    animateAll(group)
    var axis = [0,1,0];
    if(superior){
        axis = [0,0,1];
    } 
    if(groupIndex == 0){
        if(superior){
            mat4.lookAt(cameraMatrix, [-cameraX,cameraZ,0.0],[-cameraX,0.0,0.0],[0.0,0.0,1.0]);
        } else{
            mat4.lookAt(cameraMatrix, [-cameraX,0.0,-cameraZ],[-cameraX,0.0,0.0],[0.0,1.0,0.0]);        
        }
    } else {
        var posiionEnOrbita = [0.0, 1.0, 1.0, 1.0, 1.0, 9.0, 5.0, 3.0, 3.0];
        var posiionEnY = [100.0, 100.0, 100.0, 100.0, 100.0, 1200.0, 1200.0, 800.0, 800.0];
        var eye = [group.objectList[groupIndex].objectList[0].position.map(e => e), 1.0].flat();
        var center = [group.objectList[groupIndex].objectList[0].position.map(e => e), 1.0].flat();
    
        var rotacion0 = group.objectList[groupIndex].rotation - (posiionEnOrbita[groupIndex]*2.0*Math.PI/180);
        var rotacion1 = group.objectList[groupIndex].rotation;

        if(superior){
            rotacion0 = rotacion1;
            eye[1] += posiionEnY[groupIndex];
        }
    
        var eyeMatrix = mat4.create();
        mat4.rotate(eyeMatrix, eyeMatrix, rotacion0, [0,1,0]);
        vec4.transformMat4(eye, eye, eyeMatrix);
    
        var centerMatrix = mat4.create();
        mat4.rotate(centerMatrix, centerMatrix, rotacion1, [0,1,0]);
        vec4.transformMat4(center, center, centerMatrix);
        mat4.lookAt(cameraMatrix, eye,center,axis);
    }


    var frontal = document.getElementById("frontal").checked;

    
    const modelViewMatrix = mat4.create();
    renderGroup(gl, programInfo, group, projectionMatrix, modelViewMatrix, cameraMatrix);

}

function animateAll(group){
    var velocidad = Number(document.getElementById("velocidad").value)/1000;
    group.animation(velocidad);
    for(let i=0; i<group.objectList.length; i++){
        let object = group.objectList[i];
        if(object.type == "GROUP"){
            animateAll(object);
        }
    }
}

function renderGroup(gl, programInfo, group, projectionMatrix, matrix, cameraMatrix){
    var localMatrix = mat4.create();

    mat4.translate(localMatrix, localMatrix, group.position);
    mat4.rotate(localMatrix, localMatrix, group.rotation, group.axis);

    var modelViewMatrix = [];
    mat4.multiply(modelViewMatrix,matrix, localMatrix);

    for(let i=0; i<group.objectList.length; i++){
        let object = group.objectList[i];
        if(object.type == "MESH"){
            renderObject(gl, programInfo, object, projectionMatrix, modelViewMatrix, cameraMatrix);
        } else {
            renderGroup(gl, programInfo, object, projectionMatrix, modelViewMatrix, cameraMatrix)
        }
    }
}


function renderObject(gl, programInfo, object3D, projectionMatrix, matrix, cameraMatrix){
    if(!object3D.visible){
        return;
    }
    var localMatrix = mat4.create();

    var modelViewMatrix = [];
    mat4.multiply(modelViewMatrix, matrix, localMatrix);
    let mesh = object3D.mesh;
    let texture = object3D.texture;
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
        gl.vertexAttribPointer(
            programInfo.attributes.vertexPosition,
            mesh.vertexBuffer.itemSize,
            gl.FLOAT,
            false,
            0,
            0);
        gl.enableVertexAttribArray(
            programInfo.attributes.vertexPosition);
    }

    {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
        gl.vertexAttribPointer(
            programInfo.attributes.vertexNormal,
            mesh.normalBuffer.itemSize,
            gl.FLOAT,
            false,
            0,
            0);
        gl.enableVertexAttribArray(
            programInfo.attributes.vertexNormal);
      }

    {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
        gl.vertexAttribPointer(
            programInfo.attributes.textureCoord,
            mesh.textureBuffer.itemSize,
            gl.FLOAT,
            false,
            0,
            0);
        gl.enableVertexAttribArray(
            programInfo.attributes.textureCoord);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);


    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
        programInfo.uniforms.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniforms.modelViewMatrix,
        false,
        modelViewMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniforms.cameraMatrix,
        false,
        cameraMatrix);
    gl.uniform1f(
        programInfo.uniforms.kd,
        object3D.kd);
    gl.uniform1f(
        programInfo.uniforms.ka,
        object3D.ka);

    var lightPos  = [0.0,0.0,0.0,1.0];//posicion del sol;
    //vec4.transformMat4(lightPos, lightPos, modelViewMatrix);
    vec4.transformMat4(lightPos, lightPos, cameraMatrix);


    gl.uniform4fv(
        programInfo.uniforms.lightPos,
        lightPos);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniforms.uSampler, 0);

    gl.drawElements(gl.TRIANGLES,  mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
}
  
