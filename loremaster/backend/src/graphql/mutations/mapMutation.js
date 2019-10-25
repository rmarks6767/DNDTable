const { MapInput } = require('../model/inputs/mapInput');
const { StatusCode } = require('../model/outputs/statusCode')
const { GraphQLNonNull } = require('graphql'); 
const { Insert } = require('../../repositories/dynamicRepo');
const { GenerateUuid } = require('../../extraFunctions/generateUUID');  

const createMap = {
    type: StatusCode,
    description: 'a map',
    args: {
        map:{
            name:'map',
            type: new GraphQLNonNull(MapInput),
        }
    },
    resolve: async (source, args, root, ast) => {
        if (args.map) {
            _ = Object.keys(args.map).pop()
            const tilesValues = Object.values(args.map).pop()
            const mapId = GenerateUuid()

            const resp = await Insert(
                "maps", 
                ["id", "name","imageLink"],
                [mapId, args.map["name"], args.map["imageLink"]]);
            
            await tilesValues.forEach(async element => {
                element["id"] = GenerateUuid()
                element["mapId"] = mapId
                const tileResp = await Insert(
                    "tiles",
                    Object.keys(element),
                    Object.values(element));
                if (tileResp["code"] != "200"){
                    resp = tileResp;
                }
            });
            
            return resp;
        } else {
            throw new Error("Must provide a map input!");
        }
    }
}

module.exports = {
    createMap
}