/**
     * @class dr.videoplayer {UI Components, Media Components}
     * @extends dr.view
     * A media component that displays videos.
     *
     *     @example wide
     *
     *     <spacedlayout axis="x" spacing="5"></spacedlayout>
     *     <videoplayer id="hplayer" width="200" height="150"
     *                  src="{'video/mp4' : 'http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4',
     *                        'video/webm' : 'http://www.quirksmode.org/html5/videos/big_buck_bunny.webm',
     *                        'video/ogv' : 'http://www.quirksmode.org/html5/videos/big_buck_bunny.ogv'}">
     *     </videoplayer>
     *
     *     <videoplayer id="aplayer" width="200" height="150" controls="false"
     *                  src="['http://techslides.com/demos/sample-videos/small.mp4',
     *                        'http://techslides.com/demos/sample-videos/small.webm',
     *                        'http://techslides.com/demos/sample-videos/small.ogv',
     *                        'http://techslides.com/demos/sample-videos/small.3gp']">
     *     </videoplayer>
     */
/**
    * @attribute {Object} [video]
    * @readonly
    * The underlying native video element.
    */
/**
      * @attribute {Boolean} [controls=true]
      * Set to false to hide the video controls.
      */
/**
      * @attribute {String} [poster]
      * An image that appears before playing, when no video frame is 
      * available yet.
      */
/**
      * @attribute {Boolean} [preload=true]
      * Set to false to refrain from preloading video content when the tag loads.
      */
/**
      * @attribute {Boolean} [loop=false]
      * Should be video loop when reaching the end of the video.
      */
/**
      * @attribute {Number} [volume=0.5]
      */
/**
      * @attribute {Number} [duration=0]
      * @readonly
      * The length of the video, is automatically set after the video begins 
      * to load.
      */
/**
      * @attribute {Number} [currenttime=0]
      * The current playback index, in seconds. Set to value to seek in the video.
      */
/**
      * @attribute {Boolean} [playing=false]
      * Indicates if the video is currently playing, set to true to 
      * begin playback.
      */
/**
      * @attribute {Object} [src]
      * The video source, which is either an array of urls with the correct filetype extensions:
      *
      *     @example
      *     <videoplayer id="player" width="300" height="150"
      *                  src='["http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4",
      *                        "http://www.quirksmode.org/html5/videos/big_buck_bunny.webm",
      *                        "http://www.quirksmode.org/html5/videos/big_buck_bunny.ogv"]'>
      *     </videoplayer>
      *
      * Alternatively, a hash of `{mime-type: url}` pairs.
      *
      *     @example
      *     <videoplayer id="player" width="300" height="150"
      *                  src='{"video/mp4" : "http://www.quirksmode.org/html5/videos/big_buck_bunny.mp4",
      *                        "video/webm" : "http://www.quirksmode.org/html5/videos/big_buck_bunny.webm",
      *                        "video/ogg" : "http://www.quirksmode.org/html5/videos/big_buck_bunny.ogv"}'>
      *     </videoplayer>
      */
