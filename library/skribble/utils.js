const _ = require('lodash');

/**
 * Helper function to determine whether there is an intersection between the two polygons described
 * by the lists of vertices. Uses the Separating Axis Theorem
 *
 * @see http://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles
 * @param {array} polygonOne an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @param {array} polygonTwo an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @return {boolean} true if there is any intersection between the 2 polygons, false otherwise
 */
const doIntersect = function (polygonOne, polygonTwo) {
    let polygons = [polygonOne, polygonTwo];
    let minA;
    let maxA;
    let projected;
    let i;
    let i1;
    let j;
    let minB;
    let maxB;

    for (i = 0; i < polygons.length; i++) {
        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        let polygon = polygons[i];
        for (i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            let i2 = (i1 + 1) % polygon.length;
            let p1 = polygon[i1];
            let p2 = polygon[i2];

            // find the line perpendicular to this edge
            let normal = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (j = 0; j < polygonOne.length; j++) {
                projected = normal.x * polygonOne[j].x + normal.y * polygonOne[j].y;
                if ((typeof minA === 'undefined') || projected < minA) {
                    minA = projected;
                }
                if ((typeof maxA === 'undefined') || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (j = 0; j < polygonTwo.length; j++) {
                projected = normal.x * polygonTwo[j].x + normal.y * polygonTwo[j].y;
                if ((typeof minB === 'undefined') || projected < minB) {
                    minB = projected;
                }
                if ((typeof maxB === 'undefined') || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Checks if two assets are intersecting
 *
 * Assets will intersect if both assets are the same type, they cannot over lap
 * and their corners follow the Separating Axis Theorem
 *
 * @param {object} assetOne Asset to check
 * @param {object} assetTwo Asset to compare against
 * @param {function} intersectCb Callback if the objects are intersecting
 * @param {function} notIntersectCb Callback if assets are not intersecting
 * @returns {boolean} the result if the assets are intersecting
 */
const areAssetsIntersecting = function (assetOne, assetTwo, intersectCb, notIntersectCb) {
    'use strict';

    // check if the assets are the same
    if (areSameAsset(assetOne, assetTwo)) {
        _.invoke(notIntersectCb);
        return false;
    }

    // Same type of assets need to be compared
    if (assetOne.asset_type !== assetTwo.asset_type) {
        _.invoke(notIntersectCb);
        return false;
    }

    // both assets are allowed to overlap
    if (_.defaultTo(assetOne.can_overlap, false) && _.defaultTo(assetTwo.can_overlap, false)) {
        _.invoke(notIntersectCb);
        return false;
    }

    // check if the points are intersecting
    if (!doIntersect(_.defaultTo(assetOne.corners, []), _.defaultTo(assetTwo.corners, []))) {
        _.invoke(notIntersectCb);
        return false;
    }

    _.invoke(intersectCb);
    return true;
};

/**
 * Checks if 2 assets are the same
 *
 * This is a helper function for other checks
 *
 * @param {object} assetOne Asset to check
 * @param {object} assetTwo Asset to compare against
 * @returns {boolean} the result of the check
 */
const areSameAsset = function (assetOne, assetTwo) {
    'use strict';
    return assetOne === assetTwo;
};

/**
 * Checks if the number of assets exceeds an allowed amount
 *
 * @param {array} assetList a collection of assets
 * @param {int} numAllowed number of allowed assets (by asset_id)
 * @returns {boolean} true if the number of assets do not exceed the numAllowed
 */
const assetCountInRange = function (assetList, numAllowed) {
    'use strict';
    let assetCounts = _.countBy(assetList, 'asset_id');
    const checkNumAllowed = _.defaultTo(numAllowed, 5);
    return (_.find(assetCounts, function (count) { return count > checkNumAllowed; }) === undefined);
};

/**
 * Checks that the image will fit within the asset scale
 *
 * Ensures that the scale of the image will scale properly no matter the shape
 *
 * @param {object} asset the asset data
 * @param {number} imageWidth the width of the image
 * @param {number} imageHeight the height of the image
 * @returns {boolean} the result of the check
 */
const checkItemScale = function (asset, imageWidth, imageHeight) {
    'use strict';
    let minDim = asset.minDim || 40;
    let maxDim = asset.maxDim || 400;
    let minScale = Math.max(
        minDim / imageWidth,
        minDim / imageHeight
    );
    let maxScale = Math.min(
        maxDim / imageWidth,
        maxDim / imageHeight,
        asset.maxScale || 0
    );

    let checkScale = _.round(
        Math.max(Math.min(asset.scale, maxScale), minScale),
        14
    );

    return Math.round(asset.scale) === Math.round(checkScale);
};

/**
 * Compares an asset to a list of assets
 *
 * Checks that an asset is not intersecting other assets in a list
 *
 * @param {object} assetList a list of assets
 * @param {object} asset the asset to compare too
 * @param {function} validCb callback when the asset passes the comparision check
 * @param {function} invalidCb callback when the asset fails comparision check
 * @returns {boolean} the result of the comparision check
 * @fixme pass the CB functions to areAssetsIntersecting?
 */
const checkItem = function (assetList, asset, validCb, invalidCb) {
    'use strict';
    let assetOk = true;
    _.map(assetList, (checkAsset) => {
        assetOk = assetOk &&
            !areAssetsIntersecting(
                asset,
                checkAsset,
                _.noop,
                _.noop
            );
    });

    _.invoke(assetOk ? validCb : invalidCb);
    return assetOk;
};

/**
 * Finds all 4 corner points of the asset
 *
 * @param {object} asset the asset to to check
 * @returns {Array} each x,y point of the asset
 * @todo other polygons?
 */
const getAssetCorners = function (asset) {
    'use strict';
    const left = asset.left || 0;
    const top = asset.top || 0;
    const width = asset.width || 0;
    const height = asset.height || 0;
    const rotation = asset.rotation || 0;
    const scale = asset.scale || 0;
    const center = {
        x: left + width / 2,
        y: top + height / 2
    };
    const distance = Math.pow(
        Math.pow(width * scale / 2, 2) +
        Math.pow(height * scale / 2, 2),
        .5
    );

    let angle;
    let corners = [];
    for (let i = 0; i < 4; i++) {
        angle = rotation;
        angle += (i < 2 ? 0 : Math.PI);
        angle += Math.pow(-1, i) * Math.atan2(height, width);

        corners.push({
            x: center.x + distance * Math.cos(angle),
            y: center.y + distance * Math.sin(angle),
        });
    }

    return corners;
};

module.exports = {
    areAssetsIntersecting,
    areSameAsset,
    assetCountInRange,
    checkItemScale,
    checkItem,
    getAssetCorners,
    doIntersect
};
