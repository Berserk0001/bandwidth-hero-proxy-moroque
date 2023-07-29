const isAnimated = require('is-animated')


const MIN_COMPRESS_LENGTH = 512; // Adjust the minimum compress length as desired
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 2;
const APNG_THRESH_LENGTH = MIN_COMPRESS_LENGTH * 2 //~200KB

function shouldCompress(req, buffer) {
    const { originType, originSize, avif} = req.params

    if (!originType.startsWith('image')) return false
    if (originSize === 0) return false
    if (avif && originSize < MIN_COMPRESS_LENGTH) return false
    if (
        (!avif &&
        (originType.endsWith('png') || originType.endsWith('gif') || originType.endsWith('jpg') || originType.endsWith('jpet')) &&
        originSize < MIN_TRANSPARENT_COMPRESS_LENGTH
    ) {
        return false
    }

    if (!process.env.DISABLE_ANIMATED && (originType.endsWith('png')) && isAnimated(buffer) && originSize < APNG_THRESH_LENGTH) {
        //It's an animated png file, let it pass through through if small enough
        return false
    }

    return true
}

module.exports = shouldCompress
