var gulp       	= require('gulp'), // Подключаем Gulp
	sass         = require('gulp-sass'), //Подключаем Sass пакет,
	browserSync  = require('browser-sync'), // Подключаем Browser Sync
	concat       = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
	uglify       = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
	cssnano      = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
	rename       = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
	del          = require('del'), // Подключаем библиотеку для удаления файлов и папок
	imagemin     = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
	pngquant     = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
	cache        = require('gulp-cache'), // Подключаем библиотеку кеширования
	autoprefixer = require('gulp-autoprefixer'),
	buffer 		 = require('vinyl-buffer'),
	ghPages = require('gulp-gh-pages'), //заливка на ГХ
	merge 		 = require('merge-stream'),
	spritesmith  = require('gulp.spritesmith'),
	sourcemaps = require('gulp-sourcemaps'),
	svgSprite 	 = require('gulp-svg-sprite'), //для свг спарйтов
 	svgmin 		 = require('gulp-svgmin'), //для свг спарйтов
 	cheerio 	 = require('gulp-cheerio'), //для свг спарйтов
	replace 	 = require('gulp-replace'), //для свг спарйтов
	sftp 		= require('gulp-sftp'),
	iconfont = require('gulp-iconfont'),
	iconfontCss = require('gulp-iconfont-css'),
	runTimestamp = Math.round(Date.now()/1000);
 	var fontName = 'Icons'; 


var assetsDir = 'app/';
var buildDir = 'markup/';


 
// gulp.task('sftp', function () {
//     return gulp.src('test/**/*')
//         .pipe(sftp({
//             host: 'office.element-studio.ru',
//             remotePath:'/david.steklo-i-stal.element-studio.ru/TEST_MY',
//             auth: 'keyMain'
//         }));
// });
// gulp.task('sftp', function () {
//     return gulp.src('test/**/*')
//         .pipe(sftp({
//             host: 'office.element-studio.ru',
//             remotePath:'/david.salon-oboev.element-studio.ru/TEST_MY',
//             auth: 'keyMain'
//         }));
// });

// gulp-gh-pages 
gulp.task('gh', function() {
  return gulp.src('./app/**/*')
    .pipe(ghPages());
});

gulp.task('iconfont', function(){
  return gulp.src(['app/images/svg/*.svg']) // Source folder containing the SVG images
    .pipe(iconfontCss({
      fontName: fontName, // The name that the generated font will have
      cssClass: 'icn',
      path: 'app/sass/templates/_icons.scss', // The path to the template that will be used to create the SASS/LESS/CSS file
      targetPath: '../../sass/_icons.scss', // The path where the file will be generated
      fontPath: '../fonts/icons_custom/' // The path to the icon font file
    }))
    .pipe(iconfont({
      prependUnicode: false, // Recommended option 
      fontName: fontName, // Name of the font
      formats: ['ttf', 'eot', 'woff','svg' , 'woff2'], // The font file formats that will be created
      normalize: true,
      timestamp: runTimestamp // Recommended to get consistent builds when watching files
    }))
    .pipe(gulp.dest('app/fonts/icons_custom/'));
});


// build sprites png
gulp.task('sprite', function () {
  var spriteData = gulp.src('app/images/sprites/*.png').pipe(spritesmith({
    imgName: 'sprite.png',
    cssName: '_sprite.scss',
    imgPath: '../images/sprite.png',
    padding: 5
  }));
  var imgStream = spriteData.img
    .pipe(buffer())
    .pipe(imagemin())
    .pipe(gulp.dest('app/images/')); 
  var cssStream = spriteData.css
    .pipe(gulp.dest('app/sass'));
 
  return merge(imgStream, cssStream);
});


