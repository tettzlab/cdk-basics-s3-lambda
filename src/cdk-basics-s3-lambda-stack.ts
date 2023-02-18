import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib'
// import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import {
  Bucket,
  BucketEncryption,
  EventType,
  BlockPublicAccess,
  BucketProps,
} from 'aws-cdk-lib/aws-s3'
import { Architecture, Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources'
import { Construct } from 'constructs'

export class CdkBasicsS3LambdaStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const thumbnailer = new Function(this, 'thumbnailer', {
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('./lib/src/lambda'),
      handler: 'thumbnailer.handler',
      timeout: Duration.seconds(90),
      environment: {
        REGION: Stack.of(this).region,
        AZ: JSON.stringify(Stack.of(this).availabilityZones),
      },
    })

    const bucketProps: BucketProps = {
      autoDeleteObjects: true, // NOTICE!
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.UNENCRYPTED, // NOTICE!
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY, // NOTICE!
      versioned: false,
    }
    const inboxBucket = new Bucket(this, 'inboxBucket', {
      ...bucketProps,
      bucketName: 'inbox',
    })
    const outboxBucket = new Bucket(this, 'outboxBucket', {
      ...bucketProps,
      bucketName: 'outbox',
    })

    inboxBucket.grantRead(thumbnailer)
    outboxBucket.grantWrite(thumbnailer)

    thumbnailer.addEventSource(
      new S3EventSource(inboxBucket, {
        events: [EventType.OBJECT_CREATED_PUT],
      })
    )

    new CfnOutput(this, 'thumbnailerArn', {
      value: thumbnailer.functionArn,
    })
    new CfnOutput(this, 'inboxBucketArn', {
      value: inboxBucket.bucketArn,
    })
    new CfnOutput(this, 'outboxBucketArn', {
      value: outboxBucket.bucketArn,
    })
  }
}
