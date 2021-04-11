const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
require('dotenv').config();
const app = express();
require('./db/mongoose');
const Event = require('./models/event');

app.use(express.json());

const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('<h1>Hello World</h1>')
});

const events = [];
// query : we want to fetch some data
// mutation: we want to update some data
app.use('/graphql',
    graphqlHTTP({
        schema: buildSchema(`
        type Event{
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        input EventInput{
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        type RootQuery{
            events: [Event!]!
        }
        type RootMutation{
            createEvent(eventInput: EventInput): Event
        }
        schema {
                query: RootQuery
                mutation: RootMutation
            }
        `),
        rootValue: {
            events: () => {
                return Event.find()
                .then(events=>{
                    return events.map(event =>{
                        return {...event._doc, _id: event._doc._id.toString()};
                    })
                }).catch(err=>{
                    throw err;
                })
            },
            createEvent: (args) => {
                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(args.eventInput.date)
                });
                return event.save()
                    .then(result => {
                        console.log(result);
                        return {...result._doc, _id: event._doc._id.toString()};
                    })
                    .catch(err=>{
                        console.log(err);
                        throw err;
                    });
                
            }
        },
        graphiql: true
    })
);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})