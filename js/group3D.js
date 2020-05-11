class Group3D{
    constructor(objectList, position, rotation, animation){
        this.type = "GROUP";
        this.objectList = objectList;
        this.position = position;
        this.rotation = rotation.map(element => element * (2.0*Math.PI)/180.0);
        this.animation = animation || function(){};
    }

}