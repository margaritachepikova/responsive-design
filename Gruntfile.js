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
                    './public/*.html',
                    './public/*.js',
                    './public/*.css',
                    './public/assets/*.{png, svg}',
                    './public/assets/*/*.{png, svg}'
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
                    base: 'public',
                    options: {
                        index: 'index.html'
                    }
                },
                middleware: function (connect) {
                    return [
                        connect().use(
                            '/public/assets',
                            connect.static('./public/assets')
                        ),
                        connect.static('./public')
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
