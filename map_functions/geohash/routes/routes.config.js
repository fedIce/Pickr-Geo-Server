const GeoHashController = require('../controllers/controllers.config.js');


exports.geoHashRoutesConfig = (app) => {
    app.post('/get_hash', [
        GeoHashController.getHash
    ])
}

exports.getNearbyPlaces = (app) => {
    app.post('/nearby_places', [
        GeoHashController.getPlaces
    ])
}

exports.getFilteredPlaces = (app) => {
    app.post('/nearby_filtered_places', [
        GeoHashController.getFilteredPlaces
    ])
}

exports.getSearchResults = (app) => {
    app.post('/search', [
        GeoHashController.getSearchResult
    ])
}