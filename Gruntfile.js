module.exports = function(grunt) {
  // Do grunt-related things in here

  grunt.loadNpmTasks('grunt-saucelabs');

  // Project configuration.
  grunt.initConfig({
    'saucelabs-custom': {
      all: {
        options: {
          "max-duration": 360,
          "throttled": 3,
          "tunneled": true,
          "tunnelArgs": ['--vm-version', 'dev-varnish'],
          urls: [
            //'http://localhost:8080/saucerunner.html'
//            'http://localhost:8080/saucerun'
//            'http://localhost:8080/smoke_view?test'
            'http://localhost:8080/saucerunner.html'

            //'http://localhost:8080/smoke/bitmapbutton.html', //no asserts
            //'http://localhost:8080/smoke/misc.html', //no asserts
//            'http://localhost:8080/smoke/replicatorbug.html', //no asserts (assert doesn't run)

//            'http://localhost:8080/smoke/ace.html', //passing
//            'http://localhost:8080/smoke/animator.html', //passing
//            'http://localhost:8080/smoke/animator_js.html', //passing
//            'http://localhost:8080/smoke/animgroup.html', //passing
//            'http://localhost:8080/smoke/art.html', //passing
//            'http://localhost:8080/smoke/attributes.html', //passing
//            'http://localhost:8080/smoke/bitmap.html', //passing
//            'http://localhost:8080/smoke/button.html', //passing
//            'http://localhost:8080/smoke/circularevent.html', //passing
//            'http://localhost:8080/smoke/class.html', //passing
//            'http://localhost:8080/smoke/dre.html', //passing
//            'http://localhost:8080/smoke/events.html', //passing
//            'http://localhost:8080/smoke/handlers.html', //passing
//            'http://localhost:8080/smoke/idle.html', //passing
//            'http://localhost:8080/smoke/initialization.html', //passing
//            'http://localhost:8080/smoke/inputtext.html'//, //passing
//            'http://localhost:8080/smoke/labelbutton.html', //passing
//            'http://localhost:8080/smoke/layout_align.html', //passing
//            'http://localhost:8080/smoke/layout_constant.html', //passing
//            'http://localhost:8080/smoke/layout_resize.html', //passing
//            'http://localhost:8080/smoke/layout_spaced.html', //passing
//            'http://localhost:8080/smoke/layout_variable.html', //passing
//            'http://localhost:8080/smoke/layout_wrapping.html', //passing
//            'http://localhost:8080/smoke/node.html', //passing
//            'http://localhost:8080/smoke/replication.html', //passing
//            'http://localhost:8080/smoke/scrollable.html', //passing
//            'http://localhost:8080/smoke/setter.html', //passing
//            'http://localhost:8080/smoke/sizetodom.html', //passing
//            'http://localhost:8080/smoke/statebutton.html', //passing
//            'http://localhost:8080/smoke/states.html', //passing
//            'http://localhost:8080/smoke/super.html', //passing
//            'http://localhost:8080/smoke/text.html'//, //failing
//            'http://localhost:8080/smoke/twojs.html', //passing
//            'http://localhost:8080/smoke/video.html', //passing
//            'http://localhost:8080/smoke/view.html', //passing
//            'http://localhost:8080/smoke/view_border_padding.html', //passing
//            'http://localhost:8080/smoke/view_bounds_transforms.html', //passing
//            'http://localhost:8080/smoke/view_position.html', //passing
//            'http://localhost:8080/smoke/view_size.html', //passing
//            'http://localhost:8080/smoke/z.html' //passing
          ],
          testname: 'DREEM smoke test',

          browsers: [
            {
              platform: 'OS X 10.10',
              browserName: 'chrome',
              version: 'beta'
            },
            {
              platform: 'OS X 10.10',
              browserName: 'firefox',
              version: 'beta'
            },
            {
              platform: 'Windows 8.1',
              browserName: 'chrome',
              version: 'beta'
            },
            {
              platform: 'Windows 8.1',
              browserName: 'firefox',
              version: 'beta'
            },
            {
              platform: 'Linux',
              browserName: 'chrome',
              version: 'beta'
            },
            {
              platform: 'Linux',
              browserName: 'firefox',
              version: 'beta'
            }
          ]
          // optionally, he `browsers` param can be a flattened array:
          // [["XP", "firefox", 19], ["XP", "chrome", 31]]
        }
      }
    }
  });

  grunt.registerTask('default', ['saucelabs-custom']);

};
