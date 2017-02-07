const assert = require('assert');
const expect = require('chai').expect;
const skribble = require('../../library/skribble/utils.js');

describe('Test Utilities', function () {
    'use strict';
    describe('Mocha', function () {
        it('Tests are functioning.', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        });
    });
    describe('Chai', function () {
        it('Chai syntax loads', function () {
            let foo = { foo: 'bar' };
            expect(foo).to.be.a('object');
            expect(foo.foo).to.equal('bar');
        });
    });
    describe('Skribble Utilities', function () {
        it('Should return True when assets are the same', function () {
            let assetOne = {};
            assert(
                skribble.areSameAsset(assetOne, assetOne),
                'Are Same Asset did not report true for same object'
            );
        });

        it('Should return False when assets are the different', function () {
            let assetOne = {};
            let assetTwo = {};
            assert(
                !skribble.areSameAsset(assetOne, assetTwo),
                'AreSameAsset did not report false for different assets'
            );
        });

        it('Should create the corners correctly', function () {
            let asset = {
                left: 190,
                top: -90,
                height: 900,
                width: 900,
                rotation: 0,
                layer: 1000,
                scale: 0.44444444444444
            };

            const corners = [
                { x: 839.999999999998, y: 559.999999999998 },
                { x: 839.999999999998, y: 160.00000000000202 },
                { x: 440.00000000000193, y: 160.00000000000202 },
                { x: 440.00000000000205, y: 559.999999999998 }
            ];

            const actual = skribble.getAssetCorners(asset);

            expect(actual[0].x).to.be.equal(corners[0].x);
            expect(actual[1].x).to.be.equal(corners[1].x);
            expect(actual[2].x).to.be.equal(corners[2].x);
            expect(actual[3].x).to.be.equal(corners[3].x);

            expect(actual[0].y).to.be.equal(corners[0].y);
            expect(actual[1].y).to.be.equal(corners[1].y);
            expect(actual[2].y).to.be.equal(corners[2].y);
            expect(actual[3].y).to.be.equal(corners[3].y);
        });

        it('Should return True when the scale is correct', function () {
            let asset = {
                left: 190,
                top: -90,
                height: 900,
                width: 900,
                rotation: 0,
                layer: 1000,
                scale: 0.44444444444444
            };

            assert(skribble.checkItemScale(asset, 900, 900));
        });

        it('Should return False when the scale is correct', function () {
            let asset = {
                left: 190,
                top: -90,
                height: 900,
                width: 900,
                rotation: 0,
                layer: 1000,
                scale: 1.44444444444444
            };

            assert(!skribble.checkItemScale(asset, 900, 900));
        });

        it('Should return True for overlapping assets', function () {
            let assetOne = {
                left: -111.14053081248878,
                top: -120.79470198675496,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                asset_type: 'item',
                can_overlap: false,
            };

            let assetTwo = {
                left: 190,
                top: -90,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                asset_type: 'item',
                can_overlap: false,
            };

            assetOne.corners = skribble.getAssetCorners(assetOne);
            assetTwo.corners = skribble.getAssetCorners(assetTwo);

            assert(
                skribble.areAssetsIntersecting(assetOne, assetTwo)
            );
        });

        it('Should return False for overlapping assets that are not the same type', function () {
            let assetOne = {asset_type: 'item'};
            let assetTwo = {asset_type: 'message'};

            assert(!skribble.areAssetsIntersecting(assetOne, assetTwo));
        });

        it('Should return True for overlapping assets that do not have asset type set', function () {
            let assetOne = {
                left: -111.14053081248878,
                top: -120.79470198675496,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: false,
            };

            let assetTwo = {
                left: 190,
                top: -90,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: false,
            };

            assetOne.corners = skribble.getAssetCorners(assetOne);
            assetTwo.corners = skribble.getAssetCorners(assetTwo);

            assert(
                skribble.areAssetsIntersecting(assetOne, assetTwo)
            );
        });

        it('Should return False for assets that can overlap', function () {
            let assetOne = {
                left: -111.14053081248878,
                top: -120.79470198675496,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: true,
            };

            let assetTwo = {
                left: 190,
                top: -90,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: true,
            };

            assetOne.corners = skribble.getAssetCorners(assetOne);
            assetTwo.corners = skribble.getAssetCorners(assetTwo);

            assert(
                !skribble.areAssetsIntersecting(assetOne, assetTwo)
            );
        });

        it('Should return True for assets where one can overlap', function () {
            let assetOne = {
                left: -111.14053081248878,
                top: -120.79470198675496,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: true,
            };

            let assetTwo = {
                left: 190,
                top: -90,
                scale: 0.44444444444444,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: false,
            };

            assetOne.corners = skribble.getAssetCorners(assetOne);
            assetTwo.corners = skribble.getAssetCorners(assetTwo);

            assert(skribble.areAssetsIntersecting(assetOne, assetTwo));
        });

        it('Should return false for check item', function () {
            let assets = [
                {
                    left: -5.18026591182652,
                    top: -175.89403973509934,
                    scale: 0.44444444444444,
                    rotation: 0,
                    layer: 1000,
                    height: 900,
                    width: 900,
                    can_overlap: false,
                },
                {
                    left: 418.6607936908225,
                    top: -173.7748344370861,
                    scale: 0.44444444444444,
                    rotation: 0,
                    layer: 1000,
                    height: 900,
                    width: 900,
                    can_overlap: false,
                }
            ];

            let overlappingAsset = {
                left: 0,
                top: 0,
                scale: 0.5,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: false,
            };

            assets[0].corners = skribble.getAssetCorners(assets[0]);
            assets[1].corners = skribble.getAssetCorners(assets[1]);
            overlappingAsset.corners = skribble.getAssetCorners(overlappingAsset);

            assert(
                !skribble.checkItem(assets, overlappingAsset)
            );
        });

        it('Should return true for check item when assets can overlap', function () {
            let assets = [
                {
                    left: -5.18026591182652,
                    top: -175.89403973509934,
                    scale: 0.44444444444444,
                    rotation: 0,
                    layer: 1000,
                    height: 900,
                    width: 900,
                    can_overlap: true,
                },
                {
                    left: 418.6607936908225,
                    top: -173.7748344370861,
                    scale: 0.44444444444444,
                    rotation: 0,
                    layer: 1000,
                    height: 900,
                    width: 900,
                    can_overlap: true,
                }
            ];

            let overlappingAsset = {
                left: 0,
                top: 0,
                scale: 0.5,
                rotation: 0,
                layer: 1000,
                height: 900,
                width: 900,
                can_overlap: true,
            };

            assets[0].corners = skribble.getAssetCorners(assets[0]);
            assets[1].corners = skribble.getAssetCorners(assets[1]);
            overlappingAsset.corners = skribble.getAssetCorners(overlappingAsset);

            assert(
                skribble.checkItem(assets, overlappingAsset)
            );
        });
    });
});
