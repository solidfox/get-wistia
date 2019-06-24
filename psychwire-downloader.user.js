// ==UserScript==
// @name         Psychwire video downloader
// @downloadURL  https://github.com/Lambik/wistia-downloader/raw/master/teachable-downloader.user.js
// @namespace    https://github.com/Lambik/
// @version      0.3
// @description  Make all wistia videos downloadable on teachable courses
// @author       You
// @match        *://*.psychwire.com/*
// @match        *://*.wistia.net/embed/iframe/*
// @grant        GM_xmlhttpRequest
// @require http://code.jquery.com/jquery-latest.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let regex = /fast\.wistia\.net\/embed\/iframe\/([\d\w]+)/g;

    function getLocationBarWistiaId() {
        let result = regex.exec(window.self.location.href);
        if (result && result.length > 1) {
            return result[1];
        }
    }

    function parseVideos() {
        let ids = regex.exec($("html")[0].innerHTML);
        ids = ids ? ids.filter((str) => !(str.startsWith("fast.wistia.net"))) : [];

        let locationBarWistiaId = getLocationBarWistiaId();
        if (locationBarWistiaId) {
            ids.push(locationBarWistiaId);
        }

        console.log(ids);

        let wrapper = document.createElement('div');
        wrapper.id = "comSchlaugDownloadwindow";
        wrapper.style.backgroundColor = 'rgba(0,0,0,0.90)';
        wrapper.style.color = 'white';
        wrapper.style.borderRadius = '5px';
        wrapper.style.padding = '5px';
        wrapper.style.position = 'fixed';
        wrapper.style.bottom = '40px';
        wrapper.style.left = '10px';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'row';
        wrapper.style.alignItems = 'flexStart';
        wrapper.style.overflow = 'scroll';
        wrapper.style.zIndex = '100000000000000';

        for (let id of ids) {
            let wistiaId = id;

            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://fast.wistia.net/embed/iframe/' + wistiaId,
                onerror: function(result) {
                    console.error('xmlrequest error', result);
                },
                onabort: function(result) {
                    console.error('xmlrequest abort', result);
                },
                onload: function(result) {
                    let body = result.responseText;
                    let assets = body.match(/"assets":(\[.*?\])/);
                    if (assets.length) {
                        let allvids = JSON.parse(assets[1]);
                        console.log(allvids);
                        let newNode = document.createElement('div');
                        let str = "<h4>" + id + "</h4><ul style='padding:5px;'>";
                        for (let vid of allvids) {
                            if (vid.type != 'hls_video' && vid.public) {
                                str += '<li style="padding:3px; display:flex; flex-direction:row; justify-content:space-between;"><div>' + vid.display_name + ' (' + vid.width + 'x' + vid.height + ', ' + vid.ext + '):</div><div style="padding-left:10px;"><a href="' + vid.url + '" target="_blank">' + formatBytes(vid.size) + '</a></div></li>';
                            }
                        }
                        str += "</ul>";
                        newNode.innerHTML = str;
                        wrapper.appendChild(newNode);
                    }
                    else {
                        console.error('wista returned invalid data', body);
                    }
                }
            });
        }
        window.self.document.body.append(wrapper);
    }

    // thanks to https://stackoverflow.com/a/18650828/102720
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // parseVideos();

    // window.addEventListener('lecture:ajax_success', parseVideos);
    $('body').append('<div id="CP"><input id="comSchlaugDownload" type="button" value="Download video"><input id="comSchlaugClose" type="button" value="Close"></div>')
    $("#CP").css("position", "fixed").css("bottom", 10).css("left", 10).css("z-index", 100000);
    $('#comSchlaugDownload').click(parseVideos);
    $('#comSchlaugClose').click(function () {$("#comSchlaugDownloadwindow").remove()});
})();
