const { map } = require("../model/outputs/map");
const { GraphQLNonNull, GraphQLString } = require('graphql'); 
const MapRepo = require('../../repositories/map_repo')

const mapQuery = {
    type: map,
    description: "a map",
    args: {
        id: {
            name: "id",
            type: new GraphQLNonNull(GraphQLString)
        }
    },
    resolve: MapRepo.GetMapById.bind(MapRepo)
}

module.exports = {
    mapQuery
}