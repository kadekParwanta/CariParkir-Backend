module.exports = function (Parking) {
    var loopback = require('loopback');
    var GeoPoint = loopback.GeoPoint;
    var pubsub = require('../../server/pubsub.js');


    /**
     * Find nearby locations around the geo point
     * @param {geopoint} here geo location (lat & lng)
     * @param {number} page number of pages (page size=10)
     * @param {number} max max distance in miles
     * @param {Function(Error, string)} callback
     */

    Parking.nearby = function (here, page, max, callback) {
        var locations;
        // TODO
        if (typeof page === 'function') {
            fn = page;
            page = 0;
            max = 0;
        }

        if (typeof max === 'function') {
            fn = max;
            max = 0;
        }

        var limit = 10;
        page = page || 0;
        max = Number(max || 100000);

        Parking.find({
            // find locations near the provided GeoPoint
            where: {
                geo: {
                    near: here,
                    maxDistance: max
                }
            },
            // paging
            skip: limit * page,
            limit: limit
        }, callback);
    };

    /**
 * Expose nearby as a remote method.
 */

loopback.remoteMethod(
    Parking.nearby, {
        description: 'Find nearby locations around the geo point',
        accepts: [{
            arg: 'here',
            type: 'GeoPoint',
            required: true,
            description: 'geo location (lat & lng)'
        }, {
            arg: 'page',
            type: 'Number',
            description: 'number of pages (page size=10)'
        }, {
            arg: 'max',
            type: 'Number',
            description: 'max distance in miles'
        }],
        returns: {
            arg: 'locations',
            root: true
        }
    });
    
    //Publish
    //Parking after save..
    Parking.observe('after save', function (ctx, next) {
        var socket = Parking.app.io;
        if(ctx.isNewInstance){
            //Now publishing the data..
            pubsub.publish(socket, {
                collectionName : 'Parking',
                data: ctx.instance,
                method: 'POST'
            });
        }else{
            //Now publishing the data..
            pubsub.publish(socket, {
                collectionName : 'Parking',
                data: ctx.instance,
                modelId: ctx.instance.id,
                method: 'PUT'
            });
        }
        //Calling the next middleware..
        next();
    }); //after save..
    //Parking before delete..
    Parking.observe("before delete", function(ctx, next){
            var socket = Parking.app.io;
            //Now publishing the data..
            pubsub.publish(socket, {
                collectionName : 'Parking',
                data: ctx.instance.id,
                modelId: ctx.instance.id,
                method: 'DELETE'
            });
            //move to next middleware..
            next();
    }); //before delete..

};
