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
        const categoriesCollection = client.db('used-products-resale').collection('categories');
        const productsCollection = client.db('used-products-resale').collection('products');
        const usersCollection = client.db('used-products-resale').collection('users');
        const bookingsCollection = client.db('used-products-resale').collection('bookings');
        const paymentsCollection = client.db('used-products-resale').collection('payments');

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
            
        });
        app.get('/products', async (req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
            
        });
        app.get('/products/:category_id', async(req, res) =>{
            const id = req.params.category_id
            const query = { category_id : id}
            const product = await productsCollection.find(query).toArray()
            res.send(product)
        })

        app.post('/users', async(req, res) =>{
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })
        app.get('/users', async(req, res) =>{
            const role = req.query.role
            const query = { role: role };
            const seller = await usersCollection.find(query).toArray();
            res.send(seller)
        })

        app.delete('/users/:id', async (req, res) =>{
            const id = req.params.id;
            const filter = {_id : Object(id)}
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })

        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({isAdmin: user?.role === 'admin'})
        })

        app.post('/bookings', async(req, res) =>{
            const user = req.body
            const result = await bookingsCollection.insertOne(user)
            res.send(result)
        })
        app.get('/bookings',  async (req, res) => {
            const email = req.query.email;
            // const decodedEmail = req.decoded.email;

            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' });
            // }

            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })
    }
    finally {

    }
}
run().catch(console.log())

app.listen(port, () => console.log(`b612-used-products-resale-server running on ${port}`))