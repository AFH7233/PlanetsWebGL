class Group3D{
    constructor(objectList, position, axis, rotation, animation){
        this.type = "GROUP";
        this.objectList = objectList;
        this.position = position;
        this.axis = axis || [0.0, 1.0, 0.0]
        this.rotation = rotation ?  rotation * (2.0*Math.PI)/180.0 : 0.0;
        this.animation = animation || function(){};
    }

}