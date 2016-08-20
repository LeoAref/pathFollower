(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * pathFollower.js
 *
 * MIT License
 * Copyright (c) 2016 Muhammad Aref
 *
 * It is a library to follow a path on an image with specifing the first point,
 * and there are two ways to specify it, either with clicking on it using the
 * mouse or initialize the follower with the (x, y) parameters.
 */

;
(() => {
    'use strict';

    const CONFIG = {
        pickerId: 'pathFollower__picker',
        pickerBg: 'yellow',
        crtPointId: 'pathFollower__crtPoint'
    };

    class PathFollower {
        /**
         * @constructor
         * @param {string} id - Canvas id
         * @param {string} imgUrl - Image url
         * @param {number} x - Starting point x position
         * @param {number} y - Starting point y position
         * @param {number} pickerWidth - Picker width
         * @param {number} pickOnClick - If the user will initialize the follower
         *                               by clicking on a starting point
         */
        constructor({ id, imgUrl, x, y, pickerWidth, pickOnClick }) {
            this.id = id;
            this.imgUrl = imgUrl;
            this.startX = x;
            this.startY = y;
            this.pickOnClick = pickOnClick;
            this.pickerWidth = pickerWidth;

            this.moves = [];
            this.lastMove = null;
            this.nextMove = null;

            // Initialize the follower
            this.init();
        }

        /**
         * @description
         * Initialize the follower by injecting the image into the canvas element,
         * and read the image data, then extract the required data about the starting
         * point.
         */
        init() {
            this.canvas = document.getElementById(this.id);
            this.ctx = this.canvas.getContext('2d');
            this.img = document.createElement('img');

            this.img.src = this.imgUrl;

            this.img.onload = () => {
                // FIXME: we need to set the width and height according to both the
                // image aspect ratio, and the window innerHeight, and innerWidth.
                const aspect = window.innerWidth / window.innerHeight;

                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;

                this.ctx.drawImage(this.img, 0, 0, window.innerHeight * aspect, window.innerHeight);

                // Build the picker in case of manual initialization
                if (this.pickOnClick) {
                    this.buildPicker();
                } else {
                    this.getMainHexColor();
                    this.buildCrtPoint();
                }

                // Add event listeners
                this.addEventListeners();
            };
        }

        /**
         * @description
         * Only in case of initializing by picking the starting point.
         * It builds the cursor, to allow the user to tract the current cursor position
         * and show him the picker area, according the the given picker width.
         */
        buildPicker() {
            this.picker = document.createElement('div');

            this.picker.id = CONFIG.pickerId;
            this.picker.style.position = 'fixed';
            this.picker.style.background = CONFIG.pickerBg;
            this.picker.style.width = this.pickerWidth + 'px';
            this.picker.style.height = this.pickerWidth + 'px';

            document.body.appendChild(this.picker);
        }

        buildCrtPoint() {
            // Check if the crtPoint not exists
            if (this.crtPoint === undefined) {
                this.crtPoint = document.createElement('div');

                this.crtPoint.id = CONFIG.crtPointId;
                this.crtPoint.style.position = 'fixed';
                this.crtPoint.style.width = this.pickerWidth + 'px';
                this.crtPoint.style.height = this.pickerWidth + 'px';
                this.crtPoint.style.border = '1px dotted #000';

                document.body.appendChild(this.crtPoint);
            }

            this.crtPoint.style.top = this.crtY + 'px';
            this.crtPoint.style.left = this.crtX + 'px';
        }

        /**
         * @description
         * Adds the required event listener for various events
         */
        addEventListeners() {
            // Position the picker on mousemove over the canvas
            this.canvas.addEventListener('mousemove', e => {
                // We add "1" here to be able to click on other elements on the page
                this.picker.style.top = e.clientY + 1 + 'px';
                this.picker.style.left = e.clientX + 1 + 'px';
            });

            // Re-initialize the follower after each click
            this.canvas.addEventListener('click', e => {
                this.startX = e.clientX;
                this.startY = e.clientY;
                this.crtX = e.clientX;
                this.crtY = e.clientY;

                this.getMainHexColor();
                this.buildCrtPoint();
            });
        }

        /**
         * @description
         * Get the the main hex color.
         */
        getMainHexColor() {
            const ctxData = this.ctx.getImageData(this.startX, this.startY, this.pickerWidth, this.pickerWidth).data,
                  hexObject = {};

            // Go through all 1x1 points, and construct a hex score
            // then put them in an object
            for (let i = 0; i < ctxData.length; i += 4) {
                const hex = this.rgbToHex(ctxData[i], ctxData[i + 1], ctxData[i + 2]);

                // Check if it already exists
                if (hexObject[hex]) {
                    hexObject[hex] = ++hexObject[hex];
                } else {
                    hexObject[hex] = 1;
                }
            }

            // Get the main hex color
            let score = 0,
                hexColor;

            for (let _hexColor in hexObject) {
                if (hexObject[_hexColor] > score) {
                    hexColor = _hexColor;
                    score = hexObject[_hexColor];
                }
            }

            this.mainHexColor = hexColor;
            this.mainColorScore = score;
        }

        /**
         * @description
         * Returns the data of all neighbor points to the center point, and data will
         * be sorted according to the score.
         * @return {array} - Sorted array of points data
         */
        getPointsData() {
            const pointsData = [],
                  yPosArr = ['top', 'center', 'bottom'],
                  xPosArr = ['right', 'center', 'left'];

            yPosArr.forEach(yPos => {
                xPosArr.forEach(xPos => {
                    let x, y;

                    switch (yPos + ', ' + xPos) {
                        case 'top, left':
                            x = this.crtX - this.pickerWidth;
                            y = this.crtY - this.pickerWidth;
                            break;
                        case 'top, center':
                            x = this.crtX;
                            y = this.crtY - this.pickerWidth;
                            break;
                        case 'top, right':
                            x = this.crtX + this.pickerWidth;
                            y = this.crtY - this.pickerWidth;
                            break;
                        case 'center, left':
                            x = this.crtX - this.pickerWidth;
                            y = this.crtY;
                            break;
                        case 'center, right':
                            x = this.crtX + this.pickerWidth;
                            y = this.crtY;
                            break;
                        case 'bottom, left':
                            x = this.crtX - this.pickerWidth;
                            y = this.crtY + this.pickerWidth;
                            break;
                        case 'bottom, center':
                            x = this.crtX;
                            y = this.crtY + this.pickerWidth;
                            break;
                        case 'bottom, right':
                            x = this.crtX + this.pickerWidth;
                            y = this.crtY + this.pickerWidth;
                            break;
                    }

                    // Check if this point is not the center
                    if (x && y && !this.isTheLastMove(x, y)) {
                        pointsData.push({
                            xPos: xPos,
                            yPos: yPos,
                            x: x,
                            y: y,
                            percentage: _getPercentage.call(this, x, y)
                        });
                    }
                });
            });

            function _getPercentage(x, y) {
                const score = this.getPointScore(x, y, this.lastMove.hexColor);

                return 100 - Math.abs(score - this.mainColorScore) / this.mainColorScore * 100;
            }

            return pointsData.sort((a, b) => {
                if (a.percentage > b.percentage) {
                    return -1;
                } else if (a.percentage < b.percentage) {
                    return 1;
                }

                return 0;
            });
        }

        /**
         * @description
         * Selects the point that is on the same direction of the last move, so
         * we will not go back again, if the next point in the previous direction.
         * @param {object} point1
         * @param {object} point2
         * @return {object} - The selected point
         */
        selectPointWithSameDirection(point1, point2) {
            let score1 = (point1.xPos === this.lastMove.xPos ? 1 : 0) + (point1.yPos === this.lastMove.yPos ? 1 : 0),
                score2 = (point2.xPos === this.lastMove.xPos ? 1 : 0) + (point2.yPos === this.lastMove.yPos ? 1 : 0);

            if (score1 >= score2) {
                console.log('point1', point1, point2, this.lastMove);
                return point1;
            }

            console.log('point2', point1, point2, this.lastMove);
            return point2;
        }

        /**
         * @description
         * Get the point score, depending on how many times the center point hexColor
         * has been occurred in the given pickerWidth area
         * @param {number} x
         * @param {number} y
         * @return {number} - Point score
         */
        getPointScore(x, y) {
            const ctxData = ctx.getImageData(x, y, this.pickerWidth, this.pickerWidth).data;
            let score = 0;

            for (let i = 0; i < ctxData.length; i += 4) {
                const hex = this.rgbToHex(ctxData[i], ctxData[i + 1], ctxData[i + 2]);

                if (hex === this.lastMove.hexColor) score++;
            }

            return score;
        }

        /**
         * @description
         * Check if the given point is the last point or not.
         * @return {boolean}
         */
        isTheLastMove(pointX, pointY) {
            const distances = {
                left: -1,
                center: 0,
                right: 1,
                top: -1,
                bottom: 1
            };

            const prvXPos = this.crtX - distances[this.lastMove.xPos] * this.pickerWidth,
                  prvYPos = this.crtY - distances[this.lastMove.yPos] * this.pickerWidth;

            const isSameXPos = pointX === prvXPos,
                  isSameYPos = pointY === prvYPos;

            return isSameXPos && isSameYPos;
        }

        /**
         * @description
         * Move to the next point on the path.
         */
        moveToNextPoint() {
            // Get the surrounding points data
            const pointsData = this.getPointsData();

            // This is the first move, so select the point with the highest score.
            if (this.moves.length === 0) {
                this.nextMove = pointsData[0];
            }

            // We will select the point that will be on the same direction of the lastMove
            // amoung the top score points.
            else {
                    this.nextMove = this.selectPointWithSameDirection(pointsData[0], pointsData[1]);
                }

            this.moves.push(this.nextMove);

            // // Show the move (current, next) points
            // var crtPoint = document.getElementById('crtPoint'),
            //     nxtPoint = document.getElementById('nxtPoint');

            // crtPoint.style.left = x + 'px';
            // crtPoint.style.top = y + 'px';

            // nxtPoint.style.left = nextMove.x + 'px';
            // nxtPoint.style.top = nextMove.y + 'px';

            this.lastMove = this.nextMove;
        }

        /**
         * @param {number} r
         * @param {number} g
         * @param {number} b
         * @return {string} - Hex color string
         */
        rgbToHex(r, g, b) {
            /**
             * @description
             * It converts a number to its base-16 (i.e. hexadecimal) equivalent, and make
             * sure it returns a string with length equals 2 
             * @param {number} num
             * @return {string} - Hexadecimal string
             */
            function _numToHex(num) {
                const hex = num.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }

            return `#${ _numToHex(r) }${ _numToHex(g) }${ _numToHex(b) }`;
        }
    }

    window.PathFollower = PathFollower;
})();

},{}]},{},[1])