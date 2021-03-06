/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 * @requires widgets/PlaybackToolbar.js
 * @requires widgets/PlaybackOptionsPanel.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = Playback
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: Playback(config)
 *
 *    Provides an action to display a Playback in a new window.
 */
gxp.plugins.Playback = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_playback */
    ptype: "gxp_playback",
    
    /** api: config[menuText]
     *  ``String``
     *  Text for Playback menu item (i18n).
     */
    menuText: "Time Playback",

    /** api: config[tooltip]
     *  ``String``
     *  Text for Playback action tooltip (i18n).
     */
    tooltip: "Show Time Playback Panel",

    /** api: config[actionTarget]
     *  ``Object`` or ``String`` or ``Array`` Where to place the tool's actions
     *  (e.g. buttons or menus)? Use null as the default since our tool has both 
     *  output and action(s).
     */
    actionTarget: null,

    /** api: config[outputTarget]
     *  ``Object`` or ``String`` Where to place the tool's output (widgets.PlaybackPanel)
     *  Use 'map' as the default to display a transparent floating panel over the map.
     */
    outputTarget: 'map',
    
    /** private: method[constructor]
     */
    constructor: function(config) {
        gxp.plugins.Playback.superclass.constructor.apply(this, arguments);
    },
    /** private: method[addOutput]
     *  :arg config: ``Object``
     */
    addOutput: function(config){
        delete this._ready;
        config = config || {};
        var toolbar = gxp.plugins.Playback.superclass.addOutput.call(this, Ext.apply(config,{
            xtype: 'gxp_playbacktoolbar',
            mapPanel:this.target.mapPanel,
            playbackMode:this.playbackMode,
            optionsWindow: new Ext.Window({
                title: gxp.PlaybackOptionsPanel.prototype.titleText,
                width: 300,
                height: 425,
                layout: 'fit',
                items: [{xtype: 'gxp_playbackoptions'}],
                closeable: true,
                closeAction: 'hide',
                renderTo: Ext.getBody(),
                listeners: {
                    'show': function(cmp){
                        var optsPanel = cmp.findByType('gxp_playbackoptions')[0];
                        optsPanel.fireEvent('show', optsPanel);
                    },
                    'hide': function(cmp){
                        var optsPanel = cmp.findByType('gxp_playbackoptions')[0];
                        optsPanel.fireEvent('hide', optsPanel);
                    }
                }
            })
        }));
        this.relayEvents(toolbar,['timechange','rangemodified'])
        this.playbackToolbar = toolbar;
        //firing the 'rangemodified' event to indicate that the toolbar has been created with temporal layers
        if(toolbar.control.layers){
            this.fireEvent('rangemodified',this,toolbar.control.range);
        }
        return toolbar;
    },
    addActions: function(actions){
        this._ready = 0;
        this.target.mapPanel.map.events.register('addlayer', this, function(e) {
            var layer = e.layer;
            if (layer instanceof OpenLayers.Layer.WMS && layer.dimensions && layer.dimensions.time) {
                this.target.mapPanel.map.events.unregister('addlayer', this, arguments.callee);
                this._ready += 1;
                if (this._ready > 1) {
                    this.addOutput();
                }
            }
        });

        this.target.on('ready',function() {
            this._ready += 1;
            if (this._ready > 1) {
                this.addOutput();
            }
        }, this);
    },
    /** api: method[setTime]
     *  :arg time: {Date}
     *  :return: {Boolean} - true if the time could be set to the supplied value
     *          false if the time is outside the current range of the TimeManager
     *          control.
     *          
     *  Set the time represented by the playback toolbar programatically
     */
    setTime: function(time){
        return this.playbackToolbar.setTime(time);
    },
    /** api: method[getState]
     *  :returns {Object} - initial config plus any user configured settings
     *  
     *  Tool specific implementation of the getState function
     */
    getState: function(){
        var config = gxp.plugins.Playback.superclass.getState.call(this);
        var toolbar = this.playbackToolbar;
        var control = toolbar.control;
        config.outputConfig = {
            dynamicRange: toolbar.dyanamicRange,
            playbackMode: toolbar.playbackMode
        };
        config.outputConfig.controlConfig = {
            range: (control.fixedRange) ? control.range : undefined,
            step: control.step,
            units: control.units,
            loop: control.units,
            snapToIntervals: control.snapToIntervals
        }
        return config;
    }
});

Ext.preg(gxp.plugins.Playback.prototype.ptype, gxp.plugins.Playback);
