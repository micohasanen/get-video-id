import getSrc from 'get-src';

/**
 * Get the id and service from a video url.
 * @param {String} str - the url from which you want to extract the id
 * @returns {Object}
 */
export default function getVideoId(str) {
	if (typeof str !== 'string') {
		throw new TypeError('get-video-id expects a string');
	}

	if (/<iframe/gi.test(str)) {
		str = getSrc(str);
	}

	// remove surrounding whitespaces or linefeeds
	str = str.trim();

	// remove the '-nocookie' flag from youtube urls
	str = str.replace('-nocookie', '');

	// remove any leading `www.`
	str = str.replace('/www.', '/');

	var metadata = {};

	// Try to handle google redirection uri
	if (/\/\/google/.test(str)) {
		// Find the redirection uri
		var matches = str.match(/url=([^&]+)&/);

		// Decode the found uri and replace current url string - continue with final link
		if (matches) {
			// Javascript can get encoded URI
			str = decodeURIComponent(matches[1]);
		}
	}

	if (/youtube|youtu\.be|y2u\.be|i.ytimg\./.test(str)) {
		metadata = {
			id: youtube(str),
			service: 'youtube'
		};
	} else if (/vimeo/.test(str)) {
		metadata = {
			id: vimeo(str),
			service: 'vimeo'
		};
	} else if (/vine/.test(str)) {
		metadata = {
			id: vine(str),
			service: 'vine'
		};
	} else if (/videopress/.test(str)) {
		metadata = {
			id: videopress(str),
			service: 'videopress'
		};
	}
	return metadata;
}

/**
 * Get the vimeo id.
 * @param {string} str - the url from which you want to extract the id
 * @returns {string|undefined}
 */
function vimeo(str) {
	if (str.indexOf('#') > -1) {
		str = str.split('#')[0];
	}
	if (str.indexOf('?') > -1 && str.indexOf('clip_id=') === -1) {
		str = str.split('?')[0];
	}

	var id;
	var arr;

	var primary = /https?:\/\/vimeo\.com\/([0-9]+)/;

	var matches = primary.exec(str);
	if (matches && matches[1]) {
		return matches[1];
	}

	var vimeoPipe = [
		'https?:\/\/player\.vimeo\.com\/video\/[0-9]+$',
		'https?:\/\/vimeo\.com\/channels',
		'groups',
		'album'
	].join('|');

	var vimeoRegex = new RegExp(vimeoPipe, 'gim');

	if (vimeoRegex.test(str)) {
		arr = str.split('/');
		if (arr && arr.length) {
			id = arr.pop();
		}
	} else if (/clip_id=/gim.test(str)) {
		arr = str.split('clip_id=');
		if (arr && arr.length) {
			id = arr[1].split('&')[0];
		}
	}

	return id;
}

/**
 * Get the vine id.
 * @param {string} str - the url from which you want to extract the id
 * @returns {string|undefined}
 */
function vine(str) {
	var regex = /https:\/\/vine\.co\/v\/([a-zA-Z0-9]*)\/?/;
	var matches = regex.exec(str);
	return matches && matches[1];
}

/**
 * Get the Youtube Video id.
 * @param {string} str - the url from which you want to extract the id
 * @returns {string|undefined}
 */
function youtube(str) {
	// remove time hash at the end of the string
	str = str.replace(/#t=.*$/, '');

	// shortcode
	var shortcode = /youtube:\/\/|https?:\/\/youtu\.be\/|http:\/\/y2u\.be\//g;

	if (shortcode.test(str)) {
		var shortcodeid = str.split(shortcode)[1];
		return stripParameters(shortcodeid);
	}

	// /v/ or /vi/
	var inlinev = /\/v\/|\/vi\//g;

	if (inlinev.test(str)) {
		var inlineid = str.split(inlinev)[1];
		return stripParameters(inlineid);
	}

	// v= or vi=
	var parameterv = /v=|vi=/g;

	if (parameterv.test(str)) {
		var arr = str.split(parameterv);
		return stripParameters(arr[1].split('&')[0]);
	}

	// v= or vi=
	var parameterwebp = /\/an_webp\//g;

	if (parameterwebp.test(str)) {
		var webp = str.split(parameterwebp)[1];
		return stripParameters(webp);
	}

	// embed
	var embedreg = /\/embed\//g;

	if (embedreg.test(str)) {
		var embedid = str.split(embedreg)[1];
		return stripParameters(embedid);
	}

	// ignore /user/username pattern
	var usernamereg = /\/user\/([a-zA-Z0-9]*)$/g;

	if (usernamereg.test(str)) {
		return undefined;
	}

	// user
	var userreg = /\/user\/(?!.*videos)/g;

	if (userreg.test(str)) {
		var elements = str.split('/');
		return stripParameters(elements.pop());
	}

	// attribution_link
	var attrreg = /\/attribution_link\?.*v%3D([^%&]*)(%26|&|$)/;

	if (attrreg.test(str)) {
		return stripParameters(str.match(attrreg)[1]);
	}
}

/**
 * Get the VideoPress id.
 * @param {string} str - the url from which you want to extract the id
 * @returns {string|undefined}
 */
function videopress(str) {
	var idRegex;
	if (str.indexOf('embed') > -1) {
		idRegex = /embed\/(\w{8})/;
		return str.match(idRegex)[1];
	}

	idRegex = /\/v\/(\w{8})/;

	var match = str.match(idRegex);

	if (match && match.length > 0) {
		return str.match(idRegex)[1];
	}
	return undefined;
}

/**
 * Strip away any parameters following `?` or `/` or '&'
 * @param str
 * @returns {String}
 */
function stripParameters(str) {
	// Split parameters or split folder separator
	if (str.indexOf('?') > -1) {
		return str.split('?')[0];
	} else if (str.indexOf('/') > -1) {
		return str.split('/')[0];
	} else if (str.indexOf('&') > -1) {
		return str.split('&')[0];
	}
	return str;
}
