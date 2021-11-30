const db = require('../../../config/firebase')
const firestore = db.firestore
const admin = db.admin
const geofirex = require('geofirex')
const geo = geofirex.init(admin)
const rxjs = require('rxjs')
const { resolve } = require('url')


exports.getHash = async (req, res) => {

    try{

        const queryObject = req.body
        const data = queryObject.data
        
        const position = await geo.point(data.position.lon, data.position.lat);
        return await res.status(200).send({name: data.name, position})
        
    }catch (error) {
        console.log('===0===> ', error)
        return res.status(500).send({ error: error })
    }
    
}


exports.getPlaces = async (req, res) => {
    try{

        const queryObject = req.body
        const data = queryObject.data
        
        const firestoreRef = await firestore.collection(data.option)
        await firestoreRef.get().then(snapshot => {
            return snapshot.forEach(doc => {
                console.log({ docid: doc.id, pos: doc.data().pos })
                return { docid: doc.id, pos: doc.data().pos }
            })
        })
        const geoRef = await geo.query(firestoreRef).within(geo.point(data.latitude, data.longitude), data.radius, 'pos')

        // const hits = await geofirex.get(geoRef)
        return geoRef.subscribe(async v => {
            if(data.option === 'Apartments' && data.device !== 'web'){
                v = v.filter(item => item.status === 'available');
            }
            
            return await res.send({ len: v.length, v })
        })
        // geoRef.unsubscribe();

    }catch(e) {
        console.log('===1===> ',e)
        geoRef.unsubscribe()
        return res.status(500).send({error: e})

    }
    
}


const loadDBData = (data, option) => {
    return new Promise(async (resolve, reject) => {
        let queryA = await firestore.collection(option)
        let titles = [];

        const geoRefA =  geo.query(queryA).within(geo.point(data.position.latitude, data.position.longitude), data.distance, 'pos')
        geoRefA.subscribe((v) => {
                v = v.filter(i => data.search_text.split(' ').some(j => i.address.address_string.toLowerCase().includes(j.toLowerCase()) ))
                if(v.length > 0){
                    v.map(j => {
                       titles.push({ title: j.title.translations.en_us, image: j.images[0], distance: j.hitMetadata.distance, type: j.parent_category_id? j.parent_category_id[0].id : j.category[0].id, data: j  })
                    } )
                }
                return resolve(titles)
            })
        })
}


exports.getSearchResult =  async (req, res) => {
    try{
        console.log('CALLING GET SEARCH RESULTS...')
        
        const queryObject = req.body
        const data = queryObject.data
        let suggestions =  await firestore.collection('SearchSuggestions').doc('suggestions').get()



        return loadDBData(data, 'Apartments').then( async v => {
            
            loadDBData(data, 'Places').then( async w => {

                if(data.type === 'list'){
                    console.log([...v,...w])
                    v = await v.filter(item => item.data.status === 'available');
                    return await res.send({len: [...v, ...w].len, m: [...[...v,...w].sort((a,b) => a.distance > b.distance ? 1 : -1)], type: 'list' })
                }

                let search = data.search_text
                const title = [];
                const suggestions_list = suggestions?.data().search_string
                const search_result = await suggestions_list.filter(str => search.toLowerCase().split(' ').some(sub_str => str.includes(sub_str.toLowerCase())))

                search_result.map((j) => {
                    title.push({ title: j,  type: 'suggestion' })
                })
                v = await v.filter(item => item.data.status ==='available');

                if(res.headerSent) return console.log("HEADERS SENT ERROR!!!")
                return await res.send({len: [...v, ...w, ...title].len, v: [...[...v,...w].sort((a,b) => a.distance > b.distance ? 1 : -1), ...title] })
            }).catch(err => console.log('LVL2_ERROR:: ', err))
        }).catch(err => console.log('LVL1_ERROR:: ', err))

    }catch (error){
        console.log('===2===> ',error)
        return res.status(500).send({error})
    }
    
}


