const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const app = express();
require('./db/mongoose');
const Event = require('./models/event');
const User = require('./models/user');

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
        type User{
            _id: ID!
            email: String!
            password: String
        }
        input EventInput{
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        input UserInput{
            email: String!
            password: String!
        }
        type RootQuery{
            events: [Event!]!
        }
        type RootMutation{
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }
        schema {
                query: RootQuery
                mutation: RootMutation
            }
        `),
        rootValue: {
            events: () => {
                return Event.find()
                    .then(events => {
                        return events.map(event => {
                            return { ...event._doc, _id: event._doc._id.toString() };
                        })
                    }).catch(err => {
                        throw err;
                    })
            },
            createEvent: (args) => {
                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(args.eventInput.date),
                    creator: "60733bd14718da3bbc88b4f6"
                });
                let createdEvent;
                return event.save()
                    .then(result => {
                        createdEvent = { ...result._doc, _id: event._doc._id.toString() };
                        return User.findOne({_id:'60733bd14718da3bbc88b4f6'});
                    })
                    .then(user=>{
                        if (!user){
                            throw new Error('User exists already');
                        }
                        user.createdEvents.push(event);
                        return user.save();
                    })
                    .then(result=>{
                        return createdEvent;
                    })
                    .catch(err => {
                        console.log(err);
                        throw err;
                    });

            },
            createUser: async (args) => {
                try {
                    const userExist = await User.findOne({email:args.userInput.email});
                    if (userExist){
                        throw new Error('User exists already');
                    }
                    const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
                    const user = new User({
                        email: args.userInput.email,
                        password: hashedPassword
                    });
                    const result = await user.save();
                    return { ...result._doc, password: null, _id: result._doc._id.toString() }
                } catch (error) {
                    throw error
                }


            },
            graphiql: true
        }
    })
);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})