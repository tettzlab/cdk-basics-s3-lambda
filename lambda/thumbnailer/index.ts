import { S3Event, Context } from 'aws-lambda'
import * as s3 from '@aws-sdk/client-s3'
import { Stream } from 'stream'
import { Image } from 'image-js'

const region: string = process.env.REGION ?? ''
const inboxBucket: string = process.env.INBOX_BUCKET ?? ''
const outboxBucket: string = process.env.OUTBOX_BUCKET ?? ''
const imageSizeLimit: number = parseInt(process.env.IMAGE_SIZE_LIMIT ?? '2097152', 10)
const thumbnailWidth: number = parseInt(process.env.THUMBNAIL_WIDTH ?? '200', 10)
const thumbnailHeight: number = parseInt(process.env.THUMBNAIL_HEIGHT ?? '200', 10)
const thumbnailAspectRatio: number = thumbnailHeight / thumbnailWidth

export async function handler(event: S3Event, context: Context): Promise<object> {
  if (!region) {
    throw new Error(`Invalid process.env.REGION: ${region}`)
  }
  if (!outboxBucket) {
    throw new Error(`Invalid process.env.OUTBOX_BUCKET: ${outboxBucket}`)
  }
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`)
    console.log(`Context: ${JSON.stringify(context, null, 2)}`)
    const { bucket, object: file } = event.Records[0].s3

    if (!bucket || !bucket.name || !file || !file.key) {
      throw new Error(
        `Invalid s3 event: bucket=${JSON.stringify(bucket)} object=${JSON.stringify(file)}`
      )
    }
    if (inboxBucket && bucket.name !== inboxBucket) {
      throw new Error(`S3 event was sent from ${bucket.name}, which must be ${inboxBucket}`)
    }
    if (bucket.name === outboxBucket) {
      throw new Error(
        `S3 event was sent from the destination bucket - ${outboxBucket} - itself, which may cause recursive invocations`
      )
    }
    if (!file.key.match(/\.(jpe?g|png|tiff?)$/i)) {
      console.log(`The object ${bucket.name}/${file.key} seems not to be an image file. Ignored.`)
      return {
        statusCode: 200,
        body: JSON.stringify({}),
      }
    }

    const s3Client = new s3.S3Client({ region })
    const getRes: s3.GetObjectCommandOutput = await s3Client.send(
      new s3.GetObjectCommand({
        Bucket: bucket.name,
        Key: file.key,
      })
    )
    console.log(
      'GetObject:',
      JSON.stringify(
        {
          Bucket: bucket.name,
          Key: file.key,
          httpStatusCode: getRes['$metadata'].httpStatusCode,
          ETag: getRes.ETag,
          LastModified: getRes.LastModified,
          ContentLength: getRes.ContentLength,
          ContentType: getRes.ContentType,
          ContentEncoding: getRes.ContentEncoding,
        },
        null,
        2
      )
    )

    if (getRes.Body == null) {
      throw new Error(`GetObject failed: ${getRes}`)
    }
    if (getRes.DeleteMarker) {
      throw new Error(`The object ${file.key} is a delete marker.`)
    }
    console.log('Reading stream...')
    const body: Buffer = await readStream(getRes.Body as Stream)

    let output: Uint8Array = new Uint8Array(body)
    if (output.byteLength > 0 && output.byteLength <= imageSizeLimit) {
      console.log('Processing image...')
      output = await thumbnail(body)
      const putRes: s3.PutObjectCommandOutput = await s3Client.send(
        new s3.PutObjectCommand({
          Bucket: outboxBucket,
          Key: file.key,
          Body: output,
        })
      )
      console.log(
        'PutObject:',
        JSON.stringify(
          {
            Bucket: outboxBucket,
            Key: file.key,
            Body: output.byteLength,
            httpStatusCode: putRes['$metadata'].httpStatusCode,
            ETag: putRes.ETag,
          },
          null,
          2
        )
      )
    } else {
      console.log(
        `The size of ${bucket.name}/${file.key} is either too large or too small. Ignored.`
      )
    }
    console.log('done')

    return {
      statusCode: 200,
      body: JSON.stringify({}),
    }
  } catch (err: unknown) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err }),
    }
  }
}

async function readStream(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const bufs = Array<Buffer>()
    stream.on('data', (chunk) => {
      bufs.push(chunk)
    })
    stream.on('end', () => {
      resolve(Buffer.concat(bufs))
    })
    stream.on('error', (err) => {
      reject(err)
    })
  })
}

async function thumbnail(imageBuffer: Uint8Array): Promise<Uint8Array> {
  let image = await Image.load(imageBuffer)
  let w = image.width
  let h = image.height
  const aspectRatio = h / w
  if (aspectRatio > thumbnailAspectRatio) {
    image = image.resize({
      width: thumbnailWidth,
      preserveAspectRatio: true,
    })
  } else {
    image = image.resize({
      height: thumbnailHeight,
      preserveAspectRatio: true,
    })
  }
  w = image.width
  h = image.height
  image = image.crop({
    x: (w - thumbnailWidth) / 2,
    y: (h - thumbnailHeight) / 2,
    width: thumbnailWidth,
    height: thumbnailHeight,
  })
  return image.toBuffer()
}

// const testEvent = {
//   Records: [
//     {
//       s3: {
//         bucket: {
//           name: 'testbucket',
//           arn: 'arn:aws:s3:::testbucket',
//         },
//         object: {
//           key: 'testimage.jpg',
//           size: 1024,
//         },
//       },
//     },
//   ],
// };
// (async function () {
//   await handler(testEvent as S3Event, {} as Context)
// })()
