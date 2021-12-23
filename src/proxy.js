import  request from 'request'
import  pick from 'lodash'
import  shouldCompress from './shouldCompress.js'
import  redirect from './redirect.js'
import  compress from './compress.js'
import  reEncode from './reEncode.js'
import  bypass from './bypass.js'
import  copyHeaders from './copyHeaders.js'

function proxy(req, res) {
    var isMediaStream
  request.get(
    req.params.url,
    {
      headers: {
        ...pick(req.headers, ['cookie', 'dnt', 'referer']),
        'user-agent': 'Bandwidth-Hero Compressor',
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip,
        via: '1.1 bandwidth-hero'
      },
      timeout: 10000,
      maxRedirects: 5,
      encoding: null,
      strictSSL: false,
      gzip: true,
      jar: true
    },
    (err, origin, buffer) => {
      if (err || origin.statusCode >= 400) return redirect(req, res)

      if(!isMediaStream){
        copyHeaders(origin, res)
        res.setHeader('content-encoding', 'identity')
        let originType = origin.headers['content-type'] || ''
        req.params.originType = originType
        req.params.originSize = buffer.length

        if (shouldCompress(req, buffer)) {
            isMediaStream = false
            compress(req, res, buffer)
        } else if (originType.startsWith('video') || originType.startsWith('audio')){
        //  reEncode(req, res, buffer)
        } else {
            bypass(req, res, buffer)
        }
      }
    }
  ).on('response', function(response) {
    let originType = response.headers['content-type'] || ''
    if (originType.startsWith('video') || originType.startsWith('audio')){
        isMediaStream = true
        reEncode(req, res)
      }
  }).on('error', function(err) {
    console.error(err)
    return redirect(req, res)
  })
}

export default proxy
