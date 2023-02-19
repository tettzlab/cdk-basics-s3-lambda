import { Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { S3EventSource, S3EventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources'
import { Construct } from 'constructs'

interface S3LambdaProps extends StackProps {
  production?: boolean
  lambdaProps?: lambda.FunctionProps
  inputBucketProps?: s3.BucketProps
  outputBucketProps?: s3.BucketProps
  s3EventSourceProps?: S3EventSourceProps
}

export class S3Lambda extends Construct {
  public readonly inputBucket: s3.Bucket
  public readonly lambdaFunc: lambda.Function
  public readonly outputBucket: s3.Bucket

  public constructor(scope: Construct, id: string, props?: S3LambdaProps) {
    super(scope, id)

    const production = props?.production !== false

    const bucketProps: s3.BucketProps = {
      autoDeleteObjects: !production, // NOTICE!
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: production ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY, // NOTICE!
      versioned: false,
    }
    this.inputBucket = new s3.Bucket(this, 'InputBucket', {
      ...bucketProps,
      ...(props?.inputBucketProps ?? {}),
    })
    this.outputBucket = new s3.Bucket(this, 'OutputBucket', {
      ...bucketProps,
      ...(props?.outputBucketProps ?? {}),
    })

    this.lambdaFunc = new lambda.Function(this, 'Function', {
      architecture: lambda.Architecture.X86_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      code: lambda.Code.fromAsset('./bundle/thumbnailer', {
        exclude: production ? ['*.map'] : [],
      }),
      handler: 'index.handler',
      timeout: Duration.seconds(180),
      environment: {
        REGION: Stack.of(this).region,
        INBOX_BUCKET: this.inputBucket.bucketName,
        OUTBOX_BUCKET: this.outputBucket.bucketName,
        ...(props?.lambdaProps?.environment ?? {}),
      },
      ...(props?.lambdaProps ?? {}),
    })

    this.inputBucket.grantRead(this.lambdaFunc)
    this.outputBucket.grantWrite(this.lambdaFunc)

    this.lambdaFunc.addEventSource(
      new S3EventSource(this.inputBucket, {
        events: [s3.EventType.OBJECT_CREATED_PUT],
        ...(props?.s3EventSourceProps ?? {}),
      })
    )
  }
}
