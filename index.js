const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const advertiseCollection = client.db('used-products-resale').collection('advertise');

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
        app.get('/product', async (req, res) => {
            const email = req.query.email;
            const query = { seller_email: email };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
            
        });

        app.post('/products', async (req, res) => {
            const product = req.body
            const products = await productsCollection.insertOne(product);
            res.send(products);
            
        });
        app.get('/products/:category_name', async(req, res) =>{
            const category_name = req.params.category_name
            const query = { category_name: category_name}
            const product = await productsCollection.find(query).toArray()
            res.send(product)
        })

        app.post('/users', async(req, res) =>{
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })
        
        app.post('/advertise', async(req, res) =>{
            const product = req.body
            console.log(product)
            const result = await advertiseCollection.insertOne(product)
            console.log(result)
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
            const filter = {_id : ObjectId(id)}
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })
        app.delete('/products/:id', async (req, res) =>{
            const id = req.params.id;
            const filter = {_id : ObjectId(id)}
            const result = await productsCollection.deleteOne(filter)
         
            res.send(result)
        })

    





        app.get('/users/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({isAdmin: user?.role === 'admin'})
        })
        app.get('/users/buyer/:email', async(req, res) =>{
            const email = req.params.email;
            const query = { email }
            const buyerUser = await usersCollection.findOne(query)
            res.send({isBuyer:  buyerUser?.role === 'Buyer'})
        })
        app.get('/users/seller/:email', async(req, res) =>{
            const email = req.params.email;
            const query = { email }
            const sellerUser = await usersCollection.findOne(query)
            res.send({isSeller:  sellerUser?.role === 'Seller'})
        })
        
        // app.get('/users/verify/:email', async(req, res) =>{
        //     const email = req.params.email;
        //     const query = { email }
        //     const sellerVerify = await usersCollection.findOne(query)
       
        //     // res.send({isVerify:  sellerVerify?.seller_verified === 'verified'})
        //     res.send(sellerVerify)
        // })


        app.put('/users/seller/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const options = { upsert: true }
            const updatedDoc = {
                $set : {
                    seller_verified: 'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc,options)
            res.send(result)
        }) 

        app.post('/bookings', async(req, res) =>{
            const user = req.body
            const result = await bookingsCollection.insertOne(user)
            res.send(result)
        })
        app.get('/bookings',  async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.get('/categoryname', async(req, res) =>{
            const query = {}
            const result = await categoriesCollection.find(query).project({category_name: 1}).toArray()
            res.send(result)
        })
        //payment system
        app.get('/bookings/:id', async(req, res) => {
            const id = req.params.id;
            const  query = {_id: ObjectId(id)}
            const booking = await bookingsCollection.findOne(query)
          
            res.send(booking)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.resalePrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

    }
    finally {

    }
}
run().catch(console.log())

app.listen(port, () => console.log(`b612-used-products-resale-server running on ${port}`))