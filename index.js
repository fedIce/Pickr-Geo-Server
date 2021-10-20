const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var port = process.env.PORT || 5030
const GeoHashRoutes = require('./map_functions/geohash/routes/routes.config')

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    } else {
        return next()
    }
})

app.use(bodyParser.json());
GeoHashRoutes.geoHashRoutesConfig(app);
GeoHashRoutes.getNearbyPlaces(app);
GeoHashRoutes.getFilteredPlaces(app);


app.listen(port, function (){
    console.log('App is now listening on port %s', port)
} )