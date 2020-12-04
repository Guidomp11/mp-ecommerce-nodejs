var express = require('express');
var exphbs  = require('express-handlebars');
const cookieParser = require('cookie-parser');
const mercadopago = require('mercadopago');
var port = process.env.PORT || 3000

var app = express();
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    res.render('detail', req.query);
});

mercadopago.configure({
    access_token: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
    integrator_id: 'dev_24c65fb163bf11ea96500242ac130004'
});

app.post('/comprar', (req, res) => {
    const host = 'https://certif-mercado-pago.herokuapp.com/';
    const url = host+'callback?status=';
    
    let imageDirectory = req.body.productImage.split('/');
    imageDirectory = imageDirectory[imageDirectory.length-1];

    let item = {
        id: 1234,
        picture_url: host+imageDirectory,
        title: req.body.productTitle,
        description: 'Dispositivo móvil de Tienda e-commerce',
        unit_price: Number(req.body.productPrice),
        quantity: 1
    }

    let preference = {
        back_urls:{
            success: url+'success',
            pending: url+'pending',
            failure: url+'failure'
        },

        notification_url: host+'webhook',

        auto_return: 'approved',

        payer: { 
            name: 'Lalo',
            surname: 'Landa',
            email: 'test_user_63274575@testuser.com',
            phone: {
                area_code: '11',
                number: 22223333
            },
            address: {
                zip_code: '1111',
                street_name: 'False',
                street_number: 123
            }
        },

        payment_methods: {
            excluded_payment_methods: [
                {id: 'amex'}
            ],
            excluded_payment_types: [ 
                {id: 'atm'}
            ],
            installments: 6
        },
        
        items: [
            item
        ],

        external_reference: 'ponce.guido@gmail.com'
    }

    mercadopago.preferences.create(preference)
    .then(response => {
        res.render('confirmarcompra', {init_point:response.body.init_point});
    })
    .catch(error => {
        console.log(error);
        res.send('error');
    })
});


app.get('/callback', (req, res) => {
    console.log(req.query)
    switch(req.query.status[0]){
        case 'success':
            return res.render('success', {
                payment_type: req.query.payment_type,
                external_reference: req.query.external_reference,
                collection_id: req.query.collection_id
            });
        case 'pending':
            return res.render('pending');
        case 'failure':
            return res.render('failure');
        default:
            return res.status(404).end()
    }
});

app.get('/webhook', (req, res) => {
    console.log('webhook', req.body);
    res.status(200).send(req.body);
});

app.listen(port);