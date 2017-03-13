# neighborhood-map

It is the Project 7 of Udacity's Front-End Web Developer Nanodegree. 

A responsive single web page app named *goSightseeing* was created to provide travellers the recommended sights in a certain city where they want to travel or they are.

It was developed with public APIs provided by Google Map and Foursquare:

+ [Google Map](https://maps.google.com/): provide the map data
+ [Foursquare](https://foursquare.com/): provide the recommended place data (including images)

Have fun with this app: []()

## Run locally

The `src` stores development code and the `dist` stores production code.

+ `git clone https://github.com/gaoshu883/neighborhood-map.git`

  ```bash
  $> cd /path/to/the-project-folder/dist
  ```
+ Open `index.html` (Make sure you are online)
+ The sights of `New York` city are rendered initially after the web page is loaded.
+ Filter venues by inputing sights name or type, e.g. `park`; or by choosing from category list.
+ Clicking `search` icon or pressing `enter` key is equivalent.
+ Change the city name if you want.

## Supported by

### Framework and library

+ [Knockoutjs](http://knockoutjs.com/)
+ [ajax.js](https://github.com/littleBlack520/ajax)
    * Improvement based on this open source project

### Web font

+ [weloveiconfonts](http://weloveiconfonts.com/)

## Develop locally

### Building tool

Use `gulp` to minify assets and build the project, check out `gulpfile.js` and `package.json`for more details about task runner configure and dependencies.

Install development node-modules:

  ```bash
  $> cd /path/to/the-project-folder
  $> npm install
  ```

### App structure

    .(neighborhood-map/src)
    ├── css
    |   ├── app.css
    |   └── infoWindow.css
    ├── js
    |   ├── lib
    |   |   ├── knockout-3.4.1.js
    |   |   └── ajax.js
    |   ├── app
    |   |   ├── fetchLocations.js
    |   |   ├── googleMap.js
    |   |   └── listViewModel.js
    |   └── app.js
    └── index.html

