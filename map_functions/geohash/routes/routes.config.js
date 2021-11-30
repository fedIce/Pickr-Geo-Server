const GeoHashController = require('../controllers/controllers.config.js');


exports.geoHashRoutesConfig = (app) => {
    try{
        app.post('/get_hash', [
            GeoHashController.getHash
        ])
    }catch(e){
        console.log('1. ERROR: ', e)
    }
    
}

exports.getNearbyPlaces = (app) => {
    try{ 
        app.post('/nearby_places', [
            GeoHashController.getPlaces
        ])
    }catch(e){
        console.log('2. ERROR: ', e)
    }
}

exports.getFilteredPlaces = (app) => {
    try{
        app.post('/nearby_filtered_places', [
            GeoHashController.getFilteredPlaces
        ])
    }catch(e){
        console.log('3. ERROR: ', e)
    }
}

exports.getSearchResults = (app) => {
    try{
        app.post('/search', [
            GeoHashController.getSearchResult
        ])
    }catch(e){
        console.log('4. ERROR: ', e)
    }
}