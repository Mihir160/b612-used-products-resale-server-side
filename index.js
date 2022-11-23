const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
require('dotenv').config();
//middleware
app.use(cors())
app.use(express.json())

app.get('/', async(req, res) =>{
    res.send('b612-used-products-resale-server is running')

})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ky0svg6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
     
    }
    finally {

    }
}
run().catch(console.log())

app.listen(port, () => console.log(`b612-used-products-resale-server running on ${port}`))