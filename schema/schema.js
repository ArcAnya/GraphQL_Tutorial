const graphql = require('graphql');
const axios = require('axios');
const {
    GraphQLObjectType,
    GraphQLInt,
    GraphQLString,
    GraphQLSchema,      // Takes in a RootQuery and returns a GraphQL Schema instance
    GraphQLList,
    GraphQLNonNull
} = graphql;

// important to place CompanyType above UserType
const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () => ({ // creating arrow function to solve JS circular reference between UserType / CompanyType (fct only gets executed when types already defined)
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: { // here a bit different than below, bc many users for one company
            type: new GraphQLList(UserType), // list of users per company 
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                    .then(resp => resp.data);
            }
        }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: { // only one company per user
            type: CompanyType,
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
                    .then(res => res.data)
            }
        }
    })
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
        },
        company: {
            type: CompanyType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${args.id}`)
                    .then(resp => resp.data);
            }
        }
    }
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType,
            args: {
                firstName: { type: new GraphQLNonNull(GraphQLString) }, // helper to make sure that provide firstName and age when adding User
                age: { type: new GraphQLNonNull(GraphQLInt) },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue, { firstName, age }) {
                return axios.post(`http://localhost:3000/users`, { firstName, age })
                    .then(res => res.data);
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve(parentValue, { id }) {
                return axios.delete(`http://localhost:3000/users/${id}`)
                    .then(res => res.data);
            }
        },
        editUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) }, // need to give id if want to edit user
                firstName: { type: GraphQLString }, // not mandatory, can optionally provide/edit firstName
                age: { type: GraphQLInt },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue, args) {
                return axios.patch(`http://localhost:3000/users/${args.id}`, args) // no risk for accidentally updating id here
                    .then(res => res.data);
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation
});
