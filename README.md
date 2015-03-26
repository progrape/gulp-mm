##wechat web rebuild team dev tool


###about us
<http://mmrb.github.io>

###installation

```shell
npm install -g gulp
npm install --save-dev gulp gulp-mm
```

###usage

create `gulpfile.js`

```javascript
var gulp = require('gulp');
var mm = require('gulp-mm');

gulp.task('build', function(){
    mm.watch('./src/**/*.less')
      .pipe(mm.less())
      .pipe(mm.sprite())
      .pipe(gulp.dest('./preview'))
      .pipe(mm.uglify())
      .pipe(gulp.dest('./dist'));
      
    mm.watch('./src/**/*.html')
      .pipe(mm.inline())
      .pipe(mm.optimization())
      .pipe(gulp.dest('./preview'))
      .pipe(mm.resolve())
      .pipe('./dist');
});

gulp.task('server', function(){
    mm.server.start({root: __dirname + '/preview'});
});

gulp.task('default', ['build', 'server']);
```

###api

**server**

express + socket.io(for live reload)

```javascript

mm.server.start({root: __dirname + '/preview'});

// when file change
mm.server.emit('change');

```

**inline**

you can import other file in your `html`, or `javascript` file with `inline` plugin, for example:

```html

<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>sprite</title>
    <!-- output: <style>content of style.less(after compile to css) </style> -->
    <link rel="stylesheet" href="./style.less?__inline"/>
</head>
<body>
    <!-- output: <img src="base64 of hello.png" -->
    <img src="hello.png?__inline"/>

    <!-- output: content of fragment -->
    <link rel="import" href="./fragment.html?__inline"/>
</body>
</html>

```

```javascript
// it will be replaced with content of zepto.js here
__inline("../lib/zepto.js");

$(function(){
    console.log('hello world!');
});

```


```css
.icon_new{
    display: inline-block;
    width: 16px;
    height: 16px;
    /* background's image will be replaced with icon's base64 format*/
    background: url("../images/icon/new.png?__inline");
}
```

**sprite**

the icon images will be concat to one image, which is named as current css file plus '_z.png', for example: icon_z.png.

```css

/* icon.css */

.icon_new{
    display: inline-block;
    vertical-align: middle;
    width: 16px;
    height: 16px;
    /* here will be replace sprite image path, and auto set the background-position */
    background: url("../images/icon/new.png?__sprite");
}

.icon_add{
    display: inline-block;
    vertical-align: middle;
    width: 16px;
    height: 16px;
    background: url("../images/icon/add.png?__sprite");
}

.icon_search{
    display: inline-block;
    vertical-align: middle;
    width: 16px;
    height: 16px;
    /* here will be replace @2x sprite image path, and auto set the background-position and background-size*/
    /* for ratina */
    background: url("../images/icon/add@2x.png?__sprite");
}

```