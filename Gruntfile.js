module.exports = function (grunt) {

    grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            hbPkg: grunt.file.readJSON('node_modules/hbjs/package.json'),
            banner: '/*\n' +
            '* <%= hbPkg.fullName %> v.<%= hbPkg.version %>\n' +
            '* Obogo - MIT ' + new Date().getFullYear() + '\n' +
            '* https://github.com/obogo/hummingbird/\n' +
            '*/\n',
            compile: {
                hb: {
                    banner: "<%= banner %>",
                    wrap: 'hb',
                    filename: 'hb',
                    build: '<%= pkg.buildDir %>',
                    scripts: {
                        import: [
                            'http'
                        ]
                    }
                }
            }

        }
    );

    grunt.loadNpmTasks('hbjs');

    grunt.registerTask('default', 'compile:hb');

};