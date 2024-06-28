'use strict';

Promise.all([
  documentReady(),
  makeRequest('GET', 'data/color-list.txt')
])
.then(function (result) {
  // Construct color database
  var colors = result[1].trim().split("\n").map(function (row) {
    var array = row.split("\t");
    var colorDatum = {
      code: array[0],
      name: array[1],
      altname: array[2],
      munsell: array[3], // munsell color
      RGB: colorCodeToRGB(array[0]),
    };
    return colorDatum;
  });

  // Add event listener
  var inputColorNode = document.getElementById('inputColor');
  var showNearestColors = initShowNearestColors(colors);
  showNearestColors();
  // input -- when change value
  // change -- when changes are committed by user
  inputColorNode.addEventListener('input', showNearestColors, false);
  inputColorNode.addEventListener('change', showNearestColors, false);
})


// Init and returns update function.
// This higher order function takes all color data, and returns update function.
//
function initShowNearestColors(colors) {
  // Show nearest colors
  return function update(event) {
    var inputColor = document.getElementById('inputColor').value;
    if (!validColorCode(inputColor)) {
      document.getElementById('colorCode').textContent = "";
      document.getElementById('colorRGB' ).textContent = "";
      document.getElementById('inputError').textContent = "正しい色コードを入力してください。"
      return;
    }
    var inputColorRGB = colorCodeToRGB(inputColor);
    document.getElementById('colorCode').textContent = inputColor;
    document.getElementById('colorRGB' ).textContent = inputColorRGB;
    document.getElementById('inputError').textContent = "";
    var nearestColors = findNearestColor(inputColor, colors);
    var nearestColorsNode = document.getElementById('nearestColors');
    // clear child
    while (nearestColorsNode.firstChild) {
      nearestColorsNode.removeChild(nearestColorsNode.firstChild);
    }
    // append child
    nearestColors.forEach(function (color) {
      var colorNode = document.createElement('div');
      colorNode.classList.add('color-row');
      var colorSampleNode = document.createElement('span');
      colorSampleNode.classList.add('color-sample');
      colorSampleNode.style.backgroundColor = color.code;
      var colorCodeNode = document.createElement('span');
      colorCodeNode.classList.add('color-code');
      colorCodeNode.textContent = color.code + " ";
      var colorNameNode = document.createElement('span');
      colorNameNode.classList.add('color-name');
      colorNameNode.textContent = color.name;
      var colorAltnameNode = document.createElement('span');
      colorAltnameNode.classList.add('color-altname');
      colorAltnameNode.textContent = color.altname;
      var colorMunsellNode = document.createElement('span');
      colorMunsellNode.classList.add('color-munsell');
      colorMunsellNode.textContent = color.munsell;
      var colorRGBNode = document.createElement('span');
      colorRGBNode.classList.add('color-rgb');
      colorRGBNode.textContent = color.RGB.toString();

      colorNode.appendChild(colorSampleNode);
      colorNode.appendChild(colorNameNode);
      colorNode.appendChild(colorAltnameNode);
      colorNode.appendChild(document.createElement('br'));
      colorNode.appendChild(colorRGBNode);
      colorNode.appendChild(colorCodeNode);
      colorNode.appendChild(colorMunsellNode);
      nearestColorsNode.appendChild(colorNode);
    })
  };
}

// Resolve promise when document onload.
//
// @return Promise object
//
function documentReady() {
  return new Promise(function (resolve) {
    if (document.readyState === "complete") {
      resolve();
    } else {
      document.addEventListener("DOMContentLoaded", resolve);
    }
  });
}

// Make XML Http Request
//
// @param method -- string, 'GET' or 'POST'.
// @param url    -- string, URL.
// @return Promise object
//
function makeRequest(method, url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({ status: this.status, statusText: xhr.statusText });
      }
    };
    xhr.onerror = function () {
      reject({ status: this.status, statusText: xhr.statusText });
    };
    xhr.send();
  })
}

// Find nearest colors
//
// @param color  -- string, color code like "#11AA77".
// @param colors -- array of color data, All color data.
//                  Each datum columns must have color code and color Name.
// @return nearestColors -- Top 10 of nearest colors
//
function findNearestColor(inputColor, colors) {
  var inputColorRGB = colorCodeToRGB(inputColor);
  var colorsWithDistance = colors.map(function (color) {
    color.distance = calcDistance(inputColorRGB, color.RGB);
    return color;
  });
  var nearestColors = findMinDistance(colorsWithDistance, 10);
  return nearestColors;
}

// Convert color code to RGB
//
// @param color -- string, color code like "#11AA77".
// @return vector -- array, [red, green, blue]
//
function colorCodeToRGB(color) {
  var vector = [color.substr(1, 2), color.substr(3, 2), color.substr(5, 2)]
    .map(function (hex) { return parseInt(hex, 16) });
  vector.toString = function () {
    return "R" + this[0] + " G" + this[1] + " B" + this[2]
  }
  return vector;
}

// Calculate distance between v1 and v2
//
function calcDistance(v1, v2) {
  return Math.sqrt(
    Math.pow(v1[0] - v2[0], 2) +
    Math.pow(v1[1] - v2[1], 2) +
    Math.pow(v1[2] - v2[2], 2)
  );
}

// Find and return n elements of minimum distance from array
//
function findMinDistance(array, n) {
  return array.sort(function (a, b) { return a.distance - b.distance; }).slice(0, n);
}

// Validate color code
//
function validColorCode(str) {
  return str.match(/^#[0-9a-f]{6}$/i);
}
