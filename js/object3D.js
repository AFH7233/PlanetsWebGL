class Object3D{
    constructor(mesh,texture,position,rotation){
        this.type = "MESH";
        this.mesh = mesh;
        this.texture = texture;
        this.position = position;
        this.rotation = rotation.map(element => element * (2.0*Math.PI)/180.0);
        this.visible = true;
    }

}