exports.getFilteredPlaces = async (req, res) => {

    try{

        const queryObject = req.body
        const data = queryObject.data

        console.log("FILTER QUERY:", data)
        
        let query = await firestore.collection(data.option)
        
        
        query.get().then(snapshot => {
            return snapshot.forEach(doc => {
                // console.log({ docid: doc.id, pos: doc.data().pos })
                return { docid: doc.id, pos: doc.data().pos }
            })
        })

        const geoRef = await geo.query(query).within(geo.point(data.position.latitude, data.position.longitude), data.distance, 'pos')

        // // const hits = await geofirex.get(geoRef)
        geoRef.subscribe( async v => {
            

            if(data.option === "Apartments"){

                v = v.filter(item => item.status ==='available');


                if(data.min_rent > 50 || data.max_rent < 1000){
                    v = v.filter(item => item.price > data.min_rent && item.price < data.max_rent);
                }
        
                if(data.bedrooms.length > 0){
                    v = v.filter(item => data.bedrooms.some( (v) => item.living_space.indexOf(v) >= 0 )  )
                }
        
        
                if(data.minsToBus > 0){
                    v = v.filter(item => item.features.minsToBusttop <= data.minsToBus )
                }

                if(data.rent.length > 0){
                    v = v.filter(item => data.rent.includes(item.features.rents))
                }

                if(data.area.length > 0){
                    v = v.filter(item => data.area.includes(item.address.area) || data.area.some((v) => item.title.translations.en_us.indexOf(v) >= 0 ) || data.area.some((v) => item.description.translations.en_us.indexOf(v) >= 0 ) || data.area.some((v) => item.address.address_string.indexOf(v) >= 0 ) )
                }
        
                if(data.bathrooms.length > 0){
                    if( !data.bathrooms.includes("Any")){
                        v = v.filter(item => data.bathrooms.includes(parseInt(item.living_space.split("+")[1])))
                    }
                }

                if( data.facilities.length > 0 ){
                    v = v.filter(item => data.facilities.some( item_2 => item.features[item_2] === true ) )
                }
            }


            if(data.option === "Places"){

                if  ( data?.categories?.length > 0 ){
                    v = v.filter(item => data.categories.includes(item.category[0].id ) || data.categories.includes(item.sub_category_id[0].id) )
                }

                if(data?.area?.length > 0){
                    v = v.filter(item => data.area.includes(item.address.area) || data.area.includes(item.address.area.toLowerCase()) || data.area.some((v) => item.title.translations.en_us.toLowerCase().indexOf(v.toLowerCase()) >= 0 ) || data.area.some((v) => item.description.translations.en_us.toLowerCase().indexOf(v.toLowerCase()) >= 0 ) || data.area.some((v) => item.address.address_string.indexOf(v) >= 0 ) )
                }

                if( data.features?.length > 0 ){
                    v = v.filter(item => data.features.some( item_2 => item.features[item_2] === true ) )
                }

                if( data.goodFor?.length > 0 ){
                    v = v.filter(item => data.goodFor.includes(item.features.good_for) )
                }
            }

            

            if(data.sortBy){
                if(data.sortBy[0] === 'Distance'){
                    v = v.sort((a, b) => (a.hitMetadata.distance > b.hitMetadata.distance) ? 1 : -1)
                }else if(data.sortBy[0] === 'Price'){
                    v = v.sort((a, b) => (a.price < b.price) ? 1 : -1)
                }else if(data.sortBy[0] === 'Newest'){
                    v = v.sort((a, b) => (a.created_at < b.created_at) ? 1 : -1)
                }else if(data.sortBy[0] === 'Minutes To Busstop'){
                    v = v.sort((a, b) => (a.features.minsToBusttop > b.features.minsToBusttop) ? 1 : -1)
                }
            }
            if(res.headerSent) return console.log("HEADERS SENT ERROR!!!")
            return await res.send({ len: v.length, v })

        })


    }catch (error){
        console.log(error)
        res.status(500).send({error})
    }

}