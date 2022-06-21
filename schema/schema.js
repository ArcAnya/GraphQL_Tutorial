const graphql = require('graphql');
const axios = require('axios');
const {
    GraphQLObjectType,
    GraphQLInt,
    GraphQLString,
    GraphQLSchema      // Takes in a RootQuery and returns a GraphQL Schema instance
} = graphql;

// important to place CompanyType above UserType
const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: {
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString }
    }
})

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: {
            type: CompanyType,
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
                    .then(res => res.data)
            }
        }
    }
});

// defining how you can query stuff
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } }, // you can search for user by id
            resolve(parentValue, args) { // go into (any type of) DB and actually find data 
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(resp => resp.data); // to make axios work well with graphql, i.e. return data level directly
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery
});
