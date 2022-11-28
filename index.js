const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//middleware
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
    res.send('b612-used-products-resale-server is running')

})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ky0svg6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];
    // console.log(token)

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        console.log(decoded)
        next();
    })

}


async function run() {
    try {
        const categoriesCollection = client.db('used-products-resale').collection('categories');
        const productsCollection = client.db('used-products-resale').collection('products');
        const usersCollection = client.db('used-products-resale').collection('users');
        const bookingsCollection = client.db('used-products-resale').collection('bookings');
        const paymentsCollection = client.db('used-products-resale').collection('payments');
        const paymentswishlistCollection = client.db('used-products-resale').collection('wishlistpayment');
        const advertiseCollection = client.db('used-products-resale').collection('advertise');
        const whishlistCollection = client.db('used-products-resale').collection('whishlist');

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }


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
        app.get('/products/:category_name', async (req, res) => {
            const category_name = req.params.category_name
            const query = { category_name: category_name }
            const product = await productsCollection.find(query).toArray()
            res.send(product)
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // advertisse

        app.post('/advertise', async (req, res) => {
            const product = req.body
            const id = product._id;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    advertised: true,
                },
            };

            const updatedResult = await productsCollection.updateOne(
                filter,
                updatedDoc
            );
            res.send({ result: "updated" });
        })


   

        app.get("/advertisedItems", async (req, res) => {
            const query = { advertised: true };
            const advirtiseproducts = await productsCollection.find(query).toArray();
            res.send(advirtiseproducts);
        });


        //wishlist add

        app.post('/wishlist', async (req, res) => {
            const wishlist = req.body
            const result = await whishlistCollection.insertOne(wishlist)
            res.send(result)
        })

        app.get('/wishlist', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const wishlist = await whishlistCollection.find(query).toArray();
            res.send(wishlist);

        })

        app.get('/users', async (req, res) => {
            const role = req.query.role
            const query = { role: role };
            const seller = await usersCollection.find(query).toArray();
            res.send(seller)
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })


        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(filter)

            res.send(result)
        })
   
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const buyerUser = await usersCollection.findOne(query)
            res.send({ isBuyer: buyerUser?.role === 'Buyer' })
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const sellerUser = await usersCollection.findOne(query)
            res.send({ isSeller: sellerUser?.role === 'Seller' })
        })



        app.put("/users/seller/:email", verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            
      
            const filter = { seller_email: email };
            const options = { upsert: true };
            const updatedDoc = {
              $set: {
                seller_state: "verified",
              },
            };
            const result = await productsCollection.updateMany(
              filter,
              updatedDoc,
              options
            );
            res.send(result);
          });
      


        app.post('/bookings', async (req, res) => {
            const user = req.body
            const result = await bookingsCollection.insertOne(user)
            res.send(result)
        })

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.get('/categoryname', async (req, res) => {
            const query = {}
            const result = await categoriesCollection.find(query).project({ category_name: 1 }).toArray()
            res.send(result)
        })


        //payment system
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
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

        app.post('/payments', async (req, res) => {
            const payment = req.body
            const result = await paymentsCollection.insertOne(payment)
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)

            res.send(result);
        })

        // whislistpayment



        app.get('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const booking = await whishlistCollection.findOne(query)

            res.send(booking)
        })


        app.post('/wishlistpayments', async (req, res) => {
            const payment = req.body
            const result = await paymentswishlistCollection.insertOne(payment)
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const updatedResult = await whishlistCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        // delete products
        app.delete('/productsdelete/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(filter)
            res.send(result)
        })

        //jwt
        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })

    }
    finally {

    }
}
run().catch(console.log())

app.listen(port, () => console.log(`b612-used-products-resale-server running on ${port}`))