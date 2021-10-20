const db = require('../../../config/firebase')
const firestore = db.firestore
const admin = db.admin
const geofirex = require('geofirex')
const geo = geofirex.init(admin)
const rxjs = require('rxjs')


exports.getHash = (req, res) => {

    const queryObject = req.body
    const data = queryObject.data
    
    const position = geo.point(data.position.lon, data.position.lat);
    res.status(200).send({name: data.name, position})
}


exports.getPlaces = async (req, res) => {

    const queryObject = req.body
    const data = queryObject.data
    
    const firestoreRef = await firestore.collection(data.option)
    firestoreRef.get().then(snapshot => {
        return snapshot.forEach(doc => {
            console.log({ docid: doc.id, pos: doc.data().pos })
            return { docid: doc.id, pos: doc.data().pos }
        })
    })
    const geoRef = await geo.query(firestoreRef).within(geo.point(data.latitude, data.longitude), data.radius, 'pos')

    // const hits = await geofirex.get(geoRef)
    geoRef.subscribe(v => {
        res.send({ len: v.length, v })
    })

    // geoRef.unsubscribe();

    // res.status(200).send(hits.catch(err => err))
}


exports.getFilteredPlaces = async (req, res) => {


    const queryObject = req.body
    const data = queryObject.data

    console.log("FILTER QUERY:", data)
    
    let query = await firestore.collection(data.option)
    
    // if( data.min_rent > 50 || data.max_rent < 1000 ){
    //     query = query.where("price", ">", data.min_rent).where("price", "<", data.max_rent)
    // }
    // FILTER QUERY: {
    //     min_rent: 50,
    //     max_rent: 1000,
    //     bedrooms: [],
    //     bathrooms: [],
    //     furnished: 'Any',
    //     facilities: [],
    //     minsToBus: 0,
    //     sortBy: 'Distance',
    //     categories: [],
    //     features: [],
    //     goodFor: [],
    //     area: [],
    //     distance: 754,
    //     position: { longitude: 35.18722, latitude: 33.355301 }
    //   }
    // query = query.limit(20)
    query.get().then(snapshot => {
        return snapshot.forEach(doc => {
            // console.log({ docid: doc.id, pos: doc.data().pos })
            return { docid: doc.id, pos: doc.data().pos }
        })
    })

    const geoRef = await geo.query(query).within(geo.point(data.position.latitude, data.position.longitude), data.distance, 'pos')

    // // const hits = await geofirex.get(geoRef)
    geoRef.subscribe(v => {

        if(data.option === "Apartments"){
            if(data.min_rent > 50 || data.max_rent < 1000){
                v = v.filter(item => item.price > data.min_rent && item.price < data.max_rent);
            }
    
            if(data.bedrooms.length > 0){
                v = v.filter(item => data.bedrooms.includes( parseInt(item.living_space.split("+")[0])) || ( data.bedrooms.includes( "Studio" ) && item.living_space === "Studio" ) )
            }
    
    
            if(data.minsToBus > 0){
                v = v.filter(item => item.features.minsToBusttop <= data.minsToBus )
            }
    
            if(data.bathrooms.length > 0){
                if( !data.bathrooms.includes("Any")){
                    v = v.filter(item => data.bathrooms.includes(parseInt(item.living_space.split("+")[1])))
                }
            }

            if(data.facilities.length > 0){
                v = v.filter(item => item.features )
            }
        }


        if(data.option === "Places"){

            if( data.categories.length > 0 ){
                v = v.filter(item => data.categories.includes(item.category[0].id ))
            }

            if( data.features.length > 0 ){
                v = v.filter(item => data.features.some( item_2 => item.features[item_2] === true ) )
            }

            if( data.goodFor.length > 0 ){
                v = v.filter(item => data.goodFor.includes(item.features.good_for) )
            }
        }

        


        if(data.sortBy === 'Distance'){
            v = v.sort((a, b) => (a.hitMetadata.distance > b.hitMetadata.distance) ? 1 : -1)
        }else if(data.sortBy === 'Price'){
            v = v.sort((a, b) => (a.price > b.price) ? 1 : -1)
        }else if(data.sortBy === 'Newest'){
            v = v.sort((a, b) => (a.createdAt < b.createdAt) ? 1 : -1)
        }else if(data.sortBy === 'Minutes To Busstop'){
            v = v.sort((a, b) => (a.features.minsToBusttop > b.features.minsToBusttop) ? 1 : -1)
        }

        res.send({ len: v.length, v })
    })

    // geoRef.unsubscribe();

    // res.status(200).send(hits.catch(err => err))
}