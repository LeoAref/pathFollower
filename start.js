var pickerWidth = 4;
var ctx;
var moves = [];
var hexColor, lastMove = {}, nextMove;
addImgToCanvas('Red_circle_(thin).svg.png');



// RGB to HEX converter
function rgbToHex (r, g, b) {
    function _rumToHex (num) {
        var hex = num.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }

    return '#' + _rumToHex(r) + _rumToHex(g) + _rumToHex(b);
}

function getCenterPointData (x, y) {
    var data = ctx.getImageData(x, y, pickerWidth, pickerWidth).data,
        hexObject = {};

    // Go through all 1x1 points, and construct a hex score
    // then put them in an object
    for (var i = 0; i < data.length; i += 4) {
        var hex = rgbToHex(data[i], data[i + 1], data[i + 2]);

        // Check if it already exists
        if (hexObject[hex]) {
            hexObject[hex] = ++hexObject[hex];
        } else {
            hexObject[hex] = 1;
        }
    }

    // Get the hex with max occurrence
    var centerPointData = {
        hexColor: hexColor,
        score: 0,
        x: x,
        y: y
    };

    // Get the hexColor if we didn't get it yet (first move)
    if (centerPointData.hexColor === undefined) {
        for (var hexColor in hexObject) {
            if (hexObject[hexColor] > centerPointData.score) {
                centerPointData.hexColor = hexColor;
                centerPointData.score = hexObject[hexColor];
            }
        }

        hexColor = centerPointData.hexColor;
    }

    return centerPointData;
}

function getPointsData (centerPointData) {
    var pointsData = [];

    var yPosArr = ['top', 'center', 'bottom'],
        xPosArr = ['right', 'center', 'left'];

    yPosArr.forEach(function (yPos) {
        xPosArr.forEach(function (xPos) {
            var x, y;

            switch (yPos + ', ' + xPos) {
                case 'top, left':
                    x = centerPointData.x - pickerWidth;
                    y = centerPointData.y - pickerWidth;
                    break;
                case 'top, center':
                    x = centerPointData.x;
                    y = centerPointData.y - pickerWidth;
                    break;
                case 'top, right':
                    x = centerPointData.x + pickerWidth;
                    y = centerPointData.y - pickerWidth;
                    break;
                case 'center, left':
                    x = centerPointData.x - pickerWidth;
                    y = centerPointData.y;
                    break;
                case 'center, right':
                    x = centerPointData.x + pickerWidth;
                    y = centerPointData.y;
                    break;
                case 'bottom, left':
                    x = centerPointData.x - pickerWidth;
                    y = centerPointData.y + pickerWidth;
                    break;
                case 'bottom, center':
                    x = centerPointData.x;
                    y = centerPointData.y + pickerWidth;
                    break;
                case 'bottom, right':
                    x = centerPointData.x + pickerWidth;
                    y = centerPointData.y + pickerWidth;
                    break;
            }

            // Check if this point is not the center
            if (x && y && !isTheLastMove(x, y)) {
                pointsData.push({
                    xPos: xPos,
                    yPos: yPos,
                    x: x,
                    y: y,
                    percentage: _getPercentage(x, y)
                });
            }
        });
    });

    function _getPercentage (x, y) {
        var score = getPointScore(x, y, centerPointData.hexColor);

        return 100 - Math.abs(score - centerPointData.score) / centerPointData.score * 100;
    }

    return pointsData.sort(function (a, b) {
        if (a.percentage > b.percentage) {
            return -1;
        } else if (a.percentage < b.percentage) {
            return 1;
        }

        return 0;
    });
}

function getPointScore (x, y, centerPointDataHexColor) {
    var data = ctx.getImageData(x, y, pickerWidth, pickerWidth).data,
        score = 0;

    for (var i = 0; i < data.length; i += 4) {
        var hex = rgbToHex(data[i], data[i + 1], data[i + 2]);

        if (hex === centerPointDataHexColor) score++;
    }

    return score;
}

function addImgToCanvas (imgUrl) {
    var canvas = document.getElementById('img');
    ctx = canvas.getContext('2d');

    // Get the image dimentions
    var img = document.createElement('img');

    img.src = imgUrl;

    img.onload = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        var aspect = canvas.width / canvas.height;

        ctx.drawImage(img, 0, 0, window.innerHeight * aspect, window.innerHeight);

        canvas.addEventListener('click', function (e) {
            moves = [];
            moveToPoint(e.clientX, e.clientY);
        });

        document.addEventListener('mousemove', function (e) {
            document.getElementById('cursor').style.left = e.clientX + 1 + 'px';
            document.getElementById('cursor').style.top = e.clientY + 1 + 'px';
        });
    }
}

function filterPointsWithDir (point1, point2, lastMove) {
    var score1 = (point1.xPos === lastMove.xPos ? 1 : 0) + 
                 (point1.yPos === lastMove.yPos ? 1 : 0),

        score2 = (point2.xPos === lastMove.xPos ? 1 : 0) + 
                 (point2.yPos === lastMove.yPos ? 1 : 0);

    if (score1 >= score2) {
        console.log('point1', point1, point2, lastMove)
        return point1;
    }
    
    console.log('point2', point1, point2, lastMove)
    return point2;
}

function isTheLastMove (pointX, pointY) {
    var distances = {
        left: -1,
        center: 0,
        right: 1,
        top: -1,
        bottom: 1
    };

    var prvXPos = lastMove.x - distances[lastMove.xPos] * pickerWidth,
        prvYPos = lastMove.y - distances[lastMove.yPos] * pickerWidth;

    var isSameXPos = pointX === prvXPos,
        isSameYPos = pointY === prvYPos;

    return isSameXPos && isSameYPos;
}

function moveToPoint (x, y) {
    // Get the centered point data
    var centerPointData = getCenterPointData(x, y);

    // Get the surroding points data
    var pointsData = getPointsData(centerPointData);
    lastMove = moves[moves.length - 1];

    if (moves.length) {
        nextMove = filterPointsWithDir(pointsData[0], pointsData[1], lastMove);
    }

    // First move
    else {
        nextMove = pointsData[0];
    }

    moves.push(nextMove);

    // Show the move (current, next) points
    var crtPoint = document.getElementById('crtPoint'),
        nxtPoint = document.getElementById('nxtPoint');

    crtPoint.style.left = x + 'px';
    crtPoint.style.top = y + 'px';

    nxtPoint.style.left = nextMove.x + 'px';
    nxtPoint.style.top = nextMove.y + 'px';

    lastMove = nextMove;
}