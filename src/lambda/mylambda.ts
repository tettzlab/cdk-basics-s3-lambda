import { S3CreateEvent, Context, S3EventRecord } from 'aws-lambda'

export const handler = async (event: S3CreateEvent, context: Context): Promise<object> => {
  console.log('event', event)
  try {
    const record = event.Records[0] as S3EventRecord
    const {
      bucket,
      object,
    } = record.s3
    console.log('bucket', bucket)
    console.log('object', object)

    return {
      statusCode: 200,
      body: JSON.stringify({})
    }
  } catch (err: unknown) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 'error': err })
    }
  }
}
