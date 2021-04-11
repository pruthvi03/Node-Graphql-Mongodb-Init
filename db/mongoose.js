const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL,
    {
        useCreateIndex:true,
        useFindAndModify:true,
        useUnifiedTopology:true,
        useNewUrlParser:true
    },
    ()=>{
    console.log('DB connected');
});