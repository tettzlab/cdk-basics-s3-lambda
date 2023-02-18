import { S3Event, Context } from 'aws-lambda'
import * as s3 from '@aws-sdk/client-s3'
import { Stream } from 'stream'
import Jimp from 'jimp'

const region: string | undefined = process.env.REGION
const outboxBucket: string | undefined = process.env.OUTBOX_BUCKET
const thunbnailMinWidth: number = parseInt(process.env.THUBNAIL_MIN_WIDTH ?? '100', 10)
const thunbnailMinHeight: number = parseInt(process.env.THUBNAIL_MIN_HEIGHT ?? '100', 10)

export async function handler(event: S3Event, context: Context): Promise<object> {
  if (region == null) {
    throw new Error(`Invalid env.REGION: ${region}`)
  }
  try {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`)
    console.log(`Context: ${JSON.stringify(context, null, 2)}`)
    const { bucket, object: file } = event.Records[0].s3
    // console.log('bucket', JSON.stringify(bucket, null, 2))
    // console.log('object', JSON.stringify(file, null, 2))

    if (!bucket || !bucket.name || !file || !file.key) {
      throw new Error(
        `Invalid s3 event: bucket=${JSON.stringify(bucket)} object=${JSON.stringify(file)}`
      )
    }
    if (bucket.name === outboxBucket) {
      throw new Error(`S3 event from an unexpected bucket: ${JSON.stringify(bucket)}`)
    }

    const s3Client = new s3.S3Client({ region })
    const getObjOutput: s3.GetObjectCommandOutput = await s3Client.send(
      new s3.GetObjectCommand({
        Bucket: bucket.name,
        Key: file.key,
      })
    )
    if (getObjOutput.Body == null) {
      throw new Error(`GetObject failed: ${getObjOutput}`)
    }
    const body: Buffer = await readStream(getObjOutput.Body as Stream)

    let output: Buffer = body
    if (file.key.match(/\.(jpe?g|png|gif|bmp|tiff?)$/i)) {
      output = await thumbnail(body)
    }

    await s3Client.send(
      new s3.PutObjectCommand({
        Bucket: outboxBucket,
        Key: file.key,
        Body: new Uint8Array(output),
      })
    )

    return {
      statusCode: 200,
      body: JSON.stringify({}),
    }
  } catch (err: unknown) {
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

async function thumbnail(image: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    Jimp.read(image, (err, jimp) => {
      if (err) {
        console.log(err)
        reject(err)
        return
      }
      const mime = jimp.getMIME()
      const width = Math.floor(jimp.getWidth() / 2)
      const height = Math.floor(jimp.getHeight() / 2)
      if (width < thunbnailMinWidth || height < thunbnailMinHeight) {
        // the image is small enough already.
        return image
      }
      jimp.resize(width, height, (err, thumb) => {
        if (err) {
          console.log(err)
          reject(err)
          return
        }
        thumb.getBuffer(mime, (err, buffer) => {
          if (err) {
            console.log(err)
            reject(err)
            return
          }
          resolve(buffer)
        })
      })
    })
  })
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
