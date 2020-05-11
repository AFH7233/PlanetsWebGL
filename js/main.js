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
            textureCoord: gl.getAttribLocation(program, 'aTextureCoord')
        },
        uniforms: {
            projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
            cameraMatrix: gl.getUniformLocation(program, 'uCameraMatrix'),
            uSampler: gl.getUniformLocation(program, 'uSampler'),
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
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);     
    gl.depthFunc(gl.LEQUAL); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 60 * Math.PI / 180;   
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100000.0;
    const projectionMatrix = mat4.create();
    const cameraMatrix = mat4.create();

    var cameraX = Number(document.getElementById("cameraX").value)  + Number(document.getElementById("cameraX_fine").value);
    var cameraZ = Number(document.getElementById("cameraZ").value)  + Number(document.getElementById("cameraZ_fine").value);


    mat4.perspective(projectionMatrix,
                    fieldOfView,
                    aspect,
                    zNear,
                    zFar)
    mat4.lookAt(cameraMatrix, [-cameraX,0.0,-cameraZ],[-cameraX,0.0,0.0],[0.0,1.0,0.0]);



    const modelViewMatrix = mat4.create();
    renderGroup(gl, programInfo, group, projectionMatrix, modelViewMatrix, cameraMatrix);

}

function renderGroup(gl, programInfo, group, projectionMatrix, matrix, cameraMatrix){
    group.animation();
    var localMatrix = mat4.create();
    //mat4.scale(localMatrix, localMatrix, 1.0);
    mat4.translate(localMatrix, localMatrix, group.position);
    mat4.rotateX(localMatrix, localMatrix, group.rotation[0]);
    mat4.rotateY(localMatrix, localMatrix, group.rotation[1]);
    mat4.rotateZ(localMatrix, localMatrix, group.rotation[2]);

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
    mat4.rotateX(localMatrix, localMatrix, object3D.rotation[0]);
    mat4.rotateY(localMatrix, localMatrix, object3D.rotation[1]);
    mat4.rotateZ(localMatrix, localMatrix, object3D.rotation[2]);

    mat4.translate(localMatrix, localMatrix, object3D.position);

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

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniforms.uSampler, 0);

    gl.drawElements(gl.TRIANGLES,  mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    
}
  
