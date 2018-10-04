module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        watch: {
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    './*.html',
                    './*.js',
                    './*.css',
                    './assets/*.{png, svg}',
                    './assets/*/*.{png, svg}'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                hostname: '0.0.0.0',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    base: '.',
                    options: {
                        index: 'index.html'
                    }
                },
                middleware: function (connect) {
                    return [
                        connect().use(
                            '/assets',
                            connect.static('./assets')
                        ),
                        connect.static('.')
                    ];
                }
            }
        }
    });

    grunt.registerTask('partytime!', [
        'connect:livereload',
        'watch'
    ]);
};
