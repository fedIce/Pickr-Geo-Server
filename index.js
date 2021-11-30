const express = require('express');
const cluster =  require('cluster');
const os = require('os');
const bodyParser = require('body-parser');

const numOfCpus = os.cpus().length
const app = express();
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
GeoHashRoutes.getSearchResults(app);

if(cluster.isMaster){
    for( let i = 0; i < numOfCpus; i++){
        cluster.fork()
    }
    cluster.on('exit',( worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`)
        cluster.fork()
    })
}else{
    app.listen(port, function (){
        console.log(`${process.pid}: listening on port ${port}`)
    } ) 
}