//библиотеки js
gulp.task('scripts', function() {
	return gulp.src([ // Берем все необходимые библиотеки
		// 'bower_components/jquery/dist/jquery.min.js',
		// 'bower_components/owl.carousel/dist/owl.carousel.min.js',
		// 'node_modules/ion-rangeslider/js/ion.rangeSlider.min.js',
		// 'node_modules/@amcharts/amcharts4/core.js',
		// 'node_modules/@amcharts/amcharts4/charts.js',
		])
		// .pipe(concat('libs.min.js')) // Собираем их в кучу в новом файле libs.min.js
		// .pipe(uglify()) // Сжимаем JS файл
		.pipe(gulp.dest('app/js')); // Выгружаем в папку app/js
});


//библиотеки css
gulp.task('css-libs', ['sass'], function() {
	return gulp.src([ // Берем все необходимые библиотеки
		// 'bower_components/fontawesome/css/all.min.css',
		
		// 'bower_components/owl.carousel/dist/assets/owl.theme.green.css',
		// 'bower_components/owl.carousel/dist/assets/owl.carousel.css',
		// 'node_modules/ion-rangeslider/css/ion.rangeSlider.min.css',
		// 'bower_components/datatables.net-dt/css/jquery.dataTables.min.css',
		// 'bower_components/bootstrap-select/dist/css/bootstrap-select.min.css',
		// 'bower_components/fancybox/dist/jquery.fancybox.min.css',
		])
		.pipe(sourcemaps.init())
		.pipe(cssnano())
		.pipe(concat('libs.min.css'))
		.pipe(sourcemaps.write(''))
		.pipe(gulp.dest('app/css/'));
});

gulp.task('sass', function(){ // Создаем таск Sass
	return gulp.src('app/sass/**/*.scss') // Берем источник
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError)) // Преобразуем Sass в CSS посредством gulp-sass compressed
		.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7','iOS >= 9'], { cascade: true })) // Создаем префиксы
		.pipe(sourcemaps.write(''))
		.pipe(gulp.dest('app/css')) // Выгружаем результата в папку app/css
		.pipe(browserSync.reload({stream: true})) // Обновляем CSS на странице при изменении
});

gulp.task('browser-sync', function() { // Создаем таск browser-sync
	browserSync({ // Выполняем browserSync
		server: { // Определяем параметры сервера
			baseDir: 'app' // Директория для сервера - app
		},
		notify: false // Отключаем уведомления
	});
});

gulp.task('watch', ['browser-sync', 'css-libs', 'scripts'], function() { 
	// gulp.watch('app/sass/**/*.scss', ['sass']); // Наблюдение за sass файлами в папке sass
	gulp.watch('app/sass/**/*.scss', function(event, cb) {
        setTimeout(function(){gulp.start('sass');},500) // задача выполниться через 500 миллисекунд и файл успеет сохраниться на диске
    });
	gulp.watch('app/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта
	gulp.watch('app/js/**/*.js', browserSync.reload);   // Наблюдение за JS файлами в папке js
});

gulp.task('clean', function() {
	return del.sync('markup'); // Удаляем папку dist перед сборкой
});

gulp.task('img', function() {
	return gulp.src('app/images/**/*') // Берем все изображения из app
		.pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
		.pipe(gulp.dest('markup/images')); // Выгружаем на продакшен
});

gulp.task('build', ['clean', 'img', 'sass', 'scripts'], function() {

	// var buildCss = gulp.src([ 
	// 	'app/css/all.css',
	// 	'app/css/libs.min.css'
	// 	])
	var buildFonts = gulp.src('app/css/**/*')// Переносим библиотеки в продакшен
	.pipe(gulp.dest('markup/css'))

	var buildFonts = gulp.src('app/fonts/**/*') // Переносим шрифты в продакшен
	.pipe(gulp.dest('markup/fonts'))

	var buildJs = gulp.src('app/js/**/*') // Переносим скрипты в продакшен
	.pipe(gulp.dest('markup/js'))

	var buildHtml = gulp.src('app/*.html') // Переносим HTML в продакшен
	.pipe(gulp.dest('markup'));
	

});

gulp.task('clear', function (callback) {
	return cache.clearAll();
})

gulp.task('default', ['watch']);
