const gulp = require('gulp'),
	notify = require('gulp-notify'), 
	browserify = require('gulp-browserify');
	source = require('vinyl-source-stream');

gulp.task('scripts:src', () => {
	gulp.src('./src/pathFollower.js')
        .pipe(browserify({transform: 'babelify'}))
        .on('error', console.log.bind(console))
        .pipe(notify('Scripts:src task finished!'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', () => {
    gulp.watch('./src/pathFollower.js', ['scripts:src']);
});

gulp.task('default', ['scripts:src', 'watch']);