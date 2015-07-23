module.exports = function(grunt) {
  // Do grunt-related things in here

  grunt.loadNpmTasks('grunt-saucelabs');

  // Project configuration.
  grunt.initConfig({
    'saucelabs-custom': {
      all: {
        options: {
          "max-duration": 2400,
          "throttled": 3,
          "tunneled": true,
          "tunnelArgs": ['--vm-version', 'dev-varnish'],
          urls: [
            'http://localhost:8080/saucerunner.html?testTimeout=2000'
          ],
          testname: 'DREEM smoke test mobile',

          browsers: [
            {
              browserName: 'android',
              version: '5.1',
              platform: 'Linux',
              deviceName: 'Android Emulator',
              'device-orientation': 'portrait'
            },
            {
              browserName: 'iphone',
              version: '8.2',
              platform: 'OS X 10.10',
              deviceName: 'iPhone Simulator',
              'device-orientation': 'portrait'
            }

//            {
//              browserName: 'ipad',
//              version: '8.1',
//              platform: 'OS X 10.9',
//              deviceName: 'iPad Simulator',
//              'device-orientation': 'portrait'
//            }//,

//            {
//              browserName: 'android',
//              version: '4.3',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.2',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.1',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.0',
//              platform: 'Linux',
//              deviceName: 'Android Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.4',
//              platform: 'Linux',
//              deviceName: 'Google Nexus 7 HD Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.4',
//              platform: 'Linux',
//              deviceName: 'Google Nexus 7C Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.0',
//              platform: 'Linux',
//              deviceName: 'HTC Evo 3D Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.1',
//              platform: 'Linux',
//              deviceName: 'HTC One X Emulator',
//              'device-orientation': 'portrait'
//            },
//            {
//              browserName: 'android',
//              version: '4.4',
//              platform: 'Linux',
//              deviceName: 'LG Nexus 4 Emulator',
//              'device-orientation': 'portrait'
//            }
          ]
        }
      }
    }
  });

  grunt.registerTask('default', ['saucelabs-custom']);

};
